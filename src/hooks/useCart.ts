import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CartItem } from '../types';
import toast from 'react-hot-toast';

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCart();
  }, []);

  async function fetchCart() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data, error } = await supabase
          .from('cart_items')
          .select(`
            *,
            product:products(*)
          `)
          .eq('user_id', session.user.id);

        if (error) throw error;
        setCartItems(data || []);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addToCart(productId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Por favor, faça login para adicionar itens ao carrinho');
        return false;
      }

      const { error } = await supabase
        .from('cart_items')
        .upsert({
          user_id: session.user.id,
          product_id: productId,
          quantity: 1
        }, {
          onConflict: 'user_id,product_id'
        });

      if (error) throw error;
      
      toast.success('Item adicionado ao carrinho');
      await fetchCart();
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Erro ao adicionar item ao carrinho');
      return false;
    }
  }

  async function removeFromCart(productId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', session.user.id)
        .eq('product_id', productId);

      if (error) throw error;
      
      toast.success('Item removido do carrinho');
      await fetchCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Erro ao remover item do carrinho');
    }
  }

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.quantity * item.product.price), 0);

  return {
    cartItems,
    loading,
    addToCart,
    removeFromCart,
    totalItems,
    totalPrice,
  };
}