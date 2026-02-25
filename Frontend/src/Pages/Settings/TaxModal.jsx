import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

const TaxModal = ({ isOpen, onClose, onSave, initialData = null, accounts = [], submitLoading = false }) => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';

    const [formData, setFormData] = useState({
        name: '',
        percentage: '',
        isInclusive: false,
        paidTaxAccountId: '',
        collectedTaxAccountId: '',
        status: 'active'
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                percentage: initialData.percentage || '',
                isInclusive: initialData.isInclusive || false,
                paidTaxAccountId: initialData.paidTaxAccountId?._id || initialData.paidTaxAccountId || '',
                collectedTaxAccountId: initialData.collectedTaxAccountId?._id || initialData.collectedTaxAccountId || '',
                status: initialData.status || 'active'
            });
        } else {
            setFormData({
                name: '',
                percentage: '',
                isInclusive: false,
                paidTaxAccountId: '',
                collectedTaxAccountId: '',
                status: 'active'
            });
        }
        setErrors({});
    }, [initialData, isOpen]);

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = t('taxes_settings.field_required');
        if (formData.percentage === '') newErrors.percentage = t('taxes_settings.field_required');
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSave(formData);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-[1px] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-[650px] min-w-0 max-h-[95vh] overflow-hidden flex flex-col my-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 shrink-0 bg-white">
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-1">
                        <X size={20} />
                    </button>
                    <h2 className="text-xl font-bold text-gray-800">
                        {initialData ? t('taxes_settings.modal_title_edit') : t('taxes_settings.modal_title_add')}
                    </h2>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-8 overflow-y-auto space-y-6">
                        {/* Name */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 text-start">
                                {t('taxes_settings.name')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={`w-full h-11 px-4 border ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 text-start bg-white`}
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1 font-bold">{errors.name}</p>}
                        </div>

                        {/* Percentage */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 text-start">
                                {t('taxes_settings.percentage')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.percentage}
                                onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                                placeholder={t('taxes_settings.percentage_placeholder')}
                                className={`w-full h-11 px-4 border ${errors.percentage ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 text-start bg-white`}
                            />
                            {errors.percentage && <p className="text-red-500 text-xs mt-1 font-bold">{errors.percentage}</p>}
                        </div>

                        {/* Is Inclusive */}
                        <div className="flex items-center gap-2 py-2">
                            <input
                                type="checkbox"
                                id="isInclusive"
                                checked={formData.isInclusive}
                                onChange={(e) => setFormData({ ...formData, isInclusive: e.target.checked })}
                                className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor="isInclusive" className="text-sm font-semibold text-gray-700 cursor-pointer">
                                {t('taxes_settings.is_inclusive')}
                            </label>
                        </div>

                        {/* Paid Tax Account */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-gray-700 text-start">
                                {t('taxes_settings.paid_tax_account')}
                            </label>
                            <select
                                value={formData.paidTaxAccountId}
                                onChange={(e) => setFormData({ ...formData, paidTaxAccountId: e.target.value })}
                                className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 text-start bg-white appearance-none cursor-pointer"
                            >
                                <option value="">{i18n.language === 'ar' ? 'حساب جديد' : 'New Account'}</option>
                                {accounts.map(acc => (
                                    <option key={acc._id} value={acc._id}>
                                        {acc.name} #{acc.code}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Collected Tax Account */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-gray-700 text-start">
                                {t('taxes_settings.collected_tax_account')}
                            </label>
                            <select
                                value={formData.collectedTaxAccountId}
                                onChange={(e) => setFormData({ ...formData, collectedTaxAccountId: e.target.value })}
                                className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 text-start bg-white appearance-none cursor-pointer"
                            >
                                <option value="">{i18n.language === 'ar' ? 'حساب جديد' : 'New Account'}</option>
                                {accounts.map(acc => (
                                    <option key={acc._id} value={acc._id}>
                                        {acc.name} #{acc.code}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 sm:px-8 py-5 border-t border-gray-100 flex items-center gap-3 justify-start bg-white shrink-0">
                        <button
                            type="submit"
                            disabled={submitLoading}
                            className="px-8 py-2 bg-[#10B981] text-white font-bold rounded hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50"
                        >
                            {submitLoading ? t('sales.common.loading', 'Loading...') : t('taxes_settings.save')}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-2 bg-white border border-gray-300 text-gray-600 font-bold rounded hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            {t('taxes_settings.cancel')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaxModal;
