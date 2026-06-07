import React, { useState } from 'react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import PitStopLogo from './PitStopLogo';
import { 
  Mail, 
  Lock, 
  User, 
  LogIn, 
  UserPlus, 
  Loader2, 
  AlertTriangle,
  Flame,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Parse Firebase errors to helpful Portuguese explanations
  const parseAuthError = (err: any) => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/invalid-email':
        return 'O endereço de e-mail inserido é inválido.';
      case 'auth/user-disabled':
        return 'Esta conta de usuário foi desativada.';
      case 'auth/user-not-found':
        return 'Nenhum usuário foi localizado com este e-mail.';
      case 'auth/wrong-password':
        return 'A senha digitada está incorreta.';
      case 'auth/email-already-in-use':
        return 'Já existe uma conta registrada com este e-mail.';
      case 'auth/weak-password':
        return 'A senha precisa conter no mínimo 6 caracteres.';
      case 'auth/popup-closed-by-user':
        return 'O login social foi cancelado pelo usuário.';
      case 'auth/operation-not-allowed':
        return 'Este provedor de login não está ativado no console do Firebase.';
      default:
        return err?.message || 'Ocorreu um erro desconhecido durante a autenticação.';
    }
  };

  // Create or sync user profile in firestore
  const syncUserProfile = async (user: any) => {
    const userRef = doc(db, 'users', user.uid);
    try {
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        // Save initial profile details securely
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName || displayName || user.email?.split('@')[0] || 'Operador',
          email: user.email || '',
          role: 'admin', // Default initial register is admin for full local management
          createdAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.warn("Could not sync Firestore profile (Rules may deny or Firestore is offline):", e);
    }
  };

  // Handles Google Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await syncUserProfile(result.user);
        onLoginSuccess();
      }
    } catch (error: any) {
      setErrorMessage(parseAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  // Handles Email & Password Email Authentication
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Por favor, preencha todos os campos requeridos.');
      return;
    }
    if (isSignUp && !displayName) {
      setErrorMessage('Por favor, insira o seu nome de identificação.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      if (isSignUp) {
        // Register standard Email Account
        const res = await createUserWithEmailAndPassword(auth, email, password);
        if (res.user) {
          await updateProfile(res.user, { displayName });
          await syncUserProfile({ ...res.user, displayName });
        }
      } else {
        // Sign In standard Email Account
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLoginSuccess();
    } catch (error: any) {
      setErrorMessage(parseAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      
      {/* Decorative Golden Orbs for Premium Tavern Ambience */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-500/5 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold-400/5 blur-3xl rounded-full pointer-events-none" />

      {/* Floating Sparkles Ambient bubbles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="beer-bubble w-6 h-6 left-12" style={{ animationDelay: '0s', bottom: '0%' }} />
        <div className="beer-bubble w-4 h-4 left-1/3" style={{ animationDelay: '3s', bottom: '0%' }} />
        <div className="beer-bubble w-8 h-8 left-2/3" style={{ animationDelay: '1s', bottom: '0%' }} />
        <div className="beer-bubble w-3 h-3 right-12" style={{ animationDelay: '5s', bottom: '0%' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md z-10"
      >
        {/* Brand visual header */}
        <div className="flex flex-col items-center mb-8">
          <PitStopLogo size="lg" showText={true} />
          <p className="text-slate-400 text-xs font-medium tracking-wide mt-3 uppercase">
            Sistema de Gestão de Comandas
          </p>
        </div>

        {/* Central Auth Container Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 relative shadow-2xl overflow-hidden gold-glow">
          
          {/* Subtle Golden border top glow */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold-500 to-transparent" />

          {/* Tab Selection */}
          <div className="flex border-b border-slate-800 mb-6 pb-px">
            <button
              onClick={() => {
                setIsSignUp(false);
                setErrorMessage(null);
              }}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition ${
                !isSignUp 
                  ? 'text-gold-500 border-b-2 border-gold-500' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => {
                setIsSignUp(true);
                setErrorMessage(null);
              }}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition ${
                isSignUp 
                  ? 'text-gold-500 border-b-2 border-gold-500' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Cadastrar
            </button>
          </div>

          {/* Status Display Alerts */}
          <AnimatePresence mode="wait">
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3 flex gap-2.5 items-start text-xs text-rose-200"
              >
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Social Sign In Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-slate-950 hover:bg-slate-850 text-white rounded-2xl py-3 px-4 text-xs font-semibold border border-slate-800 flex items-center justify-center gap-3 transition active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-gold-500" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
            )}
            <span>Entrar com o Google</span>
          </button>

          <div className="relative my-5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <span className="relative px-3 text-[10px] uppercase font-bold text-slate-500 bg-slate-900">
              Ou por e-mail
            </span>
          </div>

          {/* Form Action Fields */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gold-500" />
                  Nome Completo
                </label>
                <input
                  type="text"
                  placeholder="ex: Carlos Albuquerque"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2 px-3 text-xs outline-none focus:border-gold-400"
                  required={isSignUp}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gold-500" />
                E-mail de Acesso
              </label>
              <input
                type="email"
                placeholder="nome@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2 px-3 text-xs outline-none focus:border-gold-400"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-gold-500" />
                Senha Secreta
              </label>
              <input
                type="password"
                placeholder="Mínimo de 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2 px-3 text-xs outline-none focus:border-gold-400"
                required
              />
            </div>

            {/* Submit Control */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold-500 hover:bg-gold-400 text-slate-950 rounded-2xl py-3 px-4 text-xs font-bold transition flex items-center justify-center gap-2 mt-6 active:scale-98 disabled:opacity-50 select-none shadow-lg gold-glow cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSignUp ? (
                <>
                  <UserPlus className="w-4 h-4 stroke-[2.5]" />
                  <span>Registrar Novo Operador</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 stroke-[2.5]" />
                  <span>Acessar Painel</span>
                </>
              )}
            </button>
          </form>

          {/* Credentials notice */}
          <div className="mt-5 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5 leading-relaxed">
            <Flame className="w-3.5 h-3.5 text-gold-500 shrink-0" />
            <span>Provedores integrados e protegidos por Firebase Auth</span>
          </div>

        </div>

        {/* Demo Credentials quick login tool (Optional Quality of Life) */}
        {!isSignUp && (
          <div className="mt-3 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-3 text-center text-[10px] text-slate-400 flex items-center justify-center gap-2">
            <span>Ou se preferir,</span>
            <button 
              onClick={() => setIsSignUp(true)}
              className="text-[#e4bc60] font-bold underline hover:text-[#dfb147]"
            >
              Crie uma Nova Conta
            </button>
            <span>vazia por e-mail.</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
