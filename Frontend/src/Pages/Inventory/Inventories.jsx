import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus,
    Search,
    RefreshCw,
    X,
    Warehouse,
    Calendar,
    ClipboardList,
    AlignLeft,
    Eye,
    Edit,
    Trash2,
    Layout,
    MoreVertical,
    Clock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Inventories = () => {
    const { t, i18n } = useTranslation();
    const [inventories, setInventories] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        inventory: '',
        date: new Date().toISOString().slice(0, 16), // datetime-local format
        description: ''
    });

    const fetchInventories = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:4000/api/v1/inventories/all');
            if (!response.ok) throw new Error('Failed to fetch inventories');
            const data = await response.json();
            setInventories(data.inventories || data || []);
        } catch (error) {
            console.error('Error fetching inventories:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchWarehouses = async () => {
        try {
            const response = await fetch('http://localhost:4000/api/v1/warehouses/all');
            if (response.ok) {
                const data = await response.json();
                setWarehouses(data.warehouses || data || []);
            }
        } catch (error) {
            console.error('Error fetching warehouses:', error);
        }
    };

    useEffect(() => {
        fetchInventories();
        fetchWarehouses();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch('http://localhost:4000/api/v1/inventories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setIsAddModalOpen(false);
                setFormData({
                    inventory: '',
                    date: new Date().toISOString().slice(0, 16),
                    description: ''
                });
                fetchInventories();
            }
        } catch (error) {
            console.error('Error saving inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredInventories = useMemo(() => {
        return inventories.filter(inv =>
            inv.inventory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [inventories, searchTerm]);

    return (
        <div className="min-h-screen bg-[#F8FAFC]" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200 px-6 py-5 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                            <ClipboardList size={24} />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">{t('stocked.inventories.title')}</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group hidden sm:block">
                            <Search className={`absolute ${i18n.language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors`} size={18} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={t('sales.common.search_filter')}
                                className={`pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all w-64 text-${i18n.language === 'ar' ? 'right' : 'left'} ${i18n.language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                            />
                        </div>

                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all font-semibold shadow-lg shadow-indigo-100 group"
                        >
                            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                            <span>{t('sales.common.add')}</span>
                        </button>

                        <button
                            onClick={fetchInventories}
                            className={`p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all bg-white ${loading && !isAddModalOpen ? 'animate-spin' : ''}`}
                            title={t('sales.common.refresh')}
                        >
                            <RefreshCw size={20} className="text-gray-500" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                {loading && inventories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 gap-4">
                        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-gray-500 font-medium">{t('sales.common.loading')}</p>
                    </div>
                ) : filteredInventories.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center shadow-sm">
                        <div className="inline-flex p-6 bg-indigo-50 text-indigo-200 rounded-full mb-6">
                            <ClipboardList size={64} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{t('stocked.inventories.no_inventories')}</h3>
                        <p className="text-gray-500 mb-8">{t('stocked.inventories.start_creating')}</p>
                        <button onClick={() => setIsAddModalOpen(true)} className="text-indigo-600 font-semibold hover:underline flex items-center gap-2 mx-auto justify-center">
                            <Plus size={18} /> {t('stocked.inventories.add_inventory')}
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[#FBFCFE] border-b border-gray-200">
                                    <tr>
                                        <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('stocked.inventories.inventory_name')}</th>
                                        <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('stocked.inventories.date')}</th>
                                        <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('stocked.inventories.description')}</th>
                                        <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-600">
                                    {filteredInventories.map((inv) => (
                                        <tr key={inv._id || inv.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4 font-bold text-gray-900">
                                                <div className="flex items-center gap-2">
                                                    <Warehouse size={14} className="text-gray-400" />
                                                    {inv.inventory}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} className="text-gray-400" />
                                                    {new Date(inv.date).toLocaleString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 truncate max-w-xs">{inv.description || '-'}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                                        <Eye size={18} />
                                                    </button>
                                                    <button className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* Add Inventory Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg">
                                    <ClipboardList size={24} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">{t('stocked.inventories.add_inventory')}</h2>
                            </div>
                            <X onClick={() => setIsAddModalOpen(false)} className="text-gray-400 cursor-pointer hover:text-gray-900 transition-colors" />
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('stocked.inventories.inventory_name')} *</label>
                                    <div className="relative">
                                        <Warehouse className={`absolute ${i18n.language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} size={20} />
                                        <select
                                            required
                                            value={formData.inventory}
                                            onChange={(e) => setFormData({ ...formData, inventory: e.target.value })}
                                            className={`w-full ${i18n.language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all appearance-none text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                                        >
                                            <option value="">{t('sales.common.select_warehouse')}</option>
                                            {warehouses.map(w => (
                                                <option key={w._id || w.id} value={w.name}>{w.name}</option>
                                            ))}
                                            <option value="المستودع الرئيسي">{t('sales.common.main_warehouse')}</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('stocked.inventories.date')} *</label>
                                    <div className="relative">
                                        <Calendar className={`absolute ${i18n.language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} size={20} />
                                        <input
                                            required
                                            type="datetime-local"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className={`w-full ${i18n.language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('stocked.inventories.description')}</label>
                                    <div className="relative">
                                        <AlignLeft className={`absolute ${i18n.language === 'ar' ? 'right-4' : 'left-4'} top-4 text-gray-400`} size={20} />
                                        <textarea
                                            rows="4"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className={`w-full ${i18n.language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-${i18n.language === 'ar' ? 'right' : 'left'} resize-none`}
                                            placeholder={t('stocked.inventories.description')}
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 p-4 border-2 border-gray-100 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-colors">{t('sales.common.cancel')}</button>
                                <button type="submit" disabled={loading} className="flex-1 p-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all">
                                    {loading ? '...' : t('sales.common.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventories;
