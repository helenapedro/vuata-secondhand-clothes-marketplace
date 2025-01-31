import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { CartItem, Product } from '../types';
import toast from 'react-hot-toast';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { supabase } from '../lib/supabase';

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
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
      const q = query(collection(db, 'cart_items'), where('user_id', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const items: CartItem[] = [];
      for (const doc of querySnapshot.docs) {
        const itemData = doc.data() as CartItem;

        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', itemData.product_id)
          .single();

        if (productError) throw productError;

        items.push({
          ...itemData,
          id: doc.id,
          product: productData as Product,
        });
      }
      setCartItems(items);
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

      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      if (!productData || productData.stock < 1) {
        toast.error('Produto fora de estoque');
        return false;
      }

      // Check if product already exists in cart
      const existingCartItem = cartItems.find(item => item.product_id === productId);

      if (existingCartItem) {
        // Update quantity if product already exists
        await updateDoc(doc(db, 'cart_items', existingCartItem.id), {
          quantity: existingCartItem.quantity + 1
        });
      } else {
        await addDoc(collection(db, 'cart_items'), {
          user_id: firebaseUser.uid,
          product_id: productId,
          quantity: 1
        });
      }

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

      const q = query(collection(db, 'cart_items'), where('user_id', '==', firebaseUser.uid), where('product_id', '==', productId));
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach(async (cartDoc) => {
        const cartDocRef = doc(db, 'cart_items', cartDoc.id);
        await updateDoc(cartDocRef, { quantity });
      });

      await fetchCart(firebaseUser);
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Erro ao atualizar quantidade');
    }
  }

  async function removeFromCart(productId: string) {
    try {
      if (!firebaseUser) return;

      const q = query(collection(db, 'cart_items'), where('user_id', '==', firebaseUser.uid), where('product_id', '==', productId));
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach(async (cartDoc) => {
        const cartDocRef = doc(db, 'cart_items', cartDoc.id);
        await deleteDoc(cartDocRef);
      });

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
