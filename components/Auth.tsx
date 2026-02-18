import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LighthouseIcon } from './Icons';

interface AuthProps {
  onLoginSuccess: (token: string) => void;
  appColor: string;
}

type GoogleCredentialResponse = {
  credential?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

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

const Auth: React.FC<AuthProps> = ({ onLoginSuccess, appColor }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleConfigMessage, setGoogleConfigMessage] = useState('');
  const [googleClientId, setGoogleClientId] = useState(() => String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim());
  const [isGoogleConfigLoading, setIsGoogleConfigLoading] = useState(() => !googleClientId);
  const loginGoogleButtonRef = useRef<HTMLDivElement>(null);
  const registerGoogleButtonRef = useRef<HTMLDivElement>(null);

  const isGoogleEnabled = Boolean(googleClientId);

  useEffect(() => {
    if (googleClientId) {
      setIsGoogleConfigLoading(false);
      return;
    }

    let isMounted = true;

    const loadAuthConfig = async () => {
      try {
        const response = await fetch('/.netlify/functions/auth-config');
        const data = await response.json().catch(() => ({}));

        if (!isMounted) {
          return;
        }

        if (!response.ok) {
          setGoogleConfigMessage('Não foi possível carregar a configuração de login Google.');
          return;
        }

        const backendGoogleClientId = String(data.googleClientId || '').trim();
        if (backendGoogleClientId) {
          setGoogleClientId(backendGoogleClientId);
          setGoogleConfigMessage('');
        } else {
          setGoogleConfigMessage('Configure no Netlify: GOOGLE_CLIENT_ID ou VITE_GOOGLE_CLIENT_ID.');
        }
      } catch {
        if (isMounted) {
          setGoogleConfigMessage('Não foi possível carregar a configuração de login Google.');
        }
      } finally {
        if (isMounted) {
          setIsGoogleConfigLoading(false);
        }
      }
    };

    loadAuthConfig();

    return () => {
      isMounted = false;
    };
  }, [googleClientId]);

  const parseResponseMessage = async (response: Response, fallback: string) => {
    try {
      const data = await response.json();
      return data.message || data.error || fallback;
    } catch {
      return fallback;
    }
  };

  const submitLogin = useCallback(
    async (loginEmail: string, loginPassword: string) => {
      const response = await fetch('/.netlify/functions/auth-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      if (!response.ok) {
        const message = await parseResponseMessage(response, 'Falha no login.');
        throw new Error(message);
      }

      const data = await response.json();
      if (!data.token) {
        throw new Error('Token de autenticação ausente na resposta.');
      }

      onLoginSuccess(data.token);
    },
    [onLoginSuccess]
  );

  const handleGoogleCredential = useCallback(
    async (googleResponse: GoogleCredentialResponse) => {
      const idToken = googleResponse.credential;
      if (!idToken) {
        setError('Não foi possível obter credencial do Google.');
        return;
      }

      setError('');
      setSuccessMessage('');
      setIsGoogleLoading(true);

      try {
        const response = await fetch('/.netlify/functions/auth-google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_token: idToken }),
        });

        if (!response.ok) {
          const message = await parseResponseMessage(response, 'Falha no login com Google.');
          setError(message);
          return;
        }

        const data = await response.json();
        if (!data.token) {
          setError('Token de autenticação ausente na resposta.');
          return;
        }

        onLoginSuccess(data.token);
      } catch {
        setError('Falha ao conectar com o servidor.');
      } finally {
        setIsGoogleLoading(false);
      }
    },
    [onLoginSuccess]
  );

  useEffect(() => {
    const googleButtonRef = isRegistering ? registerGoogleButtonRef : loginGoogleButtonRef;
    if (!isGoogleEnabled || !googleButtonRef.current) {
      return;
    }

    const renderGoogleButton = () => {
      if (!window.google || !googleButtonRef.current) {
        return;
      }

      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        size: 'large',
        width: 320,
        text: 'continue_with',
        shape: 'pill',
      });
    };

    if (window.google) {
      renderGoogleButton();
      return;
    }

    const existingScript = document.getElementById('google-identity-services');
    if (existingScript) {
      existingScript.addEventListener('load', renderGoogleButton, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-identity-services';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    document.head.appendChild(script);
  }, [googleClientId, handleGoogleCredential, isGoogleEnabled, isRegistering]);

  const renderGoogleAccess = useCallback(() => {
    if (isGoogleConfigLoading) {
      return <p className="text-sm text-slate-500 text-center">Carregando login com Google...</p>;
    }

    if (!isGoogleEnabled) {
      return (
        <p className="text-sm text-amber-600 text-center">
          {googleConfigMessage || 'Configure no Netlify: GOOGLE_CLIENT_ID ou VITE_GOOGLE_CLIENT_ID.'}
        </p>
      );
    }

    return (
      <div className="flex justify-center">
        {isGoogleLoading && <p className="text-sm text-slate-500">Conectando com Google...</p>}
        <div ref={isRegistering ? registerGoogleButtonRef : loginGoogleButtonRef} />
      </div>
    );
  }, [googleConfigMessage, isGoogleConfigLoading, isGoogleEnabled, isGoogleLoading, isRegistering]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      await submitLogin(email, password);
    } catch (submitError) {
      setError((submitError as Error).message || 'Falha no login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

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
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error('REGISTER_FAIL', response.status, data);
        setError(data.message || data.error || 'Não foi possível cadastrar. Tente novamente.');
        return;
      }

      await submitLogin(email, password);
    } catch (registerError) {
      setError((registerError as Error).message || 'Falha ao conectar com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

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
          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Senha
            </label>
            <input
              type="password"
              id="reg-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className={`mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Confirmar Senha
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className={`mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`}
            />
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-${appColor}-600 hover:bg-${appColor}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${appColor}-500 disabled:opacity-50`}
          >
            {isLoading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs uppercase text-slate-400">
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          <span>ou</span>
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        </div>

        {renderGoogleAccess()}

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
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
            Senha
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={`mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`}
          />
        </div>
        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
        {successMessage && <p className="text-sm text-green-600 text-center">{successMessage}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-${appColor}-600 hover:bg-${appColor}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${appColor}-500 disabled:opacity-50`}
        >
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs uppercase text-slate-400">
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        <span>ou</span>
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </div>

      {renderGoogleAccess()}

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
