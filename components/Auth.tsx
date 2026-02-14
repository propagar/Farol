
import React, { useState } from 'react';
import { LighthouseIcon, GoogleIcon } from './Icons';

interface AuthProps {
    onLoginSuccess: () => void;
    appColor: string;
}

const AuthFormWrapper: React.FC<{ title: string, children: React.ReactNode, appColor: string }> = ({ title, children, appColor }) => (
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
    const [error, setError] = useState('');

    // Registration state
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [accountType, setAccountType] = useState<'personal' | 'business'>('personal');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (email === 'yuriwelter34@gmail.com' && password === '1') {
            onLoginSuccess();
        } else {
            setError('E-mail ou senha inválidos.');
        }
    };

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        // Mock registration
        alert('Cadastro realizado com sucesso! Por favor, faça login com suas novas credenciais (funcionalidade em desenvolvimento).');
        setIsRegistering(false); // Switch back to login view
    };

    if (isRegistering) {
        return (
            <AuthFormWrapper title="Criar Conta" appColor={appColor}>
                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Nome Completo</label>
                        <input type="text" id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required className={`mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} />
                    </div>
                    <div>
                        <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 dark:text-slate-300">E-mail</label>
                        <input type="email" id="reg-email" value={email} onChange={e => setEmail(e.target.value)} required className={`mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Telefone</label>
                        <input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} className={`mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} />
                    </div>
                    <div>
                        <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Senha</label>
                        <input type="password" id="reg-password" value={password} onChange={e => setPassword(e.target.value)} required className={`mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} />
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Confirmar Senha</label>
                        <input type="password" id="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className={`mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Tipo de Conta</label>
                         <div className="mt-2 flex rounded-md shadow-sm">
                            <button type="button" onClick={() => setAccountType('personal')} className={`relative inline-flex items-center justify-center w-1/2 px-4 py-2 rounded-l-md border text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-${appColor}-500 focus:border-${appColor}-500 ${accountType === 'personal' ? `bg-${appColor}-600 text-white border-${appColor}-600` : `bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600`}`}>Pessoal</button>
                            <button type="button" onClick={() => setAccountType('business')} className={`relative -ml-px inline-flex items-center justify-center w-1/2 px-4 py-2 rounded-r-md border text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-${appColor}-500 focus:border-${appColor}-500 ${accountType === 'business' ? `bg-${appColor}-600 text-white border-${appColor}-600` : `bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600`}`}>Empresa</button>
                         </div>
                    </div>
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    <button type="submit" className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-${appColor}-600 hover:bg-${appColor}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${appColor}-500`}>Cadastrar</button>
                </form>
                <div className="mt-6 text-center text-sm">
                    <button onClick={() => setIsRegistering(false)} className={`font-medium text-${appColor}-600 hover:text-${appColor}-500 dark:text-${appColor}-400 dark:hover:text-${appColor}-300`}>
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
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-slate-300">E-mail</label>
                    <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required className={`mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} />
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Senha</label>
                    <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required className={`mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} />
                </div>
                {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                <button type="submit" className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-${appColor}-600 hover:bg-${appColor}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${appColor}-500`}>Entrar</button>
            </form>
            <div className="mt-6">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-slate-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400">Ou continue com</span>
                    </div>
                </div>
                <div className="mt-6">
                    <button onClick={() => alert("Login com Google em desenvolvimento.")} className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 text-sm font-medium text-gray-500 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600">
                        <GoogleIcon className="w-5 h-5" />
                        <span className="sr-only">Entrar com Google</span>
                    </button>
                </div>
            </div>
            <div className="mt-6 text-center text-sm">
                <button onClick={() => setIsRegistering(true)} className={`font-medium text-${appColor}-600 hover:text-${appColor}-500 dark:text-${appColor}-400 dark:hover:text-${appColor}-300`}>
                    Não tem uma conta? Cadastre-se
                </button>
            </div>
        </AuthFormWrapper>
    );
};

export default Auth;
