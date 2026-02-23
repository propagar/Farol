
import React, { useState, useEffect, useRef } from 'react';
import { GoogleCalendarIcon, GoogleTasksIcon, UserCircleIcon } from './Icons';
import { AccountInfo } from '../types';

interface SettingsProps {
    appColor: string;
    onAppColorChange: (color: string) => void;
    assistantName: string;
    onAssistantNameChange: (name: string) => void;
    assistantInstruction: string;
    onAssistantInstructionChange: (instruction: string) => void;
    isGoogleCalendarAuthorized: boolean;
    onConnectGoogleCalendar: () => void;
    isGoogleTasksAuthorized: boolean;
    onConnectGoogleTasks: () => void;
    accountInfo: AccountInfo;
    onAccountInfoChange: (info: AccountInfo) => void;
}

const colorPalette = [
    { name: 'indigo', class: 'bg-indigo-600' },
    { name: 'sky', class: 'bg-sky-600' },
    { name: 'emerald', class: 'bg-emerald-600' },
    { name: 'rose', class: 'bg-rose-600' },
    { name: 'violet', class: 'bg-violet-600' },
];

const Settings: React.FC<SettingsProps> = ({
    appColor,
    onAppColorChange,
    assistantName,
    onAssistantNameChange,
    assistantInstruction,
    onAssistantInstructionChange,
    isGoogleCalendarAuthorized,
    onConnectGoogleCalendar,
    isGoogleTasksAuthorized,
    onConnectGoogleTasks,
    accountInfo,
    onAccountInfoChange,
}) => {
    const [localAccountInfo, setLocalAccountInfo] = useState<AccountInfo>(accountInfo);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLocalAccountInfo(accountInfo);
    }, [accountInfo]);

    const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setLocalAccountInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalAccountInfo(prev => ({
            ...prev,
            address: {
                ...prev.address,
                [name]: value
            }
        }));
    };

    const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalAccountInfo(prev => ({
            ...prev,
            socialLinks: {
                ...prev.socialLinks,
                [name]: value,
            },
        }));
    };

    const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalAccountInfo(prev => ({
                    ...prev,
                    profilePicture: reader.result as string
                }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSaveChanges = () => {
        onAccountInfoChange(localAccountInfo);
        alert("Informações salvas com sucesso!");
    };

    const renderSection = (title: string, children: React.ReactNode) => (
        <div className="pt-6 border-t border-slate-200 dark:border-slate-700 first-of-type:pt-0 first-of-type:border-none">
            <h3 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-4">{title}</h3>
            {children}
        </div>
    );

    return (
        <div className="space-y-10 max-w-4xl mx-auto">
            
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-1">Perfil, Aparência e Assistente</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Gerencie seus dados e personalize sua experiência.</p>
                
                <div className="space-y-8">
                    {renderSection("Informações Pessoais", (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-1">
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Foto de Perfil</label>
                                <div className="mt-1 flex flex-col items-center space-y-4">
                                    <span className="inline-block h-32 w-32 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 text-slate-400">
                                        {localAccountInfo.profilePicture ? (
                                            <img src={localAccountInfo.profilePicture} alt="Foto do Perfil" className="h-full w-full object-cover" />
                                        ) : (
                                            <UserCircleIcon />
                                        )}
                                    </span>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleProfilePictureChange}
                                        className="hidden"
                                        accept="image/png, image/jpeg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`bg-white dark:bg-slate-700 py-2 px-3 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${appColor}-500`}
                                    >
                                        Alterar Foto
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:col-span-2">
                                <div className="sm:col-span-2">
                                    <label htmlFor="fullName" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Nome Completo</label>
                                    <input type="text" name="fullName" id="fullName" value={localAccountInfo.fullName} onChange={handleAccountChange} className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} />
                                </div>
                                <div className="sm:col-span-2">
                                    <label htmlFor="email" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">E-mail</label>
                                    <input type="email" name="email" id="email" value={localAccountInfo.email} onChange={handleAccountChange} className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} />
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Telefone</label>
                                    <input type="tel" name="phone" id="phone" value={localAccountInfo.phone} onChange={handleAccountChange} className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} />
                                </div>
                                <div>
                                    <label htmlFor="cpf" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">CPF</label>
                                    <input type="text" name="cpf" id="cpf" value={localAccountInfo.cpf} onChange={handleAccountChange} className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} />
                                </div>
                                <div className="sm:col-span-2">
                                    <label htmlFor="profession" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Profissão</label>
                                    <input type="text" name="profession" id="profession" value={localAccountInfo.profession} onChange={handleAccountChange} className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} />
                                </div>
                            </div>
                        </div>
                    ))}

                    {renderSection("Endereço", (
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                             <div className="md:col-span-4">
                                <label htmlFor="street" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Rua</label>
                                <input type="text" name="street" id="street" value={localAccountInfo.address.street} onChange={handleAddressChange} className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="number" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Número</label>
                                <input type="text" name="number" id="number" value={localAccountInfo.address.number} onChange={handleAddressChange} className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} />
                            </div>
                            <div className="md:col-span-3">
                                <label htmlFor="complement" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Complemento</label>
                                <input type="text" name="complement" id="complement" value={localAccountInfo.address.complement} onChange={handleAddressChange} className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} />
                            </div>
                             <div className="md:col-span-3">
                                <label htmlFor="neighborhood" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Bairro</label>
                                <input type="text" name="neighborhood" id="neighborhood" value={localAccountInfo.address.neighborhood} onChange={handleAddressChange} className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} />
                            </div>
                            <div className="md:col-span-3">
                                <label htmlFor="city" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Cidade</label>
                                <input type="text" name="city" id="city" value={localAccountInfo.address.city} onChange={handleAddressChange} className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} />
                            </div>
                            <div className="md:col-span-1">
                                <label htmlFor="state" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Estado</label>
                                <input type="text" name="state" id="state" value={localAccountInfo.address.state} onChange={handleAddressChange} className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="zipCode" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">CEP</label>
                                <input type="text" name="zipCode" id="zipCode" value={localAccountInfo.address.zipCode} onChange={handleAddressChange} className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} />
                            </div>
                        </div>
                    ))}

                    {renderSection("Contexto para IA", (
                         <div className="space-y-4">
                             <div>
                                <label htmlFor="lifeSummary" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Resumo Pessoal</label>
                                <textarea name="lifeSummary" id="lifeSummary" rows={4} value={localAccountInfo.lifeSummary} onChange={handleAccountChange} placeholder="Fale um pouco sobre você, seus objetivos ou desafios..." className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} />
                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Esta informação ajudará o assistente a fornecer dicas mais personalizadas.</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Redes Sociais</h4>
                                <div className="space-y-3">
                                     <input type="text" name="instagram" placeholder="Link do seu Instagram" value={localAccountInfo.socialLinks.instagram} onChange={handleSocialChange} className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} />
                                     <input type="text" name="facebook" placeholder="Link do seu Facebook" value={localAccountInfo.socialLinks.facebook} onChange={handleSocialChange} className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} />
                                     <input type="text" name="website" placeholder="Link do seu Site/Portfólio" value={localAccountInfo.socialLinks.website} onChange={handleSocialChange} className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} />
                                </div>
                            </div>
                         </div>
                    ))}
                    
                    {renderSection("Aparência", (
                         <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Cor de Destaque</label>
                            <div className="flex gap-4">
                                {colorPalette.map(color => (
                                    <button
                                        key={color.name}
                                        onClick={() => onAppColorChange(color.name)}
                                        className={`w-10 h-10 rounded-full ${color.class} transition-transform transform hover:scale-110 ${appColor === color.name ? `ring-4 ring-offset-2 ring-${color.name}-500 dark:ring-offset-slate-800` : ''}`}
                                        aria-label={`Mudar tema para ${color.name}`}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}

                    {renderSection("Assistente de IA", (
                        <div className="space-y-4">
                             <div>
                                <label htmlFor="assistant-name" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Nome do Assistente</label>
                                <input id="assistant-name" type="text" value={assistantName} onChange={(e) => onAssistantNameChange(e.target.value)} className={`block w-full max-w-sm rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} />
                            </div>
                            <div>
                                <label htmlFor="assistant-instruction" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Instrução Personalizada</label>
                                <textarea id="assistant-instruction" rows={4} value={assistantInstruction} onChange={(e) => onAssistantInstructionChange(e.target.value)} placeholder="Ex: Seja amigável e me chame de 'Mestre da Produtividade'. Foque em me ajudar a economizar dinheiro." className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} />
                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Dê uma personalidade ou um foco para seu assistente. Isso guiará como ele responde a você.</p>
                            </div>
                        </div>
                    ))}

                    <div className="flex justify-end pt-8">
                        <button onClick={handleSaveChanges} className={`bg-${appColor}-600 text-white font-semibold px-6 py-2 rounded-lg shadow-sm hover:bg-${appColor}-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-${appColor}-500`}>
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-1">Integrações</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Conecte o Farol com outras ferramentas.</p>
                <div className="space-y-4">
                     <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <button
                            onClick={onConnectGoogleCalendar}
                            disabled
                            className={`flex items-center gap-3 w-full sm:w-auto justify-center text-left py-2.5 px-4 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                'bg-slate-100 text-slate-400 dark:bg-slate-700/60 dark:text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            <div className="w-5 h-5"><GoogleCalendarIcon/></div>
                            <span>Google Agenda (em breve)</span>
                        </button>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                            Sincronize suas tarefas com data de vencimento diretamente no seu Google Agenda.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <button
                            onClick={onConnectGoogleTasks}
                            disabled
                            className={`flex items-center gap-3 w-full sm:w-auto justify-center text-left py-2.5 px-4 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                'bg-slate-100 text-slate-400 dark:bg-slate-700/60 dark:text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            <div className="w-5 h-5"><GoogleTasksIcon/></div>
                            <span>Tarefas do Google (em breve)</span>
                        </button>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                            Sincronize suas tarefas com a sua lista do Google Tasks.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
