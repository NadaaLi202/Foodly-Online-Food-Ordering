import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, RefreshCw, X, ChevronLeft, Printer, FileText, ChevronDown, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import chartOfAccountsService from '../../services/chartOfAccountsService';

/**
 * Build a tree from flat list of accounts (backend returns flat with parentAccount populated).
 */
function buildAccountsTree(flatList) {
    if (!flatList || flatList.length === 0) return [];
    const list = flatList.map((a) => ({
        ...a,
        id: a._id,
        children: [],
    }));
    const byId = {};
    list.forEach((a) => { byId[a._id] = a; });
    const roots = [];
    list.forEach((a) => {
        const parentId = a.parentAccount?._id ?? a.parentAccount ?? null;
        if (parentId && byId[parentId]) {
            byId[parentId].children.push(a);
        } else {
            roots.push(a);
        }
    });
    const sortByCode = (arr) => arr.sort((x, y) => (x.code || '').localeCompare(y.code || '', undefined, { numeric: true }));
    sortByCode(roots);
    roots.forEach((r) => sortByCode(r.children));
    const sortChildrenRecursive = (node) => {
        if (node.children && node.children.length) {
            sortByCode(node.children);
            node.children.forEach(sortChildrenRecursive);
        }
    };
    roots.forEach(sortChildrenRecursive);
    return roots;
}

