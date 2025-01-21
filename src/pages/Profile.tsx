import React from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Profile() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchUserProducts();
  }, []);

  async function fetchUserProducts() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load your products');
    } finally {
      setLoading(false);
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
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
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
    <div>
      <h1 className="text-3xl font-bold mb-8">My Listed Items</h1>
      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">You haven't listed any items yet.</p>
          <Link
            to="/sell"
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
          >
            List Your First Item
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
                  Size: {product.size} • Condition: {product.condition}
                </p>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="mt-4 text-red-600 text-sm hover:text-red-700"
                >
                  Delete Listing
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}