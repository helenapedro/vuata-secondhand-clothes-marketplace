import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [role, setRole] = React.useState('cliente');
  const [whatsapp, setWhatsapp] = React.useState('');
  const [identityNumber, setIdentityNumber] = React.useState('');
  const [linkedinUrl, setLinkedinUrl] = React.useState('');
  const [isSignUp, setIsSignUp] = React.useState(false);

  const validateForm = () => {
    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return false;
    }

    if (isSignUp) {
      if (!fullName) {
        toast.error('Por favor, informe seu nome completo');
        return false;
      }

      if (role === 'vendedor') {
        if (!whatsapp) {
          toast.error('Vendedores devem fornecer um número de WhatsApp');
          return false;
        }
        if (!identityNumber) {
          toast.error('Vendedores devem fornecer o Nº do Bilhete de Identidade');
          return false;
        }
      }

      if (password.length < 6) {
        toast.error('A senha deve ter pelo menos 6 caracteres');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role,
              ...(role === 'vendedor' && {
                whatsapp,
                identity_number: identityNumber,
                linkedin_url: linkedinUrl || null,
              }),
            },
          },
        });

        if (error) throw error;
        
        if (data?.user) {
          toast.success('Conta criada com sucesso!');
          navigate('/');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        toast.success('Login realizado com sucesso!');
        navigate('/');
      }
    } catch (error: any) {
      let message = 'Ocorreu um erro. Por favor, tente novamente.';
      
      if (error.message.includes('Email not confirmed')) {
        message = 'Por favor, confirme seu email antes de fazer login';
      } else if (error.message.includes('Invalid login credentials')) {
        message = 'Email ou senha incorretos';
      } else if (error.message.includes('User already registered')) {
        message = 'Este email já está registrado';
      }
      
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">
        {isSignUp ? 'Criar Conta' : 'Bem-vindo de Volta'}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nome Completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
                minLength={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tipo de Conta
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                <option value="cliente">Cliente</option>
                <option value="vendedor">Vendedor</option>
              </select>
            </div>
            {role === 'vendedor' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+244 XXX XXX XXX"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nº Bilhete de Identidade
                  </label>
                  <input
                    type="text"
                    value={identityNumber}
                    onChange={(e) => setIdentityNumber(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    LinkedIn URL (opcional)
                  </label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/seu-perfil"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </>
            )}
          </>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Senha
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
            minLength={6}
          />
          {isSignUp && (
            <p className="mt-1 text-sm text-gray-500">
              Mínimo de 6 caracteres
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Processando...' : isSignUp ? 'Criar Conta' : 'Entrar'}
        </button>
      </form>
      <button
        onClick={() => setIsSignUp(!isSignUp)}
        className="mt-4 text-sm text-indigo-600 hover:text-indigo-500"
      >
        {isSignUp
          ? 'Já tem uma conta? Entre'
          : 'Não tem uma conta? Cadastre-se'}
      </button>
    </div>
  );
}