export default function ChartOfAccounts() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedAccounts, setExpandedAccounts] = useState(new Set());
    const [formData, setFormData] = useState({
        type: 'main',
        code: '',
        name: '',
        parentAccount: '',
        status: 'active',
        description: '',
        branch: 'main',
    });

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const res = await chartOfAccountsService.getAllAccounts();
            const list = res.accounts || [];
            setAccounts(list);
            if (list.length > 0 && expandedAccounts.size === 0) {
                setExpandedAccounts(new Set(list.slice(0, 5).map((a) => a._id)));
            }
        } catch (err) {
            const msg = err.response?.data?.message || t('sales.common.error_message', 'An error occurred');
            if (err.response?.status !== 401 && err.response?.status !== 403) {
                toast.error(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const filteredFlat = useMemo(() => {
        if (!searchTerm.trim()) return accounts;
        const term = searchTerm.toLowerCase().trim();
        return accounts.filter(
            (a) =>
                (a.name || '').toLowerCase().includes(term) ||
                (a.code || '').toLowerCase().includes(term)
        );
    }, [accounts, searchTerm]);

    const accountsTree = useMemo(() => buildAccountsTree(filteredFlat), [filteredFlat]);

    const toggleExpand = (id) => {
        setExpandedAccounts((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleTypeChange = (type) => {
        setFormData((prev) => ({ ...prev, type }));
    };

    const handleOpenAddModal = (parentAccountId = null) => {
        setEditingAccount(null);
        setFormData({
            type: 'main',
            code: '',
            name: '',
            parentAccount: parentAccountId || '',
            status: 'active',
            description: '',
            branch: 'main',
        });
        setIsModalOpen(true);
    };

    const handleEdit = (account) => {
        setEditingAccount(account);
        setFormData({
            type: account.type || 'main',
            code: account.code || '',
            name: account.name || '',
            parentAccount: account.parentAccount?._id ?? account.parentAccount ?? '',
            status: account.status || 'active',
            description: account.description || '',
            branch: Array.isArray(account.branches) && account.branches.length > 0 ? 'all' : 'main',
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (account) => {
        const msg = i18n.language === 'ar' ? 'هل أنت متأكد من حذف هذا الحساب؟' : 'Are you sure you want to delete this account?';
        if (!window.confirm(msg)) return;
        try {
            await chartOfAccountsService.deleteAccount(account._id);
            toast.success(t('sales.common.success_message', 'Account deleted successfully'));
            fetchAccounts();
        } catch (err) {
            const message = err.response?.data?.message || t('sales.common.error_message', 'An error occurred');
            toast.error(message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.code?.trim() || !formData.name?.trim()) {
            toast.error(t('accounting.chart_of_accounts.code') + ' & ' + t('accounting.chart_of_accounts.name') + ' are required');
            return;
        }
        setSubmitLoading(true);
        try {
            const payload = {
                name: formData.name.trim(),
                code: formData.code.trim(),
                type: formData.type,
                parentAccount: formData.parentAccount?.trim() || null,
                status: formData.status || 'active',
                description: formData.description?.trim() || '',
                branches: formData.branch === 'all' ? [] : [],
            };
            if (editingAccount) {
                await chartOfAccountsService.updateAccount(editingAccount._id, payload);
                toast.success(t('sales.common.success_message', 'Account updated successfully'));
            } else {
                await chartOfAccountsService.createAccount(payload);
                toast.success(t('sales.common.success_message', 'Account created successfully'));
            }
            await fetchAccounts();
            setIsModalOpen(false);
        } catch (err) {
            const message = err.response?.data?.message || t('sales.common.error_message', 'An error occurred');
            toast.error(message);
        } finally {
            setSubmitLoading(false);
        }
    };

    const goToAccountingReports = () => {
        navigate('/dashboard/reports/accounting');
    };

    const parentAccountOptions = useMemo(() => {
        return accounts
            .filter((a) => !editingAccount || a._id !== editingAccount._id)
            .map((a) => ({
                id: a._id,
                code: a.code,
                name: a.name,
            }))
            .sort((x, y) => (x.code || '').localeCompare(y.code || '', undefined, { numeric: true }));
    }, [accounts, editingAccount]);

    const renderAccountRow = (account, depth = 0) => {
        const isExpanded = expandedAccounts.has(account._id);
        const hasChildren = account.children && account.children.length > 0;

        return (
            <React.Fragment key={account._id}>
                <div
                    className={`flex items-center justify-between gap-4 py-2 px-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors group ${depth > 0 ? '' : 'bg-white'}`}
                >
                    {/* Name and expand: first in DOM so in RTL it appears on the right; actions on the left */}
                    <div className="flex items-center gap-2 min-w-0 flex-1" style={{ [i18n.language === 'ar' ? 'paddingRight' : 'paddingLeft']: `${depth * 24}px` }}>
                        <div className="flex items-center gap-2 min-w-0">
                            <span
                                className={`truncate ${account.type === 'sub' ? 'text-gray-500' : 'text-gray-900 font-bold'} text-[13px]`}
                            >
                                {account.name} #{account.code}
                            </span>
                            <button
                                type="button"
                                onClick={() => hasChildren && toggleExpand(account._id)}
                                className={`shrink-0 transform transition-transform duration-200 cursor-pointer ${hasChildren ? 'text-blue-500' : 'text-transparent pointer-events-none'}`}
                            >
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronLeft size={14} />}
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => handleDelete(account)}
                            className="text-[#EF4444] hover:text-red-700 text-xs font-bold transition-colors"
                        >
                            {t('accounting.chart_of_accounts.delete')}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleEdit(account)}
                            className="text-[#3B82F6] hover:text-blue-700 text-xs font-bold transition-colors"
                        >
                            {t('accounting.chart_of_accounts.edit')}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleOpenAddModal(account._id)}
                            className="text-[#10B981] hover:bg-green-50 p-1 rounded transition-colors"
                            title={t('accounting.chart_of_accounts.add_account')}
                        >
                            <Printer size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={goToAccountingReports}
                            className="text-[#8B5CF6] hover:bg-purple-50 p-1 rounded transition-colors"
                            title={t('sidebar.accounting_reports')}
                        >
                            <FileText size={14} />
                        </button>
                    </div>
                </div>
                {hasChildren && isExpanded && (
                    <div className="animate-in slide-in-from-top-1 duration-200">
                        {account.children.map((child) => renderAccountRow(child, depth + 1))}
                    </div>
                )}
            </React.Fragment>
        );
    };

    return (
        <div className="min-h-screen bg-white font-sans" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="bg-white border-b border-gray-100 flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => handleOpenAddModal()}
                        className="flex items-center gap-2 bg-[#4F46E5] text-white px-4 h-10 rounded-md hover:bg-indigo-700 transition-colors font-bold shadow-sm text-sm"
                    >
                        <Plus size={18} strokeWidth={3} />
                        <span>{t('topbar.add')}</span>
                    </button>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t('accounting.chart_of_accounts.search_account')}
                            className="pl-10 pr-4 h-10 border border-[#BFDBFE] rounded-md bg-[#F0F7FF] text-[#2563EB] placeholder-[#2563EB]/70 font-medium text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                        <Search size={16} strokeWidth={3} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-[#2563EB]" />
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={fetchAccounts}
                        disabled={loading}
                        className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                        title={t('sales.common.refresh', 'Refresh')}
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <div className="flex items-center bg-white border border-gray-200 rounded-md overflow-hidden h-10 shadow-sm">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="px-3 h-full text-gray-400 hover:text-gray-600 transition-colors bg-white"
                        >
                            <Home size={18} />
                        </button>
                        <div className="flex items-center text-[#4B5563] font-medium text-sm h-full relative">
                            <span className="h-full w-[1px] bg-gray-200 skew-x-[-20deg] mx-1" />
                            <div className="px-5 h-full flex items-center bg-gray-50/80 font-bold text-gray-700">
                                {t('accounting.chart_of_accounts.title')}
                                <ChevronDown size={14} className="mr-2 text-gray-400" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="m-6 border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gray-50/80 border-b border-gray-200 py-3 px-6 text-start">
                    <span className="text-xs font-black text-gray-800 uppercase tracking-wider">
                        {t('accounting.chart_of_accounts.name')}
                    </span>
                </div>
                <div className="bg-white">
                    {loading ? (
                        <div className="py-12 text-center text-gray-500 font-medium">
                            {t('sales.common.loading', 'Loading...')}
                        </div>
                    ) : accountsTree.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            {searchTerm
                                ? t('sales.common.no_results', 'No results found')
                                : t('accounting.chart_of_accounts.no_accounts_yet', 'No accounts yet. Add an account to get started.')}
                        </div>
                    ) : (
                        accountsTree.map((account) => renderAccountRow(account))
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4 sm:p-6 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-[720px] sm:max-w-[800px] min-w-0 max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 my-auto">
                        <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center justify-between shrink-0">
                            <h2 className="text-xl font-bold text-[#1F2937]">
                                {editingAccount ? t('accounting.chart_of_accounts.edit') : t('accounting.chart_of_accounts.add_account')}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors text-2xl font-light"
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden flex">
                            <div className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 overflow-y-auto flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8">
                                    <label className="text-sm font-bold text-gray-700 sm:w-16">{t('accounting.chart_of_accounts.type')}</label>
                                    <div className="flex gap-10">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.type === 'main' ? 'border-[#3B82F6]' : 'border-gray-200'}`}
                                            >
                                                {formData.type === 'main' && <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />}
                                            </div>
                                            <input
                                                type="radio"
                                                className="hidden"
                                                name="type"
                                                checked={formData.type === 'main'}
                                                onChange={() => handleTypeChange('main')}
                                            />
                                            <span className="text-sm font-medium text-gray-700">{t('accounting.chart_of_accounts.main_account')}</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.type === 'sub' ? 'border-[#3B82F6]' : 'border-gray-200'}`}
                                            >
                                                {formData.type === 'sub' && <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />}
                                            </div>
                                            <input
                                                type="radio"
                                                className="hidden"
                                                name="type"
                                                checked={formData.type === 'sub'}
                                                onChange={() => handleTypeChange('sub')}
                                            />
                                            <span className="text-sm font-medium text-gray-700">{t('accounting.chart_of_accounts.sub_account')}</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-gray-700">
                                        {t('accounting.chart_of_accounts.code')} <span className="text-red-500 font-bold">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="code"
                                        value={formData.code}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-gray-700">
                                        {t('accounting.chart_of_accounts.name')} <span className="text-red-500 font-bold">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-2 text-start">
                                    <label className="text-sm font-bold text-gray-700">{t('accounting.chart_of_accounts.parent_account')}</label>
                                    <div className="relative">
                                        <select
                                            name="parentAccount"
                                            value={formData.parentAccount}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none text-gray-700"
                                        >
                                            <option value="">{t('accounting.chart_of_accounts.search_account')}</option>
                                            {parentAccountOptions.map((opt) => (
                                                <option key={opt.id} value={opt.id}>
                                                    #{opt.code} {opt.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 ltr:right-3 rtl:left-3 flex flex-col justify-center pointer-events-none text-gray-400">
                                            <ChevronDown size={14} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 text-start">
                                    <label className="text-sm font-bold text-gray-700">{t('accounting.chart_of_accounts.branches')}</label>
                                    <div className="relative">
                                        <select
                                            name="branch"
                                            value={formData.branch}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none text-gray-700"
                                        >
                                            <option value="main">{t('topbar.main_branch')}</option>
                                            <option value="all">{t('accounting.chart_of_accounts.all_branches')}</option>
                                        </select>
                                        <div className="absolute inset-y-0 ltr:right-3 rtl:left-3 flex flex-col justify-center pointer-events-none text-gray-400">
                                            <ChevronDown size={14} />
                                        </div>
                                    </div>
                                </div>
                                {editingAccount && (
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-bold text-gray-700">{t('accounting.chart_of_accounts.status', 'Status')}</label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-700"
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                )}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-gray-700">{t('accounting.chart_of_accounts.description', 'Description')}</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={2}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50/50 resize-none"
                                    />
                                </div>
                            </div>
                            <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 border-t border-gray-100 flex items-center gap-3 justify-end bg-white shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-8 py-2 bg-white border border-gray-300 text-gray-600 font-bold rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    {t('sales.common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitLoading}
                                    className="px-8 py-2 bg-[#10B981] text-white font-bold rounded-md hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {submitLoading ? t('sales.common.loading', 'Loading...') : t('sales.common.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
