import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import NewProduct from './pages/NewProduct';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import Cart from './pages/Cart';
import { auth } from './config/firebase';

function App() {
  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken && auth.currentUser) {
      auth.currentUser.getIdTokenResult(true).then(() => {
        // Restore user session and fetch necessary data
        console.log('User session restored');
      }).catch((error) => {
        console.error('Error fetching token:', error);
      });
    }

    const handleTokenRefresh = async () => {
      try {
        const token = await auth.currentUser?.getIdToken(true);
        if (token) {
          localStorage.setItem('accessToken', token);
        }
      } catch (error) {
        console.error('Error refreshing token:', error);
      }
    };

    // Set an interval to refresh the token periodically (e.g., every 55 minutes)
    const interval = setInterval(handleTokenRefresh, 55 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/sell" element={<NewProduct />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/cart" element={<Cart />} />
          </Routes>
        </main>
        <Toaster position="bottom-right" />
      </div>
    </BrowserRouter>
  );
}

export default App;
