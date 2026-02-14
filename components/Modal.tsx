
import React, { Fragment } from 'react';
import { CloseIcon } from './Icons';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity dark:bg-slate-900/80"></div>
            <div className="fixed inset-0 z-10 overflow-y-auto">
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-slate-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                        <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div className="sm:flex sm:items-start">
                                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-slate-200" id="modal-title">
                                        {title}
                                    </h3>
                                    <div className="mt-4">{children}</div>
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="absolute top-0 right-0 mt-4 mr-4 text-gray-400 hover:text-gray-500 dark:text-slate-400 dark:hover:text-slate-300"
                            onClick={onClose}
                        >
                            <span className="sr-only">Fechar</span>
                            <CloseIcon />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Modal;
