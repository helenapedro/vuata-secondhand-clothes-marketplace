import React from 'react';
//import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendSignInLinkToEmail } from 'firebase/auth';
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

        // Call the API to define custom claims

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

      toast.error(message);
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
