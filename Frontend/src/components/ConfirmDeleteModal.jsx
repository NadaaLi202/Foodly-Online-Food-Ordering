import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertTriangle } from 'lucide-react';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, title, message, loading }) => {
    const { t } = useTranslation();
    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (onConfirm) await onConfirm();
        if (onClose) onClose();
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/35" onClick={onClose} aria-hidden="true" />
            <div className="relative w-full max-w-[410px] overflow-hidden rounded-lg bg-white shadow-2xl">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute left-4 top-4 text-gray-400 transition-colors hover:text-gray-600"
                    aria-label="Close"
                >
                    <X size={18} />
                </button>

                <div className="flex items-center justify-end gap-3 border-b border-gray-100 px-5 py-4">
                    <h3 className="text-xl font-bold text-gray-900">
                        {title || t('sales.common.confirm_delete')}
                    </h3>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-500">
                        <AlertTriangle size={18} />
                    </div>
                </div>

                <div className="px-5 py-5 text-sm text-gray-700">
                    {message || t('sales.common.confirm_delete')}
                </div>

                <div className="flex items-center gap-2 border-t border-gray-100 px-3 py-3">
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={loading}
                        className="rounded-md bg-red-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                    >
                        {loading ? t('sales.common.loading') : t('sales.common.confirm', 'Confirm')}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border border-gray-300 bg-white px-5 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
                    >
                        {t('sales.common.cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteModal;
