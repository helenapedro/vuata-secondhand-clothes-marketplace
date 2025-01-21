import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { supabase } from '../lib/supabase';

export default function Cart() {
  const navigate = useNavigate();
  const { cartItems, loading, removeFromCart, totalPrice } = useCart();
  const [checkingOut, setCheckingOut] = React.useState(false);

  const handleCheckout = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Por favor, faça login para finalizar a compra');
        navigate('/auth');
        return;
      }

      setCheckingOut(true);
      // Here we would integrate with Multicaixa Express
      // For now, we'll just show a success message
      toast.success('Pedido realizado com sucesso!');
      navigate('/profile');
    } catch (error) {
      console.error('Error during checkout:', error);
      toast.error('Erro ao processar o pagamento');
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Seu Carrinho</h1>
        <p className="text-gray-600 mb-8">Seu carrinho está vazio</p>
        <Link
          to="/"
          className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
        >
          Continuar Comprando
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Seu Carrinho</h1>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 space-y-6">
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center space-x-4">
              <img
                src={item.product.image_url}
                alt={item.product.title}
                className="w-24 h-24 object-cover rounded-md"
              />
              <div className="flex-1">
                <h3 className="font-semibold">{item.product.title}</h3>
                <p className="text-gray-600">
                  Tamanho: {item.product.size} • Estado: {item.product.condition}
                </p>
                <p className="text-indigo-600 font-bold">
                  {new Intl.NumberFormat('pt-AO', {
                    style: 'currency',
                    currency: 'AOA'
                  }).format(item.product.price)}
                </p>
              </div>
              <button
                onClick={() => removeFromCart(item.product.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
        <div className="border-t p-6 bg-gray-50">
          <div className="flex justify-between mb-4">
            <span className="font-semibold">Total:</span>
            <span className="font-bold text-xl">
              {new Intl.NumberFormat('pt-AO', {
                style: 'currency',
                currency: 'AOA'
              }).format(totalPrice)}
            </span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={checkingOut}
            className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {checkingOut ? 'Processando...' : 'Finalizar Compra'}
          </button>
          <p className="text-sm text-gray-600 mt-4 text-center">
            Pagamento seguro via Transferencia Express
          </p>
        </div>
      </div>
    </div>
  );
}