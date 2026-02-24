import React, { useState } from 'react';
import { LighthouseIcon } from './Icons';

interface AuthProps {
  onLoginSuccess: (token: string) => void;
  appColor: string;
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
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [cep, setCep] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [stateName, setStateName] = useState('');
  const [country, setCountry] = useState('Brasil');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getFriendlyApiError = (apiError: string, apiCode?: string) => {
    if (apiCode === 'JWT_SECRET_MISSING' || apiError.includes('JWT_SECRET')) {
      return 'Login indisponível: o servidor está sem JWT_SECRET. Configure essa variável de ambiente e reinicie o serviço.';
    }

    return apiError;
  };

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
        setError(getFriendlyApiError(data.error || 'Falha no login.', data.code));
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

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/.netlify/functions/auth-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName,
          whatsapp,
          address: {
            cep,
            city,
            neighborhood,
            street,
            number: houseNumber,
            state: stateName,
            country,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Falha ao registrar.');
        return;
      }

      setSuccessMessage('Cadastro realizado! Faça login para continuar.');
      setPassword('');
      setConfirmPassword('');
      setFullName('');
      setWhatsapp('');
      setCep('');
      setCity('');
      setNeighborhood('');
      setStreet('');
      setHouseNumber('');
      setStateName('');
      setCountry('Brasil');
      setIsRegistering(false);
    } catch {
      setError('Falha ao conectar com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const goToLogin = () => {
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsRegistering(false);
  };

  const goToRegister = () => {
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsRegistering(true);
  };

  if (isRegistering) {
    return (
      <AuthFormWrapper title="Criar Conta" appColor={appColor}>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="reg-full-name" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Nome completo
            </label>
            <input
              type="text"
              id="reg-full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className={`mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`}
            />
          </div>
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
            <label htmlFor="reg-whatsapp" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              WhatsApp
            </label>
            <input
              type="tel"
              id="reg-whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              required
              className={`mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`}
            />
          </div>
          <div>
            <p className="block text-sm font-medium text-gray-700 dark:text-slate-300">Endereço completo</p>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="CEP"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                required
                className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`}
              />
              <input
                type="text"
                placeholder="Cidade"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`}
              />
              <input
                type="text"
                placeholder="Bairro"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                required
                className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`}
              />
              <input
                type="text"
                placeholder="Rua"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                required
                className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`}
              />
              <input
                type="text"
                placeholder="Número"
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
                required
                className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`}
              />
              <input
                type="text"
                placeholder="Estado"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                required
                className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`}
              />
              <input
                type="text"
                placeholder="País"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
                className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2 sm:col-span-2`}
              />
            </div>
          </div>
          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Senha
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                id="reg-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2 pr-10`}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 dark:text-slate-300"
            >
              Confirmar Senha
            </label>
            <div className="relative mt-1">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2 pr-10`}
              />
              <button
                type="button"
                aria-label={showConfirmPassword ? 'Esconder confirmação de senha' : 'Mostrar confirmação de senha'}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
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
        <div className="mt-6 text-center text-sm">
          <button
            onClick={goToLogin}
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
          <div className="relative mt-1">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2 pr-10`}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
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
      <div className="mt-6 text-center text-sm">
        <button
          onClick={goToRegister}
          className={`font-medium text-${appColor}-600 hover:text-${appColor}-500 dark:text-${appColor}-400 dark:hover:text-${appColor}-300`}
        >
          Não tem uma conta? Cadastre-se
        </button>
      </div>
    </AuthFormWrapper>
  );
};

export default Auth;
