import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import companyService from '../../services/companyservice';
import { useAuth } from '../../context/authcontext';
import { Plus, Edit, Trash2, LogIn, Search, Building, Users, Mail, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import ConfirmDeleteModal from '../../components/confirmdeletemodal';
import toast from 'react-hot-toast';
import logError from '../../utils/logerror';

const CompanyList = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { loginAsCompany } = useAuth();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [deleteModal, setDeleteModal] = useState({ show: false, company: null });
    const [rejectModal, setRejectModal] = useState({ show: false, company: null, reason: '' });
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const response = await companyService.getAllCompanies();
            setCompanies(response.companies || []);
        } catch (error) {
            logError('Failed to fetch companies:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteModal.company) return;
        setDeleteLoading(true);
        try {
            await companyService.deleteCompany(deleteModal.company._id);
            setCompanies(companies.filter(c => c._id !== deleteModal.company._id));
            setDeleteModal({ show: false, company: null });
        } catch (error) {
            logError('Failed to toggle status:', error);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleLoginAsCompany = async (company) => {
        const toastId = toast.loading(`جاري الدخول إلى ${company.name}...`);
        try {
            const response = await companyService.impersonateCompany(company._id);
            if (!response?.token || !response?.company) {
                throw new Error('Invalid impersonation response');
            }
            loginAsCompany(response.company, response.token);
            toast.success(`تم الدخول إلى ${company.name} بنجاح`, { id: toastId });
            // Use full navigation to avoid ProtectedRoute race condition during role switch
            window.location.href = '/dashboard';
        } catch (error) {
            toast.error(error.response?.data?.message || 'فشل الدخول إلى الشركة', { id: toastId });
        }
    };

    const handleSendCredentials = async (company) => {
        try {
            await companyService.sendCredentials(company._id);
            alert(t('superAdmin.credentialsSent') || 'Credentials sent successfully');
        } catch (error) {
            logError('Error sending credentials:', error);
            alert(error.response?.data?.message || 'Failed to send credentials');
        }
    };

    const handleApprove = async (company) => {
        setActionLoading(true);
        try {
            const res = await companyService.approveCompany(company._id);
            setCompanies(companies.map(c => c._id === company._id ? { ...c, status: 'active' } : c));
            toast.success('تم قبول الشركة بنجاح');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to approve company');
        } finally {
            setActionLoading(false);
        }
    };

    const submitReject = async () => {
        if (!rejectModal.reason) {
            toast.error('يرجى إدخال سبب الرفض');
            return;
        }
        setActionLoading(true);
        try {
            await companyService.rejectCompany(rejectModal.company._id, rejectModal.reason);
            setCompanies(companies.map(c => c._id === rejectModal.company._id ? { ...c, status: 'rejected', rejectionReason: rejectModal.reason } : c));
            setRejectModal({ show: false, company: null, reason: '' });
            toast.success('تم رفض الشركة');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reject company');
        } finally {
            setActionLoading(false);
        }
    };

    const appBaseUrl = window.location.origin;

    const filteredCompanies = companies.filter(company => {
        const matchesSearch = company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            company.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'all' || company.status === activeTab || (!company.status && activeTab === 'active');
        return matchesSearch && matchesTab;
    });

    const tabs = [
        { id: 'all', label: 'الكل' },
        { id: 'pending', label: 'قيد المراجعة' },
        { id: 'active', label: 'مفعّل' },
        { id: 'rejected', label: 'مرفوض' }
    ];

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending': return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700">قيد المراجعة</span>;
            case 'active': return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">مفعّل</span>;
            case 'rejected': return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">مرفوض</span>;
            default: return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">مفعّل</span>;
        }
    };

    const isRTL = i18n.language === 'ar';

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{t('superAdmin.companies')}</h1>
                <button
                    onClick={() => navigate('/super-admin/companies/new')}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={18} className={isRTL ? 'ml-2' : 'mr-2'} />
                    {t('superAdmin.addCompany')}
                </button>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative">
                    <Search className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} size={20} />
                    <input
                        type="text"
                        placeholder={t('common.search')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full p-3 border border-gray-300 rounded-lg ${isRTL ? 'pr-10' : 'pl-10'}`}
                    />
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-[#4f46e5] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {tab.label}
                            {tab.id === 'pending' && companies.filter(c => c.status === 'pending').length > 0 && (
                                <span className={`inline-block w-5 h-5 text-center leading-5 text-xs rounded-full ${isRTL ? 'mr-2' : 'ml-2'} ${activeTab === tab.id ? 'bg-white text-[#4f46e5]' : 'bg-amber-500 text-white'}`}>
                                    {companies.filter(c => c.status === 'pending').length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Company List Table */}
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                {loading ? (
                    <div className="p-10 text-center text-gray-500">{t('common.loading')}</div>
                ) : filteredCompanies.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">
                        <Building size={48} className="mx-auto mb-4 text-gray-300" />
                        <p>{t('superAdmin.noCompanies')}</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className={`px-6 py-4 text-${isRTL ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase`}>{t('superAdmin.companyName')}</th>
                                <th className={`px-6 py-4 text-${isRTL ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase`}>{t('superAdmin.email')}</th>
                                <th className={`px-6 py-4 text-${isRTL ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase`}>الحالة</th>
                                <th className={`px-6 py-4 text-${isRTL ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase`}>{t('superAdmin.subscription')}</th>
                                <th className={`px-6 py-4 text-${isRTL ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase`}>Slug</th>
                                <th className={`px-6 py-4 text-${isRTL ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase`}>{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredCompanies.map((company) => (
                                <tr key={company._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {company.logo?.url ? (
                                                <img src={company.logo.url} alt={company.name} className="w-10 h-10 rounded-full object-cover mr-3" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                                    <Building size={20} className="text-blue-600" />
                                                </div>
                                            )}
                                            <span className="font-medium">{company.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{company.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(company.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs rounded-full ${company.subscriptionStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {company.subscriptionStatus || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {company.slug ? (
                                            <a
                                                href={`${appBaseUrl}/company/${company.slug}/login`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-indigo-600 hover:underline flex items-center gap-1"
                                            >
                                                {company.slug}
                                                <ExternalLink size={14} />
                                            </a>
                                        ) : '—'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {company.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(company)}
                                                        disabled={actionLoading}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                                                        title="تفعيل"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => setRejectModal({ show: true, company, reason: '' })}
                                                        disabled={actionLoading}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                                        title="رفض"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </>
                                            )}

                                            <button
                                                onClick={() => navigate(`/super-admin/companies/${company._id}/users`)}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                                title={t('superAdmin.manageUsers')}
                                            >
                                                <Users size={18} />
                                            </button>
                                            <button
                                                onClick={() => navigate(`/super-admin/companies/edit/${company._id}`)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                title={t('common.edit')}
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleSendCredentials(company)}
                                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                                                title={t('superAdmin.sendCredentials')}
                                            >
                                                <Mail size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleLoginAsCompany(company)}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                                title={t('superAdmin.loginAsCompany')}
                                            >
                                                <LogIn size={18} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteModal({ show: true, company })}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                title={t('common.delete')}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <ConfirmDeleteModal
                isOpen={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, company: null })}
                onConfirm={handleDelete}
                loading={deleteLoading}
                title={t('superAdmin.confirmDelete')}
                message={t('superAdmin.deleteCompanyWarning', { name: deleteModal.company?.name })}
            />

            {/* Reject Modal */}
            {rejectModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[1px]">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-800">رفض الشركة</h2>
                        </div>
                        <div className="p-6">
                            <p className="mb-4 text-sm text-gray-600">يرجى كتابة سبب الرفض لـ {rejectModal.company?.name}:</p>
                            <textarea
                                value={rejectModal.reason}
                                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                                className="w-full h-32 p-3 border border-gray-200 rounded-lg outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 resize-none text-sm"
                                placeholder="سبب الرفض..."
                            />
                        </div>
                        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                            <button
                                onClick={() => setRejectModal({ show: false, company: null, reason: '' })}
                                className="px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={submitReject}
                                disabled={actionLoading || !rejectModal.reason}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                تأكيد الرفض
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyList;
