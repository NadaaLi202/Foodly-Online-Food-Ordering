import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Loader2, MinusCircle, PlusCircle, GripVertical, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import codingService from '../../services/codingservice';

const DEFAULT_FORM = {
    entity: 'invoices',
    prefix: 'INV',
    year: new Date().getFullYear().toString().slice(-2),
    branchScope: 'branch',
    minDigits: 6,
    separator: '-'
};

const CodingSettings = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const entities = [
        'invoices',
        'returns',
        'quotations',
        'purchase_invoices',
        'purchase_returns',
        'purchase_requests',
        'purchase_orders',
        'products',
        'customers',
        'suppliers',
        'journal_entries'
    ];

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingBranchId, setSavingBranchId] = useState('');
    const [form, setForm] = useState(DEFAULT_FORM);
    const [branchSequences, setBranchSequences] = useState([]);

    const fetchCodingSettings = useCallback(async (entity) => {
        setLoading(true);
        try {
            const response = await codingService.getSettings(entity);
            const payload = response?.data || {};

            setForm((prev) => ({
                ...prev,
                entity,
                prefix: payload.prefix || 'INV',
                year: payload.year || new Date().getFullYear().toString().slice(-2),
                branchScope: payload.branchScope || 'branch',
                minDigits: Math.max(1, Number(payload.minDigits || 6)),
                separator: payload.separator ?? '-'
            }));
            setBranchSequences(Array.isArray(payload.branchSequences) ? payload.branchSequences : []);
        } catch (error) {
            toast.error(t('sales.common.error_message'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchCodingSettings(form.entity);
    }, [fetchCodingSettings, form.entity]);

    const preview = useMemo(() => {
        const previewSequence = Math.max(0, Number(branchSequences?.[0]?.currentSequence ?? 1));
        const paddedSequence = String(previewSequence).padStart(Math.max(1, Number(form.minDigits || 1)), '0');
        const separator = form.separator ?? '-';
        return `${form.prefix || ''}${separator}${form.year || ''}${separator}${paddedSequence}`;
    }, [form.prefix, form.year, form.minDigits, form.separator, branchSequences]);

    const showSuccessToast = (title, subtitle) => {
        toast.custom((toastObj) => (
            <div
                className={`${toastObj.visible ? 'animate-enter' : 'animate-leave'
                    } max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 border-l-4 border-green-500`}
            >
                <div className="flex-1 w-0">
                    <div className={`flex items-start ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                            <p className="text-sm font-bold text-gray-900">{title}</p>
                            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
                        </div>
                        <div className={`flex-shrink-0 flex items-center justify-center p-1 bg-green-100 rounded-full ${isRTL ? 'mr-3' : 'ml-3'}`}>
                            <Check className="h-4 w-4 text-green-600" />
                        </div>
                    </div>
                </div>
            </div>
        ), {
            position: isRTL ? 'top-left' : 'top-right',
            duration: 3000
        });
    };

    const onFormChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const updateBranchSequenceValue = (branchId, nextValue) => {
        setBranchSequences((prev) => prev.map((item) => (
            item.branchId === branchId
                ? { ...item, currentSequence: Math.max(0, Number.isNaN(Number(nextValue)) ? 0 : Number(nextValue)) }
                : item
        )));
    };

    const handleSaveSettings = async () => {
        if (!form.prefix?.trim()) {
            toast.error(t('coding_settings.validation.prefix_required'));
            return;
        }
        if (Number(form.minDigits) < 1) {
            toast.error(t('coding_settings.validation.min_digits'));
            return;
        }

        setSaving(true);
        try {
            await codingService.updateSettings({
                entity: form.entity,
                prefix: form.prefix.trim(),
                year: String(form.year || '').trim(),
                branchScope: form.branchScope,
                minDigits: Number(form.minDigits),
                separator: form.separator
            });
            showSuccessToast(
                t('coding_settings.success_title'),
                t('coding_settings.success_save')
            );
            await fetchCodingSettings(form.entity);
        } catch (error) {
            toast.error(t('sales.common.error_message'));
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateBranchSequence = async (branchId) => {
        const branchItem = branchSequences.find((item) => item.branchId === branchId);
        const sequenceValue = Number(branchItem?.currentSequence ?? 0);

        if (sequenceValue < 0) {
            toast.error(t('coding_settings.validation.sequence'));
            return;
        }

        setSavingBranchId(branchId);
        try {
            await codingService.updateBranchSequence({
                entity: form.entity,
                branchId,
                sequence: sequenceValue
            });
            showSuccessToast(
                t('coding_settings.success_title'),
                t('coding_settings.success_sequence')
            );
        } catch (error) {
            toast.error(t('sales.common.error_message'));
        } finally {
            setSavingBranchId('');
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f1f3f5] py-4 px-4 md:px-8" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="max-w-[980px] mx-auto">
                <div className="flex justify-center mb-3">
                    <div className="inline-flex items-center border border-gray-200 rounded overflow-hidden bg-white text-xs">
                        <span className="px-4 py-2 text-gray-600">{t('sidebar.settings')}</span>
                        <span className="px-4 py-2 border-x border-gray-200 text-gray-800 font-bold">{t('coding_settings.title')}</span>
                        <span className="px-3 py-2 text-gray-500"><Home size={13} /></span>
                    </div>
                </div>

                <div className="max-w-[570px] ml-auto bg-white border border-gray-200 rounded">
                    <div className="p-4">
                        <select
                            value={form.entity}
                            onChange={(e) => onFormChange('entity', e.target.value)}
                            className="w-full h-9 px-3 text-sm rounded border border-gray-300 bg-[#f8fafc] text-gray-700 outline-none mb-4"
                        >
                            {entities.map((entity) => (
                                <option key={entity} value={entity}>
                                    {t(`coding_settings.entities.${entity}`)}
                                </option>
                            ))}
                        </select>

                        <div className="border-t border-b border-gray-200">
                            <div className="flex items-center min-h-[46px] border-b border-gray-200">
                                <div className="w-7 flex justify-center">
                                    <MinusCircle size={14} className="text-red-600" />
                                </div>
                                <div className="flex-1 grid grid-cols-[98px_1fr_20px] gap-3 items-center px-1">
                                    <input
                                        type="text"
                                        value={form.prefix}
                                        onChange={(e) => onFormChange('prefix', e.target.value)}
                                        className="h-7 px-2 text-center text-xs rounded border border-gray-300 outline-none"
                                    />
                                    <span className="text-sm text-gray-800">{t('coding_settings.field_labels.fixed_value')}</span>
                                    <GripVertical size={14} className="text-gray-400" />
                                </div>
                            </div>

                            <div className="flex items-center min-h-[46px] border-b border-gray-200">
                                <div className="w-7 flex justify-center">
                                    <MinusCircle size={14} className="text-red-600" />
                                </div>
                                <div className="flex-1 grid grid-cols-[98px_1fr_20px] gap-3 items-center px-1">
                                    <input
                                        type="text"
                                        value={form.year}
                                        onChange={(e) => onFormChange('year', e.target.value)}
                                        className="h-7 px-2 text-center text-xs rounded border border-gray-300 outline-none"
                                    />
                                    <span className="text-sm text-gray-800">{t('coding_settings.parts.year')}</span>
                                    <GripVertical size={14} className="text-gray-400" />
                                </div>
                            </div>

                            <div className="flex items-center min-h-[46px] border-b border-gray-200">
                                <div className="w-7" />
                                <div className="flex-1 grid grid-cols-[98px_1fr_20px] gap-3 items-center px-1">
                                    <select
                                        value={form.branchScope}
                                        onChange={(e) => onFormChange('branchScope', e.target.value)}
                                        className="h-7 px-1 text-center text-xs rounded border border-gray-300 bg-white outline-none"
                                    >
                                        <option value="branch">{t('coding_settings.field_labels.branch_scope_branch')}</option>
                                        <option value="global">{t('coding_settings.field_labels.branch_scope_global')}</option>
                                    </select>
                                    <span className="text-sm text-gray-800">{t('coding_settings.parts.branch')}</span>
                                    <GripVertical size={14} className="text-gray-400" />
                                </div>
                            </div>

                            <div className="flex items-center min-h-[46px] border-b border-gray-200">
                                <div className="w-7" />
                                <div className="flex-1 grid grid-cols-[98px_1fr_20px] gap-3 items-center px-1">
                                    <input
                                        type="number"
                                        min="1"
                                        value={form.minDigits}
                                        onChange={(e) => onFormChange('minDigits', Number(e.target.value))}
                                        className="h-7 px-2 text-center text-xs rounded border border-gray-300 outline-none"
                                    />
                                    <span className="text-sm text-gray-800">{t('coding_settings.field_labels.min_digits')}</span>
                                    <GripVertical size={14} className="text-gray-400" />
                                </div>
                            </div>

                            <div className="flex items-center min-h-[46px] border-b border-gray-200">
                                <div className="w-7 flex justify-center">
                                    <PlusCircle size={14} className="text-green-600" />
                                </div>
                                <div className="flex-1 grid grid-cols-[98px_1fr_20px] gap-3 items-center px-1">
                                    <select
                                        value={form.separator}
                                        onChange={(e) => onFormChange('separator', e.target.value)}
                                        className="h-7 px-1 text-center text-xs rounded border border-gray-300 bg-white outline-none"
                                    >
                                        <option value="-">-</option>
                                        <option value="/">/</option>
                                        <option value="_">_</option>
                                        <option value="">{t('coding_settings.field_labels.no_separator')}</option>
                                    </select>
                                    <span className="text-sm text-gray-800">{t('coding_settings.field_labels.separator')}</span>
                                    <GripVertical size={14} className="text-gray-400" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between min-h-[40px] px-3">
                                <span className="text-sm text-gray-900 font-medium">{preview}</span>
                                <span className="text-sm text-gray-700">{t('coding_settings.field_labels.example')}</span>
                            </div>
                        </div>

                        <div className="pt-3">
                            <button
                                onClick={handleSaveSettings}
                                disabled={saving}
                                className="h-8 px-5 rounded bg-[#10b981] text-white text-sm font-bold hover:bg-emerald-600 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : t('coding_settings.field_labels.save_btn')}
                            </button>
                        </div>

                        <div className="mt-4 border-t border-gray-200 pt-4">
                            <div className={`grid grid-cols-[1fr_170px] text-sm font-bold text-gray-800 border-b border-gray-200 pb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                                <span>{t('coding_settings.field_labels.branch_label')}</span>
                                <span className="text-center">{t('coding_settings.field_labels.current_sequence')}</span>
                            </div>

                            <div className="pt-2 space-y-2">
                                {branchSequences.map((branch) => (
                                    <div key={branch.branchId} className="grid grid-cols-[1fr_170px] items-center min-h-[34px] border-b border-gray-100 pb-2 last:border-b-0 last:pb-0">
                                        <span className="text-sm text-gray-800">{branch.branchName || t('coding_settings.field_labels.main_branch')}</span>
                                        <div className={`flex items-center gap-2 ${isRTL ? 'justify-start' : 'justify-end'}`}>
                                            <button
                                                type="button"
                                                onClick={() => updateBranchSequenceValue(branch.branchId, Number(branch.currentSequence || 0) - 1)}
                                                className="h-8 w-8 rounded border border-gray-300 bg-white text-gray-700 text-base leading-none hover:bg-gray-50"
                                            >
                                                -
                                            </button>
                                            <input
                                                type="number"
                                                min="0"
                                                value={branch.currentSequence}
                                                onChange={(e) => {
                                                    updateBranchSequenceValue(branch.branchId, e.target.value);
                                                }}
                                                className="h-8 w-[72px] px-2 text-center text-sm rounded border border-gray-300 outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => updateBranchSequenceValue(branch.branchId, Number(branch.currentSequence || 0) + 1)}
                                                className="h-8 w-8 rounded border border-gray-300 bg-white text-gray-700 text-base leading-none hover:bg-gray-50"
                                            >
                                                +
                                            </button>
                                            <button
                                                onClick={() => handleUpdateBranchSequence(branch.branchId)}
                                                disabled={savingBranchId === branch.branchId}
                                                className="h-8 px-4 rounded bg-[#0d8eff] text-white text-xs font-bold hover:bg-blue-600 disabled:opacity-50"
                                            >
                                                {savingBranchId === branch.branchId ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : t('coding_settings.field_labels.save_btn')}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes enter {
                    from { transform: translateY(-20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes leave {
                    from { transform: translateY(0); opacity: 1; }
                    to { transform: translateY(-20px); opacity: 0; }
                }
                .animate-enter { animation: enter 0.3s ease-out forwards; }
                .animate-leave { animation: leave 0.3s ease-in forwards; }
            `}</style>
        </div>
    );
};

export default CodingSettings;
