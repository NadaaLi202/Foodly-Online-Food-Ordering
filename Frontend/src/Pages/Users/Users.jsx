import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus,
    Search,
    RefreshCw,
    X,
    Users as UsersIcon,
    Mail,
    Phone,
    Shield,
    Edit,
    Trash2,
    CheckCircle2,
    UserCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const Users = () => {
    const { t, i18n } = useTranslation();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [selectedUserId, setSelectedUserId] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        type: 'user',
        email: '',
        password: '',
        confirmPassword: '',
        role: '',
        branch: ''
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/users/all');
            const data = response.data;
            setUsers(data.users || data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpenModal = (mode, user = null) => {
        setModalMode(mode);
        if (mode === 'edit' && user) {
            setSelectedUserId(user._id || user.id);
            setFormData({
                name: user.name || '',
                type: user.type || 'user',
                email: user.email || '',
                password: '',
                confirmPassword: '',
                role: user.role || '',
                branch: user.branch || ''
            });
        } else {
            setSelectedUserId(null);
            setFormData({
                name: '',
                type: 'user',
                email: '',
                password: '',
                confirmPassword: '',
                role: '',
                branch: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();

        // Validate passwords match for new users or when password is being changed
        if (modalMode === 'add' || formData.password) {
            if (formData.password !== formData.confirmPassword) {
                alert(t('users_page.password_mismatch', 'Passwords do not match'));
                return;
            }
        }

        setLoading(true);
        try {
            const response = modalMode === 'add'
                ? await api.post('/users', dataToSend)
                : await api.put(`/users/${selectedUserId}`, dataToSend);

            if (response.status === 200 || response.status === 201) {
                setIsModalOpen(false);
                fetchUsers();
            }
        } catch (error) {
            console.error('Error saving user:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm(t('sales.common.confirm_delete', 'Are you sure you want to delete?'))) return;
        setLoading(true);
        try {
            const response = await api.delete(`/users/${id}`);
            if (response.status === 200) fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = useMemo(() => {
        return users.filter(u =>
            u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.role?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    return (
        <div className="min-h-screen bg-[#F8FAFC]" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200 px-6 py-5 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                            <UsersIcon size={24} />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">{t('sidebar.users', 'Users')}</h1>
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
                            type="button"
                            onClick={() => handleOpenModal('add')}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all font-semibold shadow-lg shadow-indigo-100 group"
                        >
                            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                            <span>{t('sales.common.add')}</span>
                        </button>

                        <button
                            type="button"
                            onClick={fetchUsers}
                            className={`p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all bg-white ${loading ? 'animate-spin' : ''}`}
                            title={t('sales.common.refresh')}
                        >
                            <RefreshCw size={20} className="text-gray-500" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                {loading && users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 gap-4">
                        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-gray-500 font-medium">{i18n.language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center shadow-sm">
                        <div className="inline-flex p-6 bg-indigo-50 text-indigo-200 rounded-full mb-6">
                            <UsersIcon size={64} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{t('users_page.no_users', 'No users found')}</h3>
                        <p className="text-gray-500 mb-8">{t('users_page.start_creating', 'Start by creating your first user')}</p>
                        <button onClick={() => handleOpenModal('add')} className="text-indigo-600 font-semibold hover:underline flex items-center gap-2 mx-auto justify-center">
                            <Plus size={18} /> {t('users_page.add_user', 'Add New User')}
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[#FBFCFE] border-b border-gray-200">
                                    <tr>
                                        <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('users_page.name', 'Name')}</th>
                                        <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('users_page.type', 'Type')}</th>
                                        <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('users_page.email', 'Email')}</th>
                                        <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('users_page.role', 'Role')}</th>
                                        <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('users_page.branch', 'Branch')}</th>
                                        <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-600">
                                    {filteredUsers.map((u) => (
                                        <tr key={u._id || u.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4 font-bold text-gray-900">
                                                <div className="flex items-center gap-2">
                                                    <UserCircle size={16} className="text-gray-400" />
                                                    {u.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${u.type === 'admin' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                                                    }`}>
                                                    <Shield size={12} />
                                                    {u.type === 'admin' ? t('users_page.admin', 'Admin') : t('users_page.user', 'User')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Mail size={14} className="text-gray-400" />
                                                    {u.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Shield size={14} className="text-gray-400" />
                                                    {u.role || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {u.branch || t('topbar.main_branch')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleOpenModal('edit', u)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title={t('sales.common.update')}>
                                                        <Edit size={18} />
                                                    </button>
                                                    <button onClick={() => handleDelete(u._id || u.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title={t('sales.common.delete')}>
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg">
                                    <UsersIcon size={24} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {modalMode === 'add' ? t('users_page.add_user', 'Add New User') : t('users_page.edit_user', 'Edit User')}
                                </h2>
                            </div>
                            <X onClick={() => setIsModalOpen(false)} className="text-gray-400 cursor-pointer hover:text-gray-900 transition-colors" />
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('users_page.name', 'Name')} *</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className={`w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                                        placeholder={t('users_page.name', 'Name')}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('users_page.type', 'Type')} *</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer flex-1 p-4 bg-gray-50 rounded-2xl border-2 border-transparent hover:border-indigo-200 transition-all">
                                            <input
                                                type="radio"
                                                name="type"
                                                value="user"
                                                checked={formData.type === 'user'}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                className="w-4 h-4 text-indigo-600"
                                            />
                                            <Shield size={16} className="text-blue-600" />
                                            <span className="font-semibold text-gray-700">{t('users_page.user', 'User')}</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer flex-1 p-4 bg-gray-50 rounded-2xl border-2 border-transparent hover:border-indigo-200 transition-all">
                                            <input
                                                type="radio"
                                                name="type"
                                                value="admin"
                                                checked={formData.type === 'admin'}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                className="w-4 h-4 text-indigo-600"
                                            />
                                            <Shield size={16} className="text-purple-600" />
                                            <span className="font-semibold text-gray-700">{t('users_page.admin', 'Admin')}</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('users_page.email', 'Email')} *</label>
                                    <input
                                        required
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className={`w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                                        placeholder="user@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        {t('users_page.password', 'Password')} {modalMode === 'add' ? '*' : `(${t('users_page.leave_empty', 'leave empty to keep current')})`}
                                    </label>
                                    <input
                                        required={modalMode === 'add'}
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className={`w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        {t('users_page.confirm_password', 'Confirm Password')} {modalMode === 'add' ? '*' : `(${t('users_page.leave_empty', 'leave empty to keep current')})`}
                                    </label>
                                    <input
                                        required={modalMode === 'add'}
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className={`w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('users_page.role', 'Role')}</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className={`w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                                    >
                                        <option value="">{t('users_page.select_role', 'Select Role')}</option>
                                        <option value="admin">{t('users_page.admin', 'Admin')}</option>
                                        <option value="manager">{t('users_page.manager', 'Manager')}</option>
                                        <option value="accountant">{t('users_page.accountant', 'Accountant')}</option>
                                        <option value="sales">{t('users_page.sales', 'Sales')}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('users_page.branch', 'Branch')}</label>
                                    <select
                                        value={formData.branch}
                                        onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                        className={`w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                                    >
                                        <option value="">{t('users_page.select_branch', 'Select Branch')}</option>
                                        <option value="main">{t('topbar.main_branch')}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-4 border-2 border-gray-100 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-colors">{t('sales.common.cancel')}</button>
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

export default Users;