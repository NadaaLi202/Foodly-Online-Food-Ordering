import React, { useState, useEffect } from 'react';
import {
    Plus,
    X,
    Shield,
    ChevronRight,
    Home,
    Search,
    RefreshCw,
    Edit,
    Trash2,
    Check
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Roles = () => {
    const { t, i18n } = useTranslation();
    const [roles, setRoles] = useState([
        { id: 1, name: 'المدير' } // Placeholder data to match screenshot
    ]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedRole, setSelectedRole] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        permissions: {}
    });

    const modules = [
        { key: 'sales_invoices', actions: ['add', 'view', 'edit', 'delete'] },
        { key: 'customers', actions: ['add', 'view', 'edit', 'delete'] },
        { key: 'customer_payments', actions: ['add', 'view', 'edit', 'delete'] },
        { key: 'purchase_invoices', actions: ['add', 'view', 'edit', 'delete'] },
        { key: 'suppliers', actions: ['add', 'view', 'edit', 'delete'] },
        { key: 'supplier_payments', actions: ['add', 'view', 'edit', 'delete'] },
        { key: 'products', actions: ['add', 'view', 'edit', 'delete'] },
        { key: 'inventory_operations', actions: ['add', 'view', 'edit', 'delete'] },
        { key: 'finance_operations', actions: ['add', 'view', 'edit', 'delete'] },
        { key: 'ledger_accounts', actions: ['add', 'view', 'edit', 'delete'] },
        { key: 'journal_entries', actions: ['add', 'view', 'edit', 'delete'] },
        { key: 'settle_with_balance', actions: ['add', 'view', 'edit', 'delete'] },
        { key: 'settle_with_accounts', actions: ['add', 'view', 'edit', 'delete'] },
        { key: 'sales_report', actions: ['view'] },
        { key: 'customer_payments_report', actions: ['view'] },
        { key: 'product_profit_report', actions: ['view'] },
        { key: 'purchase_report', actions: ['view'] },
        { key: 'supplier_payments_report', actions: ['view'] },
        { key: 'balance_sheet', actions: ['view'] },
        { key: 'income_statement', actions: ['view'] }
    ];

    const fetchRoles = async () => {
        // Placeholder for API call
        // setLoading(true);
        // ...
    };

    const handleOpenModal = (mode, role = null) => {
        setModalMode(mode);
        if (mode === 'edit' && role) {
            setSelectedRole(role);
            setFormData({
                name: role.name,
                permissions: role.permissions || {}
            });
        } else {
            setSelectedRole(null);
            setFormData({
                name: '',
                permissions: {}
            });
        }
        setIsModalOpen(true);
    };

    const handlePermissionChange = (moduleKey, action, checked) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [moduleKey]: {
                    ...(prev.permissions[moduleKey] || {}),
                    [action]: checked
                }
            }
        }));
    };

    const handleScopeChange = (moduleKey, action, scope) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [moduleKey]: {
                    ...(prev.permissions[moduleKey] || {}),
                    [`${action}_scope`]: scope
                }
            }
        }));
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header / Breadcrumbs */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <nav className="flex items-center gap-2 text-sm text-gray-500 overflow-x-auto whitespace-nowrap py-1">
                        <div className="flex items-center hover:text-indigo-600 cursor-pointer">
                            <Home size={16} />
                        </div>
                        <ChevronRight size={14} className={i18n.language === 'ar' ? 'rotate-180' : ''} />
                        <span className="hover:text-indigo-600 cursor-pointer">{t('users_page.title')}</span>
                        <ChevronRight size={14} className={i18n.language === 'ar' ? 'rotate-180' : ''} />
                        <span className="font-bold text-gray-900">{t('roles_page.title')}</span>
                    </nav>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => handleOpenModal('add')}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 transition-all font-semibold shadow-md group"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                            <span>{t('roles_page.add_role')}</span>
                        </button>
                        <button
                            type="button"
                            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all bg-white"
                        >
                            <RefreshCw size={18} className="text-gray-500" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[#FBFCFE] border-b border-gray-200">
                                <tr>
                                    <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                        {t('roles_page.role_name')}
                                    </th>
                                    <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'left' : 'right'}`}>
                                        {/* Actions Header */}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-600">
                                {roles.length === 0 ? (
                                    <tr>
                                        <td colSpan="2" className="px-6 py-12 text-center text-gray-500">
                                            {t('roles_page.no_roles')}
                                        </td>
                                    </tr>
                                ) : (
                                    roles.map((role) => (
                                        <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-gray-900">
                                                {role.name}
                                            </td>
                                            <td className="px-6 py-4 text-end whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenModal('edit', role)}
                                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Permission Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
                        {/* Modal Header */}
                        <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200">
                                    <Shield size={22} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {modalMode === 'add' ? t('roles_page.add_role') : t('roles_page.edit_role')}
                                </h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="overflow-y-auto p-8 custom-scrollbar">
                            <div className="mb-8 max-w-md">
                                <label className="block text-sm font-bold text-gray-700 mb-2">{t('roles_page.role_name')} *</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={`w-full p-3.5 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all font-medium text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                                    placeholder={t('roles_page.role_name')}
                                />
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                                    <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                                    {t('roles_page.permissions')}
                                </h3>

                                <div className="overflow-hidden border border-gray-100 rounded-2xl">
                                    <table className="w-full text-sm text-center">
                                        <thead className="bg-gray-50/80 border-b border-gray-100 font-bold text-gray-700">
                                            <tr>
                                                <th className={`px-4 py-4 text-start ${i18n.language === 'ar' ? 'pr-8' : 'pl-8'}`}>{t('roles_page.permissions')}</th>
                                                <th className="px-4 py-4">{t('roles_page.add')}</th>
                                                <th className="px-4 py-4">{t('roles_page.view')}</th>
                                                <th className="px-4 py-4">{t('roles_page.edit')}</th>
                                                <th className="px-4 py-4">{t('roles_page.delete')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {modules.map((m) => (
                                                <tr key={m.key} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className={`px-4 py-4 text-start font-semibold text-gray-900 ${i18n.language === 'ar' ? 'pr-8' : 'pl-8'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="checkbox"
                                                                className="w-4 h-4 rounded-md border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                            />
                                                            {t(`roles_page.modules.${m.key}`)}
                                                        </div>
                                                    </td>
                                                    {['add', 'view', 'edit', 'delete'].map((action) => (
                                                        <td key={action} className="px-4 py-4">
                                                            {m.actions.includes(action) ? (
                                                                <div className="flex flex-col items-center gap-2">
                                                                    <label className="relative inline-flex items-center cursor-pointer group">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="sr-only peer"
                                                                            checked={formData.permissions[m.key]?.[action] || false}
                                                                            onChange={(e) => handlePermissionChange(m.key, action, e.target.checked)}
                                                                        />
                                                                        <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                                                                        <span className="ms-2 text-xs font-bold text-gray-400 group-hover:text-gray-600">{t(`roles_page.${action}`)}</span>
                                                                    </label>

                                                                    {(action === 'view' || action === 'edit' || action === 'delete') && (
                                                                        <select
                                                                            disabled={!formData.permissions[m.key]?.[action]}
                                                                            onChange={(e) => handleScopeChange(m.key, action, e.target.value)}
                                                                            value={formData.permissions[m.key]?.[`${action}_scope`] || 'all'}
                                                                            className="text-[10px] p-1 border border-gray-200 rounded-md bg-transparent disabled:opacity-30 outline-none transition-opacity focus:border-indigo-500"
                                                                        >
                                                                            <option value="all">{t('roles_page.all')}</option>
                                                                            <option value="own">{t('roles_page.own')}</option>
                                                                            <option value="branch">{t('roles_page.branch')}</option>
                                                                        </select>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-200">-</span>
                                                            )}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex gap-4 flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 p-3.5 border-2 border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-all active:scale-95"
                            >
                                {t('sales.common.cancel')}
                            </button>
                            <button
                                className="flex-1 p-3.5 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Check size={20} />
                                {t('sales.common.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Roles;
