import React, { useState } from 'react';
import { Plus, Search, RefreshCw, X, ChevronLeft, Printer, FileText, ChevronDown, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function ChartOfAccounts() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        type: 'main',
        code: '',
        name: '',
        parentAccount: '',
        branch: 'main'
    });

    // Visible accounts from the screenshot
    const [expandedAccounts, setExpandedAccounts] = useState(new Set(['1', '11', '12', '2']));

    // Updated accounts hierarchy based on screenshots
    const [accountsData] = useState([
        {
            id: 1, code: '1', name: 'الأصول', type: 'main',
            children: [
                {
                    id: 11, code: '11', name: 'الأصول الثابتة', type: 'main',
                    children: [
                        { id: 111, code: '111', name: 'المباني', type: 'sub' },
                        { id: 112, code: '112', name: 'الأراضي', type: 'sub' },
                        { id: 113, code: '113', name: 'الأثاث', type: 'sub' },
                        { id: 114, code: '114', name: 'الأجهزة والمعدات', type: 'sub' },
                        { id: 115, code: '115', name: 'وسائل النقل', type: 'sub' },
                    ]
                },
                {
                    id: 12, code: '12', name: 'الأصول المتداولة', type: 'main',
                    children: [
                        {
                            id: 121, code: '121', name: 'الخزائن', type: 'main', children: [
                                { id: 1211, code: '1211', name: 'الخزنة الرئيسية', type: 'sub' },
                            ]
                        },
                        {
                            id: 122, code: '122', name: 'الحسابات البنكية', type: 'main', children: [
                                { id: 1221, code: '1221', name: 'الحساب البنكي الرئيسي', type: 'sub' },
                            ]
                        },
                        { id: 123, code: '123', name: 'خزائن نقاط البيع', type: 'sub' },
                        { id: 124, code: '124', name: 'عهد الموظفين', type: 'sub' },
                        {
                            id: 125, code: '125', name: 'المستودعات', type: 'main', children: [
                                { id: 1251, code: '1251', name: 'المستودع الرئيسي', type: 'sub' },
                            ]
                        },
                        {
                            id: 126, code: '126', name: 'المدينون', type: 'main', children: [
                                { id: 1261, code: '1261', name: 'العملاء', type: 'sub' },
                            ]
                        },
                    ]
                }
            ]
        },
        {
            id: 2, code: '2', name: 'الخصوم', type: 'main',
            children: [
                {
                    id: 21, code: '21', name: 'الخصوم المتداولة', type: 'main', children: [
                        {
                            id: 211, code: '211', name: 'الدائنون', type: 'main', children: [
                                { id: 2111, code: '2111', name: 'موردون آخرون', type: 'sub' },
                            ]
                        }
                    ]
                }
            ]
        },
        { id: 3, code: '3', name: 'رأس المال وحقوق الملكية', type: 'main' },
        { id: 4, code: '4', name: 'الإيرادات', type: 'main' },
        { id: 5, code: '5', name: 'المصروفات', type: 'main' },
    ]);

    const toggleExpand = (code) => {
        const next = new Set(expandedAccounts);
        if (next.has(code)) {
            next.delete(code);
        } else {
            next.add(code);
        }
        setExpandedAccounts(next);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTypeChange = (type) => {
        setFormData(prev => ({ ...prev, type }));
    };

    const handleOpenAddModal = () => {
        setEditingAccount(null);
        setFormData({
            type: 'main',
            code: '',
            name: '',
            parentAccount: '',
            branch: 'main'
        });
        setIsModalOpen(true);
    };

    const handleEdit = (account) => {
        setEditingAccount(account);
        setFormData({
            type: account.type || 'main',
            code: account.code,
            name: account.name,
            parentAccount: account.parentAccount || '',
            branch: account.branch || 'main'
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm(i18n.language === 'ar' ? 'هل أنت متأكد من حذف هذا الحساب؟' : 'Are you sure you want to delete this account?')) {
            // Logic to delete would go here if we were using a real state for accountsData
            console.log('Delete account', id);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsModalOpen(false);
    };

    const parentAccountOptions = [
        { code: '1', name: 'الأصول' },
        { code: '11', name: 'الأصول الثابتة' },
        { code: '111', name: 'المباني' },
        { code: '112', name: 'الأراضي' },
        { code: '113', name: 'الأثاث' },
        { code: '114', name: 'الأجهزة والمعدات' },
        { code: '115', name: 'وسائل النقل' },
        { code: '12', name: 'الأصول المتداولة' },
        { code: '121', name: 'الخزائن' },
        { code: '122', name: 'الحسابات البنكية' },
        { code: '123', name: 'خزائن نقاط البيع' },
        { code: '124', name: 'عهد الموظفين' },
        { code: '125', name: 'المستودعات' },
        { code: '126', name: 'المدينون' },
        { code: '1261', name: 'العملاء' },
        { code: '2', name: 'الخصوم' },
        { code: '21', name: 'الخصوم المتداولة' },
        { code: '211', name: 'الدائنون' },
        { code: '2111', name: 'الموردون' },
        { code: '212', name: 'مجمع الإهلاك' },
    ];

    const renderAccountRow = (account, depth = 0) => {
        const isExpanded = expandedAccounts.has(account.code);
        const hasChildren = account.children && account.children.length > 0;

        return (
            <React.Fragment key={account.id}>
                <div className={`flex items-center justify-between py-2 px-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors group ${depth > 0 ? '' : 'bg-white'}`}>
                    {/* Left Actions (Action Icons & Edit/Delete) */}
                    <div className="flex items-center gap-3">
                        <button onClick={() => handleDelete(account.id)} className="text-[#EF4444] hover:text-red-700 text-xs font-bold transition-colors">
                            {t('accounting.chart_of_accounts.delete')}
                        </button>
                        <button onClick={() => handleEdit(account)} className="text-[#3B82F6] hover:text-blue-700 text-xs font-bold transition-colors">
                            {t('accounting.chart_of_accounts.edit')}
                        </button>
                        <button className="text-[#10B981] hover:bg-green-50 p-1 rounded transition-colors" title="Download/Form">
                            <Printer size={14} />
                        </button>
                        <button className="text-[#8B5CF6] hover:bg-purple-50 p-1 rounded transition-colors" title="Reports">
                            <FileText size={14} />
                        </button>
                    </div>

                    {/* Right Info (Indented Code & Name) */}
                    <div className="flex items-center gap-2" style={{ paddingRight: `${depth * 24}px` }}>
                        <div className="flex items-center gap-2">
                            <span className={`${account.type === 'sub' ? 'text-gray-500' : 'text-gray-900 font-bold'} text-[13px]`}>
                                {account.name} #{account.code}
                            </span>
                            <div
                                onClick={() => hasChildren && toggleExpand(account.code)}
                                className={`transform transition-transform duration-200 cursor-pointer ${hasChildren ? 'text-blue-500' : 'text-transparent pointer-events-none'}`}
                            >
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronLeft size={14} />}
                            </div>
                        </div>
                    </div>
                </div>
                {hasChildren && isExpanded && (
                    <div className="animate-in slide-in-from-top-1 duration-200">
                        {account.children.map(child => renderAccountRow(child, depth + 1))}
                    </div>
                )}
            </React.Fragment>
        );
    };

    return (
        <div className="min-h-screen bg-white font-sans" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Top Toolbar */}
            <div className="bg-white border-b border-gray-100 flex items-center justify-between px-6 py-4">
                {/* Search and Filter side */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleOpenAddModal}
                        className="flex items-center gap-2 bg-[#4F46E5] text-white px-4 h-10 rounded-md hover:bg-indigo-700 transition-colors font-bold shadow-sm text-sm"
                    >
                        <Plus size={18} strokeWidth={3} />
                        <span>{t('topbar.add')}</span>
                    </button>

                    <button className="flex items-center gap-2 bg-[#F0F7FF] border border-[#BFDBFE] text-[#2563EB] px-4 h-10 rounded-md hover:bg-blue-100 transition-colors font-bold text-sm">
                        <Search size={16} strokeWidth={3} />
                        <span>{t('accounting.chart_of_accounts.search_account')}</span>
                    </button>
                </div>

                {/* Breadcrumbs and Actions side */}
                <div className="flex items-center gap-4">
                    <button className="text-gray-400 hover:text-gray-600 transition-colors" title="Refresh">
                        <RefreshCw size={18} />
                    </button>

                    <div className="flex items-center bg-white border border-gray-200 rounded-md overflow-hidden h-10 shadow-sm">
                        <button className="px-3 h-full text-gray-400 hover:text-gray-600 transition-colors bg-white">
                            <Home size={18} />
                        </button>
                        <div className="flex items-center text-[#4B5563] font-medium text-sm h-full relative">
                            <span className="h-full w-[1px] bg-gray-200 skew-x-[-20deg] mx-1"></span>
                            <div className="px-5 h-full flex items-center bg-gray-50/80 font-bold text-gray-700">
                                {t('accounting.chart_of_accounts.title')}
                                <ChevronDown size={14} className="mr-2 text-gray-400" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Account List Table */}
            <div className="m-6 border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="bg-gray-50/80 border-b border-gray-200 py-3 px-6 text-start">
                    <span className="text-xs font-black text-gray-800 uppercase tracking-wider">
                        {t('accounting.chart_of_accounts.name')}
                    </span>
                </div>

                {/* Tree Content */}
                <div className="bg-white">
                    {accountsData.map(account => renderAccountRow(account))}
                </div>
            </div>

            {/* Add Account Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-[620px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-[#1F2937]">{editingAccount ? t('accounting.chart_of_accounts.edit') : t('accounting.chart_of_accounts.add_account')}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors text-2xl font-light">×</button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 space-y-6">
                            {/* Type Section */}
                            <div className="flex items-center gap-8">
                                <label className="text-sm font-bold text-gray-700 w-16">{t('accounting.chart_of_accounts.type')}</label>
                                <div className="flex gap-10">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.type === 'main' ? 'border-[#3B82F6]' : 'border-gray-200'}`}>
                                            {formData.type === 'main' && <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />}
                                        </div>
                                        <input type="radio" className="hidden" name="type" checked={formData.type === 'main'} onChange={() => handleTypeChange('main')} />
                                        <span className="text-sm font-medium text-gray-700">{t('accounting.chart_of_accounts.main_account')}</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.type === 'sub' ? 'border-[#3B82F6]' : 'border-gray-200'}`}>
                                            {formData.type === 'sub' && <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />}
                                        </div>
                                        <input type="radio" className="hidden" name="type" checked={formData.type === 'sub'} onChange={() => handleTypeChange('sub')} />
                                        <span className="text-sm font-medium text-gray-700">{t('accounting.chart_of_accounts.sub_account')}</span>
                                    </label>
                                </div>
                            </div>

                            {/* Code Field */}
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

                            {/* Name Field */}
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

                            {/* Parent Account */}
                            <div className="flex flex-col gap-2 text-start">
                                <label className="text-sm font-bold text-gray-700">
                                    {t('accounting.chart_of_accounts.parent_account')} <span className="text-red-500 font-bold">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        name="parentAccount"
                                        value={formData.parentAccount}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none text-gray-700"
                                    >
                                        <option value="">{t('accounting.chart_of_accounts.search_account')}</option>
                                        {parentAccountOptions.map(opt => (
                                            <option key={opt.code} value={opt.code}>#{opt.code} {opt.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 ltr:right-3 rtl:left-3 flex flex-col justify-center pointer-events-none text-gray-400">
                                        <ChevronDown size={14} />
                                    </div>
                                </div>
                            </div>

                            {/* Branch */}
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
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-5 border-t border-gray-100 flex items-center gap-3 justify-end bg-white">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-8 py-2 bg-white border border-gray-300 text-gray-600 font-bold rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                {t('sales.common.cancel')}
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-8 py-2 bg-[#10B981] text-white font-bold rounded-md hover:bg-emerald-600 transition-colors shadow-sm"
                            >
                                {t('sales.common.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
