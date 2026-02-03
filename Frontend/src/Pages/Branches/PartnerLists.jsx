import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, RefreshCw, X, Home } from 'lucide-react';

const PartnerLists = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [errors, setErrors] = useState([]);

    const [partnerLists, setPartnerLists] = useState([
        {
            id: 1,
            name: t('partner_lists_page.default_partners')
        }
    ]);

    // Form State
    const [formData, setFormData] = useState({
        name: ''
    });

    const filteredLists = partnerLists.filter(list =>
        list.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const validateForm = () => {
        const newErrors = [];
        if (!formData.name) newErrors.push(t('partner_lists_page.validation.name_required'));

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handleSave = () => {
        if (validateForm()) {
            if (editingId) {
                setPartnerLists(partnerLists.map(l => l.id === editingId ? { ...l, name: formData.name } : l));
            } else {
                const newList = {
                    id: Date.now(),
                    name: formData.name
                };
                setPartnerLists([...partnerLists, newList]);
            }
            setIsModalOpen(false);
            resetForm();
        }
    };

    const resetForm = () => {
        setFormData({
            name: ''
        });
        setEditingId(null);
        setErrors([]);
    };

    const handleEdit = (list) => {
        setFormData({ name: list.name });
        setEditingId(list.id);
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        setPartnerLists(partnerLists.filter(l => l.id !== id));
    };

    return (
        <div className="p-6 bg-white min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Top Toolbar */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white border border-gray-200 rounded-md overflow-hidden h-10 shadow-sm">
                        <button className="px-3 h-full text-gray-400 hover:text-gray-600 transition-colors bg-white">
                            <Home size={18} />
                        </button>
                        <div className="flex items-center text-[#4B5563] font-medium text-sm h-full relative">
                            <span className="h-full w-[1px] bg-gray-200 skew-x-[-20deg] mx-1"></span>
                            <div className="px-5 h-full flex items-center bg-gray-50/80 font-bold text-gray-700">
                                {t('partner_lists_page.title')}
                            </div>
                        </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 transition-colors bg-white p-2 rounded-md border border-gray-100 shadow-sm">
                        <RefreshCw size={18} />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="flex items-center gap-2 bg-[#4F46E5] text-white px-4 h-10 rounded-md hover:bg-indigo-700 transition-colors font-semibold shadow-sm text-sm"
                    >
                        <Plus size={18} strokeWidth={3} />
                        <span>{t('sales.common.add')}</span>
                    </button>

                    <div className="relative h-10">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t('sales.common.search_filter')}
                            className="bg-[#F0F7FF] border border-[#BFDBFE] text-[#2563EB] px-4 h-full pr-10 rounded-md hover:bg-blue-100 transition-colors outline-none focus:ring-1 focus:ring-blue-400 font-semibold w-72 placeholder:text-blue-400 text-sm"
                        />
                        <Search size={16} className="absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* List Content */}
            <div className="overflow-x-auto border border-gray-100 rounded-xl shadow-sm">
                <table className="w-full text-sm text-start">
                    <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-start">{t('partner_lists_page.partners_list')}</th>
                            <th className="px-6 py-4 text-center"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredLists.map((list) => (
                            <tr key={list.id} className="hover:bg-gray-50/80 transition-colors group">
                                <td className="px-6 py-4 text-gray-700 font-bold">{list.name}</td>
                                <td className="px-6 py-4 flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => handleEdit(list)}
                                        className="text-blue-500 hover:text-blue-700 font-bold"
                                    >
                                        {t('accounting.chart_of_accounts.edit')}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(list.id)}
                                        className="text-red-500 hover:text-red-700 font-bold"
                                    >
                                        {t('accounting.chart_of_accounts.delete')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[1px]" dir={isRTL ? 'rtl' : 'ltr'}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[600px] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingId ? t('accounting.chart_of_accounts.edit') : t('partner_lists_page.add_partner_list')}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 bg-white">
                            {/* Validation Errors */}
                            {errors.length > 0 && (
                                <div className="mb-6 p-4 bg-red-50 border-r-4 border-red-500 rounded-md">
                                    <ul className="list-disc list-inside text-red-600 text-sm font-bold space-y-1">
                                        {errors.map((error, index) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="space-y-6">
                                {/* Name */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-gray-600 text-start">
                                        {t('partner_lists_page.partner_list_name')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        autoFocus
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 text-start transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-5 border-t border-gray-100 flex items-center gap-3 justify-start bg-white">
                            <button
                                onClick={handleSave}
                                className="px-8 py-2 bg-[#10B981] text-white font-bold rounded-md hover:bg-emerald-600 transition-colors shadow-sm"
                            >
                                {t('sales.common.save')}
                            </button>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-8 py-2 bg-white border border-gray-300 text-gray-600 font-bold rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                {t('sales.common.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartnerLists;
