import { useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { supabase } from '../lib/supabase'; 
import { CartItem, Product } from '../types';
import toast from 'react-hot-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, setDoc, deleteDoc } from 'firebase/firestore';

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchCart(user.uid);
      } else {
        setCartItems([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function fetchCart(userId: string) {
    setLoading(true);

    try {
      const q = query(collection(db, 'cart_items'), where('user_id', '==', userId));
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id, user_id: userId, quantity: doc.data().quantity, product_id: doc.data().product_id }));

      // Fetch product details from Supabase
      const productIds = items.map(item => item.product_id);
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      if (error) throw error;

      // Combine cart items with product details
      const cartItemsWithDetails = items.map(item => {
        const product = products.find(p => p.id === item.product_id);
        return {
          ...item,
          product: product as Product,
        };
      });

      setCartItems(cartItemsWithDetails);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addToCart(productId: string) {
    const user = auth.currentUser;

    if (!user) {
      toast.error('Por favor, faça login para adicionar itens ao carrinho');
      return false;
    }

    try {
      const q = query(collection(db, 'cart_items'), where('user_id', '==', user.uid), where('product_id', '==', productId));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        await addDoc(collection(db, 'cart_items'), {
          user_id: user.uid,
          product_id: productId,
          quantity: 1
        });
      } else {
        const docRef = querySnapshot.docs[0].ref;
        await setDoc(docRef, {
          user_id: user.uid,
          product_id: productId,
          quantity: 1
        }, { merge: true });
      }

      toast.success('Item adicionado ao carrinho');
      await fetchCart(user.uid);
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Erro ao adicionar item ao carrinho');
      return false;
    }
  }

  async function removeFromCart(productId: string) {
    const user = auth.currentUser;

    if (!user) return;

    try {
      const q = query(collection(db, 'cart_items'), where('user_id', '==', user.uid), where('product_id', '==', productId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        await deleteDoc(docRef);
        toast.success('Item removido do carrinho');
        await fetchCart(user.uid);
      }
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
