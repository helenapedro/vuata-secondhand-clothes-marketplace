import React from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Profile() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [profile, setProfile] = React.useState<any>(null);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserProfile(user.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function fetchUserProfile(userId: string) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserRole(userData.role);
        setProfile(userData);
        if (userData.role === 'vendedor') {
          fetchUserProducts(userId);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserProducts(userId: string) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Erro ao carregar seus produtos');
    }
  }

  async function handleDelete(productId: string) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      setProducts(products.filter(p => p.id !== productId));
      toast.success('Produto removido com sucesso');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Erro ao remover produto');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Meu Perfil</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Informações Pessoais</h2>
            <div className="space-y-3">
              <p><span className="font-medium">Nome:</span> {profile?.full_name}</p>
              <p><span className="font-medium">Email:</span> {profile?.email}</p>
              <p><span className="font-medium">Tipo de Conta:</span> {profile?.role === 'vendedor' ? 'Vendedor' : 'Cliente'}</p>
              {profile?.role === 'vendedor' && (
                <>
                  <p><span className="font-medium">WhatsApp:</span> {profile?.whatsapp}</p>
                  {profile?.linkedin_url && (
                    <p>
                      <span className="font-medium">LinkedIn:</span>{' '}
                      <a 
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-700"
                      >
                        Ver Perfil
                      </a>
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {userRole === 'vendedor' && (
        <>
          <h2 className="text-2xl font-bold mb-6">Meus Produtos</h2>
          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">Você ainda não tem produtos listados</p>
              <Link
                to="/sell"
                className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
              >
                Listar Seu Primeiro Produto
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h2 className="text-lg font-semibold mb-2">{product.title}</h2>
                    <p className="text-indigo-600 font-bold">
                      {new Intl.NumberFormat('pt-AO', {
                        style: 'currency',
                        currency: 'AOA'
                      }).format(product.price)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Tamanho: {product.size} • Estado: {product.condition}
                    </p>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="mt-4 text-red-600 text-sm hover:text-red-700"
                    >
                      Remover Produto
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
