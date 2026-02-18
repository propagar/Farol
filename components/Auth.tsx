import React, { useEffect, useMemo, useState } from 'react';
import { LighthouseIcon } from './Icons';

interface AuthProps {
  onLoginSuccess: (token: string) => void;
  appColor: string;
}

declare global {
  interface Window {
    google?: any;
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AuthFormWrapper: React.FC<{ title: string; children: React.ReactNode; appColor: string }> = ({
  title,
  children,
  appColor,
}) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className={`w-16 h-16 text-${appColor}-600 mx-auto`}>
          <LighthouseIcon />
        </div>
        <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-200 mt-2">Farol</h1>
        <p className="text-slate-500 dark:text-slate-400">Guie sua produtividade e finanças.</p>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-200 mb-6">{title}</h2>
        {children}
      </div>
    </div>
  </div>
);

const EyeIcon: React.FC<{ isVisible: boolean }> = ({ isVisible }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    {isVisible ? (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </>
    ) : (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.584 10.587a2.25 2.25 0 003.182 3.182" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.88 5.09A10.45 10.45 0 0112 4.875c4.287 0 7.92 2.915 9 6.875a10.486 10.486 0 01-2.404 4.33M6.228 6.228A10.451 10.451 0 003 11.75c1.08 3.96 4.713 6.875 9 6.875a10.44 10.44 0 004.125-.853" />
      </>
    )}
  </svg>
);

const PasswordField: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  appColor: string;
  minLength?: number;
}> = ({ id, label, value, onChange, appColor, minLength }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-slate-300">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          type={isVisible ? 'text' : 'password'}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          minLength={minLength}
          className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2 pr-10`}
        />
        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"
          aria-label={isVisible ? 'Ocultar senha' : 'Mostrar senha'}
        >
          <EyeIcon isVisible={isVisible} />
        </button>
      </div>
    </div>
  );
};

const Auth: React.FC<AuthProps> = ({ onLoginSuccess, appColor }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const googleClientId = useMemo(() => import.meta.env.VITE_GOOGLE_CLIENT_ID || '', []);

  useEffect(() => {
    if (!googleClientId) {
      return;
    }

    const setupGoogle = () => {
      if (!window.google?.accounts?.id) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async ({ credential }: { credential: string }) => {
          setError('');
          setSuccessMessage('');
          setIsLoading(true);

          try {
            const response = await fetch('/.netlify/functions/auth-google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ credential }),
            });

            const data = await response.json();
            if (!response.ok) {
              setError(data.error || 'Falha no login com Google.');
              return;
            }

            onLoginSuccess(data.token);
          } catch {
            setError('Falha ao conectar com o servidor.');
          } finally {
            setIsLoading(false);
          }
        },
      });

      const container = document.getElementById('google-signin-button');
      if (container) {
        container.innerHTML = '';
        window.google.accounts.id.renderButton(container, {
          theme: 'outline',
          size: 'large',
          text: 'signup_with',
          shape: 'pill',
          width: 320,
        });
      }
    };

    const existingScript = document.getElementById('google-identity-script');
    if (existingScript) {
      setupGoogle();
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-identity-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = setupGoogle;
    document.body.appendChild(script);
  }, [googleClientId, isRegistering, onLoginSuccess]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/.netlify/functions/auth-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Falha no login.');
        return;
      }

      onLoginSuccess(data.token);
    } catch {
      setError('Falha ao conectar com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Digite um e-mail válido para continuar o cadastro.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/.netlify/functions/auth-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Falha ao registrar.');
        return;
      }

      setSuccessMessage('Cadastro realizado! Faça login para continuar.');
      setPassword('');
      setConfirmPassword('');
      setIsRegistering(false);
    } catch {
      setError('Falha ao conectar com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const googleButtonNote = !googleClientId ? 'Login com Google indisponível: VITE_GOOGLE_CLIENT_ID não configurado.' : '';

  if (isRegistering) {
    return (
      <AuthFormWrapper title="Criar Conta" appColor={appColor}>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              E-mail
            </label>
            <input
              type="email"
              id="reg-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`}
            />
          </div>

          <PasswordField
            id="reg-password"
            label="Senha"
            value={password}
            onChange={setPassword}
            minLength={8}
            appColor={appColor}
          />

          <PasswordField
            id="confirmPassword"
            label="Confirmar Senha"
            value={confirmPassword}
            onChange={setConfirmPassword}
            minLength={8}
            appColor={appColor}
          />

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-${appColor}-600 hover:bg-${appColor}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${appColor}-500 disabled:opacity-50`}
          >
            {isLoading ? 'Cadastrando...' : 'Cadastrar'}
          </button>

          <div className="pt-2">
            <div id="google-signin-button" className="w-full flex justify-center" />
            {googleButtonNote && <p className="text-xs text-amber-600 mt-2 text-center">{googleButtonNote}</p>}
          </div>
        </form>
        <div className="mt-6 text-center text-sm">
          <button
            onClick={() => setIsRegistering(false)}
            className={`font-medium text-${appColor}-600 hover:text-${appColor}-500 dark:text-${appColor}-400 dark:hover:text-${appColor}-300`}
          >
            Já tem uma conta? Faça login
          </button>
        </div>
      </AuthFormWrapper>
    );
  }

  return (
    <AuthFormWrapper title="Login" appColor={appColor}>
      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
            E-mail
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={`mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`}
          />
        </div>

        <PasswordField id="password" label="Senha" value={password} onChange={setPassword} appColor={appColor} />

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
        {successMessage && <p className="text-sm text-green-600 text-center">{successMessage}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-${appColor}-600 hover:bg-${appColor}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${appColor}-500 disabled:opacity-50`}
        >
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>

        <div>
          <div id="google-signin-button" className="w-full flex justify-center" />
          {googleButtonNote && <p className="text-xs text-amber-600 mt-2 text-center">{googleButtonNote}</p>}
        </div>
      </form>
      <div className="mt-6 text-center text-sm">
        <button
          onClick={() => setIsRegistering(true)}
          className={`font-medium text-${appColor}-600 hover:text-${appColor}-500 dark:text-${appColor}-400 dark:hover:text-${appColor}-300`}
        >
          Não tem uma conta? Cadastre-se
        </button>
      </div>
    </AuthFormWrapper>
  );
};

export default Auth;
