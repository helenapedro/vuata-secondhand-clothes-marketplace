import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CartItem } from '../types';
import toast from 'react-hot-toast';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      console.log('setFirebaseUser:', user);
      if (user) {
        fetchCart(user);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function fetchCart(user: User) {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', user.uid);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addToCart(productId: string) {
    try {
      if (!firebaseUser) {
        toast.error('Por favor, faça login para adicionar itens ao carrinho');
        return false;
      }

      // Check stock availability
      const { data: product } = await supabase
        .from('products')
        .select('stock')
        .eq('id', productId)
        .single();

      if (!product || product.stock < 1) {
        toast.error('Produto fora de estoque');
        return false;
      }

      const { error } = await supabase
        .from('cart_items')
        .upsert({
          user_id: firebaseUser.uid,
          product_id: productId,
          quantity: 1
        }, {
          onConflict: 'user_id,product_id'
        });

      if (error) throw error;
      
      toast.success('Item adicionado ao carrinho');
      await fetchCart(firebaseUser);
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Erro ao adicionar item ao carrinho');
      return false;
    }
  }

  async function updateQuantity(productId: string, quantity: number) {
    try {
      if (!firebaseUser) return;

      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('user_id', firebaseUser.uid)
        .eq('product_id', productId);

      if (error) throw error;
      await fetchCart(firebaseUser);
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Erro ao atualizar quantidade');
    }
  }

  async function removeFromCart(productId: string) {
    try {
      if (!firebaseUser) return;

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', firebaseUser.uid)
        .eq('product_id', productId);

      if (error) throw error;
      
      toast.success('Item removido do carrinho');
      await fetchCart(firebaseUser);
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
    updateQuantity,
    totalItems,
    totalPrice,
  };
}
