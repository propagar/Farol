
import React, { useState, useEffect } from 'react';
import { BankAccount } from '../types';
import Modal from './Modal';

interface BankAccountDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    account: BankAccount;
    onUpdate: (account: BankAccount) => void;
    appColor: string;
}

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const BankAccountDetailsModal: React.FC<BankAccountDetailsModalProps> = ({
    isOpen,
    onClose,
    account,
    onUpdate,
    appColor
}) => {
    const [localAccount, setLocalAccount] = useState<BankAccount>(account);

    useEffect(() => {
        setLocalAccount(account);
    }, [account]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalAccount(prev => ({
            ...prev,
            [name]: name === 'creditLimit' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSave = () => {
        onUpdate(localAccount);
        onClose();
    };
    
    const availableCredit = (localAccount.creditLimit || 0) - (localAccount.creditUsed || 0);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Detalhes da Conta: ${account.name}`}>
            <div className="space-y-4">
                <p><strong className="dark:text-slate-300">Tipo:</strong> <span className="text-slate-600 dark:text-slate-400">{account.type}</span></p>

                {account.type === 'Cartão de Crédito' && (
                    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div>
                            <label htmlFor="creditLimit" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Limite de Crédito Total (R$)</label>
                            <input
                                type="number"
                                id="creditLimit"
                                name="creditLimit"
                                value={localAccount.creditLimit || ''}
                                onChange={handleChange}
                                className={`mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`}
                                placeholder="Ex: 5000"
                            />
                        </div>
                        <div className="p-3 bg-slate-100 dark:bg-slate-900/50 rounded-lg space-y-2">
                             <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Limite Total:</span>
                                <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(localAccount.creditLimit || 0)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Crédito Utilizado:</span>
                                <span className="font-medium text-rose-600 dark:text-rose-400">{formatCurrency(localAccount.creditUsed || 0)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-semibold">
                                <span className="text-slate-600 dark:text-slate-300">Crédito Disponível:</span>
                                <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(availableCredit)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="mt-5 sm:mt-6 flex gap-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600"
                >
                    Cancelar
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    className={`inline-flex w-full justify-center rounded-md border border-transparent bg-${appColor}-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-${appColor}-700 focus:outline-none focus:ring-2 focus:ring-${appColor}-500 focus:ring-offset-2 sm:text-sm`}
                >
                    Salvar
                </button>
            </div>
        </Modal>
    );
};

export default BankAccountDetailsModal;
