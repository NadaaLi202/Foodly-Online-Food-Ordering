import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Plus,
    Search,
    RefreshCw,
    X,
    Users as UsersIcon,
    Mail,
    Shield,
    Edit,
    Trash2,
    UserCircle,
    ArrowLeft
} from 'lucide-react';
import userService from '../../services/userservice';
import companyService from '../../services/companyservice';
import { confirmDelete } from '../../utils/confirmdelete';
import logError from '../../utils/logError';

const UserManagement = () => {
    const { companyId } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [users, setUsers] = useState([]);
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'admin', // Default to admin for company users created by superAdmin
    });

    const isRTL = i18n.language === 'ar';

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersData, companyData] = await Promise.all([
                userService.getAllUsers(companyId),
                companyService.getCompany(companyId)
            ]);
            setUsers(usersData.users || []);
            setCompany(companyData.company);
        } catch (error) {
            logError('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [companyId]);

    const handleOpenModal = (mode, user = null) => {
        setModalMode(mode);
        if (mode === 'edit' && user) {
            setSelectedUserId(user._id);
            setFormData({
                name: user.name || '',
                email: user.email || '',
                password: '',
                confirmPassword: '',
                role: user.role || 'admin',
            });
        } else {
            setSelectedUserId(null);
            setFormData({
                name: '',
                email: '',
                password: '',
                confirmPassword: '',
                role: 'admin',
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (modalMode === 'add' || formData.password) {
            if (formData.password !== formData.confirmPassword) {
                alert(t('users_page.password_mismatch', 'Passwords do not match'));
                return;
            }
        }

        setLoading(true);
        try {
            const data = { ...formData };
            if (modalMode === 'edit' && !formData.password) {
                delete data.password;
                delete data.confirmPassword;
            }

            // Include companyId when creating/updating users from company users page (superAdmin context)
            if (companyId) {
                data.companyId = companyId;
            }

            if (modalMode === 'add') {
                await userService.createUser(data);
            } else {
                await userService.updateUser(selectedUserId, data);
            }

            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            logError('Error saving user:', error);
            alert(error.response?.data?.message || 'Error saving user');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await confirmDelete({ title: t('sales.common.confirm_delete', 'Confirm Delete'), message: t('common.confirmDelete'), confirmText: t('sales.common.confirm', 'Confirm'), cancelText: t('sales.common.cancel') });
        if (!confirmed) return;
        setLoading(true);
        try {
            await userService.deleteUser(id);
            fetchData();
        } catch (error) {
            logError('Error deleting user:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = useMemo(() => {
        return users.filter(u =>
            u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    return (
        <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/super-admin/companies')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className={isRTL ? 'rotate-180' : ''} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">
                        {t('superAdmin.manageUsers')} - {company?.name || t('common.loading')}
                    </h1>
                    <p className="text-gray-500">{company?.email}</p>
                </div>
            </div>

            {/* Actions & Search */}
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} size={20} />
                    <input
                        type="text"
                        placeholder={t('common.search')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full p-3 border border-gray-300 rounded-lg ${isRTL ? 'pr-10' : 'pl-10'}`}
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleOpenModal('add')}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={18} className={isRTL ? 'ml-2' : 'mr-2'} />
                        {t('superAdmin.addUser')}
                    </button>
                    <button
                        onClick={fetchData}
                        className={`p-2 border border-gray-300 rounded-lg hover:bg-gray-50 ${loading ? 'animate-spin' : ''}`}
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* User List Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className={`px-6 py-4 text-xs font-medium text-gray-500 uppercase text-${isRTL ? 'right' : 'left'}`}>{t('users_page.name')}</th>
                                <th className={`px-6 py-4 text-xs font-medium text-gray-500 uppercase text-${isRTL ? 'right' : 'left'}`}>{t('users_page.email')}</th>
                                <th className={`px-6 py-4 text-xs font-medium text-gray-500 uppercase text-${isRTL ? 'right' : 'left'}`}>{t('users_page.role')}</th>
                                <th className={`px-6 py-4 text-xs font-medium text-gray-500 uppercase text-${isRTL ? 'right' : 'left'}`}>{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading && users.length === 0 ? (
                                <tr><td colSpan="4" className="text-center p-10">{t('common.loading')}</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan="4" className="text-center p-10">{t('users_page.no_users')}</td></tr>
                            ) : filteredUsers.map((user) => (
                                <tr key={user._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <UserCircle size={20} className="text-gray-400" />
                                            <span className="font-medium">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 capitalize`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleOpenModal('edit', user)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user._id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                            >
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h2 className="text-xl font-bold">
                                {modalMode === 'add' ? t('superAdmin.addUser') : t('superAdmin.editUser')}
                            </h2>
                            <X onClick={() => setIsModalOpen(false)} className="text-gray-400 cursor-pointer hover:text-gray-900" />
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('users_page.name')} *</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('users_page.email')} *</label>
                                <input
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('users_page.password')} {modalMode === 'add' ? '*' : `(${t('users_page.leave_empty')})`}
                                </label>
                                <input
                                    required={modalMode === 'add'}
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('users_page.confirm_password')} {modalMode === 'add' ? '*' : `(${t('users_page.leave_empty')})`}
                                </label>
                                <input
                                    required={modalMode === 'add'}
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('users_page.role')}</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="admin">{t('users_page.admin')}</option>
                                    <option value="manager">{t('users_page.manager')}</option>
                                    <option value="accountant">{t('users_page.accountant')}</option>
                                    <option value="sales">{t('users_page.sales')}</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 p-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 p-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                                >
                                    {loading ? t('common.loading') : t('common.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;

