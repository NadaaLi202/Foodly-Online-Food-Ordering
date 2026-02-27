import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import companyService from '../../services/companyService';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Trash2, LogIn, Search, Building, Users, Mail, ExternalLink } from 'lucide-react';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';

const CompanyList = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { loginAsCompany } = useAuth();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteModal, setDeleteModal] = useState({ show: false, company: null });
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const response = await companyService.getAllCompanies();
            setCompanies(response.companies || []);
        } catch (error) {
            console.error('Error fetching companies:', error);
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
            console.error('Error deleting company:', error);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleLoginAsCompany = async (company) => {
        try {
            const response = await companyService.loginAsCompany(company._id);
            loginAsCompany(response.company, response.token);
            navigate('/dashboard');
            window.location.reload();
        } catch (error) {
            console.error('Error logging in as company:', error);
            alert(error.response?.data?.message || 'Failed to login as company');
        }
    };

    const handleSendCredentials = async (company) => {
        try {
            await companyService.sendCredentials(company._id);
            alert(t('superAdmin.credentialsSent') || 'Credentials sent successfully');
        } catch (error) {
            console.error('Error sending credentials:', error);
            alert(error.response?.data?.message || 'Failed to send credentials');
        }
    };

    const appBaseUrl = window.location.origin;

    const filteredCompanies = companies.filter(company =>
        company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
        </div>
    );
};

export default CompanyList;
