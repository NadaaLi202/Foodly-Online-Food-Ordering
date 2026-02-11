import React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, title, message, loading }) => {
    const { t } = useTranslation();
    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (onConfirm) await onConfirm();
        if (onClose) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-black text-gray-800">
                        {title || t('sales.common.confirm_delete')}
                    </h3>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>
                <p className="text-gray-600 text-sm mb-6">{message || t('sales.common.confirm_delete')}</p>
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50"
                    >
                        {t('sales.common.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={loading}
                        className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-60"
                    >
                        {loading ? t('sales.common.loading') : t('sales.common.delete')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteModal;
