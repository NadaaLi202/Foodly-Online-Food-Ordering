import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, RefreshCw, GripVertical, MinusCircle, PlusCircle } from 'lucide-react';
import { Reorder } from 'framer-motion';
import toast from 'react-hot-toast';
import codingService from '../../services/codingService';
import api from '../../services/api';

const CodingSettings = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const [entity, setEntity] = useState('invoices');
    const [rules, setRules] = useState({
        parts: [],
        separator: '-',
        sequences: {}
    });
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newPartType, setNewPartType] = useState('fixed');
    const [branchSequences, setBranchSequences] = useState({});

    const entities = [
        'invoices', 'returns', 'quotations', 'purchase_invoices',
        'purchase_returns', 'purchase_requests', 'purchase_orders',
        'products', 'customers', 'suppliers', 'journal_entries'
    ];

    const partTypes = ['fixed', 'year', 'branch', 'sequence'];

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [rulesRes, branchesRes] = await Promise.all([
                codingService.getRules(entity),
                api.get('/branch')
            ]);
            setRules(rulesRes.rules);
            setBranches(branchesRes.data.data || []);

            const sequences = {};
            (branchesRes.data.data || []).forEach(b => {
                sequences[b._id] = rulesRes.rules.sequences?.[b._id] || 0;
            });
            setBranchSequences(sequences);
        } catch (err) {
            toast.error(t('sales.common.error_message'));
        } finally {
            setLoading(false);
        }
    }, [entity, t]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpdateRules = async () => {
        setSaving(true);
        try {
            await codingService.updateRules(entity, {
                parts: rules.parts,
                separator: rules.separator
            });
            toast.success(t('coding_settings.success_save'));
        } catch (err) {
            toast.error(t('sales.common.error_message'));
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateSequence = async (branchId) => {
        try {
            await codingService.updateBranchSequence(entity, {
                branchId,
                sequence: branchSequences[branchId]
            });
            toast.success(t('coding_settings.success_sequence'));
        } catch (err) {
            toast.error(t('sales.common.error_message'));
        }
    };

    const addPart = () => {
        const newPart = { id: Date.now().toString(), type: newPartType, value: '', length: 6 };
        setRules({ ...rules, parts: [...rules.parts, newPart] });
    };

    const removePart = (index) => {
        const newParts = [...rules.parts];
        newParts.splice(index, 1);
        setRules({ ...rules, parts: newParts });
    };

    const updatePart = (index, field, value) => {
        const newParts = [...rules.parts];
        newParts[index][field] = value;
        setRules({ ...rules, parts: newParts });
    };

    const generatePreview = () => {
        const currentYear = new Date().getFullYear().toString().slice(-2);
        const exampleBranch = '1';

        return rules.parts.map(part => {
            if (part.type === 'fixed') return part.value || '???';
            if (part.type === 'year') return currentYear;
            if (part.type === 'branch') return exampleBranch;
            if (part.type === 'sequence') return '1'.padStart(part.length || 6, '0');
            return '';
        }).join(rules.separator || '');
    };

    return (
        <div className="p-6 bg-[#F8F9FA] min-h-screen font-sans" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white border border-gray-200 rounded overflow-hidden h-10 shadow-sm px-2 gap-2">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="text-gray-400 hover:text-gray-600 px-1 border-l border-gray-100 last:border-l-0"
                        >
                            <Home size={18} />
                        </button>
                        <div className="flex items-center text-[#4B5563] font-medium text-sm gap-1">
                            <span className="text-gray-400">{t('sidebar.settings')}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-700 font-bold">{t('coding_settings.title')}</span>
                        </div>
                        <button
                            type="button"
                            onClick={fetchData}
                            className="text-gray-400 hover:text-gray-600 px-1 border-r border-gray-100 first:border-r-0"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8">
                    {/* Entity Selector */}
                    <div className="mb-8">
                        <select
                            value={entity}
                            onChange={(e) => setEntity(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-md py-2.5 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none shadow-sm cursor-pointer"
                            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M8 9l4-4 4 4m0 6l-4 4-4-4\' /%3E%3C/svg%3E")', backgroundPosition: isRTL ? 'left 1rem center' : 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em' }}
                        >
                            {entities.map(e => (
                                <option key={e} value={e}>{t(`coding_settings.entities.${e}`)}</option>
                            ))}
                        </select>
                    </div>

                    {/* Coding Parts List - Using Reorder for real DND */}
                    <Reorder.Group axis="y" values={rules.parts} onReorder={(newParts) => setRules({ ...rules, parts: newParts })} className="space-y-4 mb-8">
                        {rules.parts.map((part, index) => (
                            <Reorder.Item key={part.id || index} value={part} className="flex items-center gap-4 bg-white border-b border-gray-100 pb-4 group">
                                <button onClick={() => removePart(index)} className="text-red-500 hover:text-red-700 transition-colors">
                                    <MinusCircle size={22} className="text-red-500" />
                                </button>

                                <div className="flex-1 flex items-center justify-between">
                                    <div className="flex-1 px-4">
                                        {part.type === 'fixed' && (
                                            <input
                                                type="text"
                                                value={part.value}
                                                onChange={(e) => updatePart(index, 'value', e.target.value)}
                                                className="bg-white border border-gray-200 rounded py-2 px-4 text-sm w-full dark:text-gray-700 text-center shadow-inner"
                                                placeholder={t('coding_settings.field_labels.fixed_value')}
                                            />
                                        )}
                                        {part.type === 'year' && (
                                            <div className="bg-white border border-gray-200 rounded py-2 px-4 text-sm w-full text-center text-gray-700 shadow-inner">
                                                {new Date().getFullYear().toString().slice(-2)}
                                            </div>
                                        )}
                                        {part.type === 'branch' && (
                                            <div className="bg-white border border-gray-200 rounded py-2 px-4 text-sm w-full text-center text-gray-700 shadow-inner">
                                                {t('coding_settings.parts.branch')}
                                            </div>
                                        )}
                                        {part.type === 'sequence' && (
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="text-gray-600 text-sm whitespace-nowrap">{t('coding_settings.field_labels.min_digits')}</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="10"
                                                    value={part.length}
                                                    onChange={(e) => updatePart(index, 'length', parseInt(e.target.value))}
                                                    className="bg-white border border-gray-200 rounded py-1 px-2 text-sm w-16 text-center text-gray-700 shadow-inner"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4 min-w-[150px] justify-end">
                                        <span className="text-gray-700 font-bold text-sm">{t(`coding_settings.parts.${part.type}`)}</span>
                                        <GripVertical size={20} className="text-gray-400 cursor-grab active:cursor-grabbing" />
                                    </div>
                                </div>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>

                    {/* Add Part Row */}
                    <div className="flex items-center gap-4 mb-2 pb-8 border-b border-gray-100 justify-end">
                        <select
                            value={newPartType}
                            onChange={(e) => setNewPartType(e.target.value)}
                            className="bg-white border border-gray-200 rounded py-1.5 px-3 text-sm text-gray-700 min-w-[150px] focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none text-center"
                        >
                            {partTypes.map(pt => (
                                <option key={pt} value={pt}>{t(`coding_settings.parts.${pt}`)}</option>
                            ))}
                        </select>
                        <button onClick={addPart} className="text-emerald-500 hover:text-emerald-600 transition-colors">
                            <PlusCircle size={24} className="text-emerald-500" />
                        </button>
                    </div>

                    {/* Separator & Preview */}
                    <div className="space-y-6 mb-8 pt-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-gray-500 text-sm font-bold">{t('coding_settings.field_labels.separator')}</label>
                            <select
                                value={rules.separator}
                                onChange={(e) => setRules({ ...rules, separator: e.target.value })}
                                className="bg-white border border-gray-200 rounded-md py-2.5 px-4 text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none shadow-sm cursor-pointer text-center"
                                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundPosition: isRTL ? 'left 1rem center' : 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em' }}
                            >
                                <option value="-">-</option>
                                <option value="_">_</option>
                                <option value="/">/</option>
                                <option value="">None</option>
                            </select>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-md flex justify-between items-center shadow-inner">
                            <span className="text-indigo-600 font-mono font-bold tracking-wider text-lg">{generatePreview()}</span>
                            <span className="text-gray-500 font-bold">{t('coding_settings.field_labels.example')}</span>
                        </div>

                        <div className="flex justify-start">
                            <button
                                onClick={handleUpdateRules}
                                disabled={saving}
                                className="bg-[#10B981] text-white px-8 py-2 rounded-md font-bold hover:bg-emerald-600 transition-colors shadow-md disabled:opacity-50"
                            >
                                {saving ? t('sales.common.loading') : t('coding_settings.field_labels.save_btn')}
                            </button>
                        </div>
                    </div>

                    {/* Branch Sequences */}
                    <div className="mt-12 pt-8 border-t border-gray-100">
                        <h3 className="text-gray-500 font-bold text-center mb-10">{t('coding_settings.field_labels.current_sequence')}</h3>
                        <div className="space-y-6">
                            {branches.map(branch => (
                                <div key={branch._id} className="flex items-center gap-4">
                                    <span className="text-gray-400 text-sm font-bold min-w-[60px] text-left">{t('coding_settings.field_labels.branch_label')}</span>
                                    <div className="flex-1 flex justify-between items-center">
                                        <span className="text-gray-700 font-bold">{branch.name || t('coding_settings.field_labels.main_branch')}</span>
                                        <div className="flex items-center rounded overflow-hidden shadow-sm border border-gray-100">
                                            <input
                                                type="number"
                                                value={branchSequences[branch._id] || 0}
                                                onChange={(e) => setBranchSequences({ ...branchSequences, [branch._id]: parseInt(e.target.value) || 0 })}
                                                className="bg-white px-4 py-2 w-28 text-center text-gray-700 font-bold focus:outline-none"
                                            />
                                            <button
                                                onClick={() => handleUpdateSequence(branch._id)}
                                                className="bg-[#0095FF] text-white px-6 py-2 hover:bg-blue-600 transition-colors font-bold"
                                            >
                                                {t('coding_settings.field_labels.save_btn')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodingSettings;
