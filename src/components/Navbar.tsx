import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase'; 
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { User as UserIcon, LogOut } from 'lucide-react';
import CartButton from './CartButton';

export default function Navbar() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user);
      setLoading(true); 
      setUser(user);
      if (user) {
        fetchUserRole(user.uid).then(() => setLoading(false));
      } else {
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('Fetched user role:', userData.role);
        setUserRole(userData.role);
      } else {
        console.log('User document does not exist');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
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
            {loading ? (
              <span>Loading...</span>
            ) : user ? (
              <>
                {userRole === 'vendedor' ? (
                  <Link
                    to="/sell"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Vender Item
                  </Link>
                ) : (
                  <CartButton />
                )}
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
  )
};