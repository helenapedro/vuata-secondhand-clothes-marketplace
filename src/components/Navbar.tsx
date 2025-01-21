import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { UserIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import CartButton from './CartButton';

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = React.useState<User | null>(null);
  const [userRole, setUserRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
    });
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setUserRole(data.role);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="https://mbeuaportfolio-media.s3.us-east-2.amazonaws.com/vuata_favicon.ico"
              alt="VUATA Logo"
              className="w-6 h-6"
            />
            <span className="font-bold text-xl">VUATA</span>
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {userRole === 'vendedor' && (
                  <Link
                    to="/sell"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Vender Item
                  </Link>
                )}
                <CartButton />
                <Link to="/profile" className="text-gray-600 hover:text-gray-900">
                  <UserIcon className="w-6 h-6" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="w-6 h-6" />
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}