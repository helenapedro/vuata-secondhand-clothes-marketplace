import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import AuthLayout from '../forms/AuthLayout';

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

  useEffect(() => {
    // Check if the URL contains a sign-in link
    if (isSignInWithEmailLink(auth, window.location.href)) {
      // Get the email from localStorage
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        // Prompt the user to provide their email if it's not available
        email = window.prompt('Please provide your email for confirmation');
      }
      if (email) {
        // Sign in the user with the email link
        signInWithEmailLink(auth, email, window.location.href)
          .then((result) => {
            // Clear the email from localStorage
            window.localStorage.removeItem('emailForSignIn');
            // Store the token in localStorage
            result.user.getIdToken().then((token) => {
              localStorage.setItem('accessToken', token);
            });
            toast.success('Login realizado com sucesso!');
            navigate('/');
          })
          .catch((error) => {
            console.error('Error signing in with email link:', error);
            toast.error('Erro ao fazer login com o link de email');
          });
      }
    }
  }, [navigate]);

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
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save user details in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          id: user.uid,
          email,
          full_name: fullName,
          role,
          whatsapp,
          identity_number: identityNumber,
          linkedin_url: linkedinUrl,
        });

        toast.success('Conta criada com sucesso!');
        navigate('/');
      } else {
        await signInWithEmailAndPassword(auth, email, password);

        const user = auth.currentUser;
        if (user) {
          const token = await user.getIdToken();
          localStorage.setItem('accessToken', token);
        }

        toast.success('Login realizado com sucesso!');
        navigate('/');
      }
    } catch (error) {
      console.error('Error:', error);
      let message = 'Ocorreu um erro. Por favor, tente novamente.';

      if (error instanceof Error) {
        message = error.message;
      }

      toast.error('Credenciais inválidas, por favor verifique o seu email ou password.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLinkSignIn = async () => {
    const actionCodeSettings = {
      url: `${window.location.origin}/auth`,
      handleCodeInApp: true,
    };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    toast.success('Link de login enviado para o email!');
    window.localStorage.setItem('emailForSignIn', email);
  };

  const handleToggleAuth = () => setIsSignUp(!isSignUp);

  return (
    <AuthLayout
      isSignUp={isSignUp}
      loading={loading}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      fullName={fullName}
      setFullName={isSignUp ? setFullName : undefined}
      role={role}
      setRole={isSignUp ? setRole : undefined}
      whatsapp={whatsapp}
      setWhatsapp={isSignUp && role === 'vendedor' ? setWhatsapp : undefined}
      identityNumber={identityNumber}
      setIdentityNumber={isSignUp && role === 'vendedor' ? setIdentityNumber : undefined}
      linkedinUrl={linkedinUrl}
      setLinkedinUrl={isSignUp && role === 'vendedor' ? setLinkedinUrl : undefined}
      handleSubmit={handleSubmit}
      handleToggleAuth={handleToggleAuth}
      handleEmailLinkSignIn={handleEmailLinkSignIn}
    />
  );
}
