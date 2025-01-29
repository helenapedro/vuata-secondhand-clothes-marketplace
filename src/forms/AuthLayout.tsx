import React from 'react';

interface AuthLayoutProps {
  isSignUp: boolean;
  loading: boolean;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  fullName?: string;
  setFullName?: (value: string) => void;
  role?: string;
  setRole?: (value: string) => void;
  whatsapp?: string;
  setWhatsapp?: (value: string) => void;
  identityNumber?: string;
  setIdentityNumber?: (value: string) => void;
  linkedinUrl?: string;
  setLinkedinUrl?: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleToggleAuth: () => void;
  handleEmailLinkSignIn: () => void;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  isSignUp,
  loading,
  email,
  setEmail,
  password,
  setPassword,
  fullName,
  setFullName,
  role,
  setRole,
  whatsapp,
  setWhatsapp,
  identityNumber,
  setIdentityNumber,
  linkedinUrl,
  setLinkedinUrl,
  handleSubmit,
  handleToggleAuth,
  handleEmailLinkSignIn,
}) => {
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">
        {isSignUp ? 'Criar Conta' : 'Bem-vindo de Volta'}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && setFullName && setRole && (
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
            {role === 'vendedor' && setWhatsapp && setIdentityNumber && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
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
                    onChange={(e) => setLinkedinUrl && setLinkedinUrl(e.target.value)}
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
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Processando...' : isSignUp ? 'Criar Conta' : 'Entrar'}
        </button>
      </form>
      <button onClick={handleToggleAuth} className="mt-4 text-sm text-indigo-600 hover:text-indigo-500">
        {isSignUp ? 'Já tem uma conta? Entre' : 'Não tem uma conta? Cadastre-se'}
      </button>
      <button onClick={handleEmailLinkSignIn} className="mt-4 text-sm text-indigo-600 hover:text-indigo-500">
        Entrar com link de email
      </button>
    </div>
  );
};

export default AuthLayout;
