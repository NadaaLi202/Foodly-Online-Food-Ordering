import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, RefreshCw, Info, Plus, X, LayoutGrid } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClientService from '../../services/apiClientService';
import api from '../../services/api';
import { confirmDelete } from '../../utils/confirmDelete';

const ApiSettings = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const [clients, setClients] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', role: '', branches: [] });
    const [saving, setSaving] = useState(false);

    const roles = [
        { id: 'admin', name: t('sidebar.admin', 'Admin') },
        { id: 'accountant', name: t('sidebar.accountant', 'Accountant') }
    ];

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [clientsRes, branchesRes] = await Promise.all([
                apiClientService.getAll(),
                api.get('/branches')
            ]);
            setClients(clientsRes.data || []);
            setBranches(branchesRes.data.branches || branchesRes.data.data || []);
        } catch (err) {
            const status = err.response?.status;
            if (status !== 401 && status !== 403 && !(status >= 500)) {
                toast.error(err.response?.data?.message || t('sales.common.error_message'));
            }
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateClient = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await apiClientService.create(formData);
            toast.success(t('api_settings.success_create'));
            setIsModalOpen(false);
            setFormData({ name: '', role: '', branches: [] });
            fetchData();
        } catch (err) {
            const status = err.response?.status;
            if (status !== 401 && status !== 403 && !(status >= 500)) {
                toast.error(err.response?.data?.message || t('sales.common.error_message'));
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 bg-[#F8F9FA] min-h-screen font-sans" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
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
                            <span className="text-gray-700 font-bold">{t('api_settings.title')}</span>
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
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[#5D5FEF] text-white px-4 py-2 rounded-md font-bold flex items-center gap-2 hover:bg-[#4b4dc7] transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    {t('api_settings.add_btn')}
                </button>
            </div>

            {/* Info Box */}
            <div className={`bg-[#E3F2FD] border border-[#BBDEFB] p-4 rounded-md mb-8 flex flex-col gap-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                <div className={`flex items-center gap-1.5 ${isRTL ? 'justify-start' : 'justify-end'}`}>
                    <span className="text-[#1976D2] font-bold text-sm order-1">{t('sidebar.info', 'معلومات')}</span>
                    <Info size={16} className="text-[#1976D2] order-2" />
                </div>
                <p className={`text-[#1976D2] text-[13px] leading-relaxed ${isRTL ? 'pr-6' : 'pl-6'}`}>
                    {t('api_settings.info_box')} <a href="#" className="underline font-bold text-[#1976D2]">{t('api_settings.doc_link')}</a>
                </p>
            </div>

            {/* Empty State */}
            {clients.length === 0 && !loading && (
                <div className="bg-white border border-dashed border-gray-200 rounded-lg py-32 flex flex-col items-center justify-center text-center">
                    <div className="text-gray-200 mb-6 font-thin">
                        <LayoutGrid size={84} strokeWidth={0.5} />
                    </div>
                    <h3 className="text-gray-800 font-bold text-[18px] mb-2">{t('api_settings.empty_title')}</h3>
                    <button
                        type="button"
                        onClick={() => {
                            console.log("Button clicked, opening modal");
                            setIsModalOpen(true);
                        }}
                        className="text-gray-400 text-[14px] hover:text-[#5D5FEF] transition-all cursor-pointer border-b border-transparent hover:border-[#5D5FEF] pb-0.5 bg-transparent"
                    >
                        {t('api_settings.empty_desc')}
                    </button>
                </div>
            )}

            {/* Client List (Hidden for now as screens show empty state) */}
            {clients.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-4">{t('api_settings.field_labels.name')}</th>
                                <th className="px-6 py-4">{t('api_settings.field_labels.role')}</th>
                                <th className="px-6 py-4">API Token</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {clients.map(client => (
                                <tr key={client._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-700">{client.name}</td>
                                    <td className="px-6 py-4 text-gray-600">{client.role}</td>
                                    <td className="px-6 py-4">
                                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">{client.token}</code>
                                    </td>
                                    <td className="px-6 py-4 text-left">
                                        <button
                                            onClick={async () => {
                                                const confirmed = await confirmDelete({ title: t('sales.common.confirm_delete'), message: t('sales.common.confirm_delete'), confirmText: t('sales.common.confirm'), cancelText: t('sales.common.cancel') });
                                                if (confirmed) {
                                                    await apiClientService.delete(client._id);
                                                    fetchData();
                                                }
                                            }}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            {t('sales.common.delete')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                            <h3 className="text-lg font-bold text-gray-800">{t('api_settings.modal_title')}</h3>
                        </div>

                        <form onSubmit={handleCreateClient} className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-1 text-sm font-bold text-gray-700">
                                    {t('api_settings.field_labels.name')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border border-gray-200 rounded-md py-2.5 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-1 text-sm font-bold text-gray-700">
                                    {t('api_settings.field_labels.role')} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full bg-white border border-gray-200 rounded-md py-2.5 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none shadow-sm cursor-pointer"
                                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M8 9l4-4 4 4m0 6l-4 4-4-4\' /%3E%3C/svg%3E")', backgroundPosition: isRTL ? 'left 1rem center' : 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em' }}
                                >
                                    <option value="">{t('api_settings.field_labels.select')}</option>
                                    {roles.map(role => (
                                        <option key={role.id} value={role.id}>{role.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-1 text-sm font-bold text-gray-700">
                                    {t('api_settings.field_labels.branches')} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.branches[0] || ''}
                                    onChange={(e) => setFormData({ ...formData, branches: [e.target.value] })}
                                    className="w-full bg-white border border-gray-200 rounded-md py-2.5 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none shadow-sm cursor-pointer text-center"
                                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M8 9l4-4 4 4m0 6l-4 4-4-4\' /%3E%3C/svg%3E")', backgroundPosition: isRTL ? 'left 1rem center' : 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em' }}
                                >
                                    <option value="">{t('api_settings.field_labels.select')}</option>
                                    {branches.map(branch => (
                                        <option key={branch._id} value={branch._id}>{branch.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-[#10B981] text-white px-8 py-2 rounded-md font-bold hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50 order-1"
                                >
                                    {saving ? t('sales.common.loading') : t('api_settings.field_labels.save')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="bg-white border border-gray-200 text-gray-700 px-8 py-2 rounded-md font-bold hover:bg-gray-50 transition-colors order-2"
                                >
                                    {t('api_settings.field_labels.cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApiSettings;

