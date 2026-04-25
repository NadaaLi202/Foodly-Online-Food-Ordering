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
    UserCircle,
    Eye,
    EyeOff
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { confirmDelete } from '../../utils/confirmDelete';
import userService from '../../services/userService';
import rolesService from '../../services/rolesService';
import branchService from '../../services/branchService';
import Forbidden from '../../components/Forbidden';
import logError from '../../utils/logError';
import { useAuth } from '../../context/AuthContext';

const Users = () => {
    const { t, i18n } = useTranslation();
    const { user, companyId: authCompanyId } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [errors, setErrors] = useState([]);
    const [rolesError, setRolesError] = useState(false);
    const [forbidden, setForbidden] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [branches, setBranches] = useState([]);
    const [roles, setRoles] = useState([]);
    const currentCompanyId = user?.role === 'superAdmin'
        ? (user?.companyId ? String(user.companyId) : '')
        : (authCompanyId ? String(authCompanyId) : '');

    const [formData, setFormData] = useState({
        name: '',
        type: 'user',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'employee',
        roleId: '',
        branch: ''
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await userService.getAllUsers(currentCompanyId || null);
            setUsers(data.users || data || []);
        } catch (error) {
            if (error.response?.status === 403) {
                setForbidden(true);
            } else {
                logError('Error fetching users:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [rolesData, branchesData] = await Promise.all([
                    rolesService.getAllRoles(currentCompanyId || null),
                    branchService.getAllBranches()
                ]);
                setRoles(rolesData.roles || rolesData || []);
                setBranches(branchesData.branches || branchesData || []);
                setRolesError(false);
            } catch (err) {
                logError('Error fetching initial data:', err);
                setRolesError(true);
            }
        };
        loadInitialData();
    }, []);

    const handleOpenModal = (mode, user = null) => {
        setModalMode(mode);
        if (mode === 'edit' && user) {
            setSelectedUserId(user._id || user.id);
            setFormData({
                name: user.name || '',
                type: user.type || 'user',
                email: user.email || '',
                phone: user.phone || '',
                password: '',
                confirmPassword: '',
                role: user.role || 'employee',
                roleId: user.roleId ? String(user.roleId) : '',
                branch: user.branch || ''
            });
        } else {
            setSelectedUserId(null);
            setFormData({
                name: '',
                type: 'user',
                email: '',
                phone: '',
                password: '',
                confirmPassword: '',
                role: 'employee',
                roleId: '',
                branch: ''
            });
        }
        setShowPassword(false);
        setShowConfirmPassword(false);
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();

        // Form Validation
        // Form Validation
        const newErrors = [];
        if (!formData.name.trim()) newErrors.push(t('users_page.validation.name_required', 'Name is required'));

        if (formData.type === 'user') {
            if (!formData.email.trim()) newErrors.push(t('users_page.validation.email_required', 'Email is required'));
            if (!formData.roleId || formData.roleId === 'manager') {
                newErrors.push(t('users_page.validation.role_required', 'الرجاء اختيار الدور الوظيفي'));
            }
            if (!formData.branch) newErrors.push(t('users_page.validation.branch_required', 'Branch is required'));
        }

        if (formData.type === 'user') {
            if (modalMode === 'add') {
                if (!formData.password) newErrors.push(t('users_page.validation.password_required', 'Password is required'));
                if (formData.password !== formData.confirmPassword) {
                    newErrors.push(t('users_page.password_mismatch', 'Passwords do not match'));
                }
            } else if (formData.password) {
                if (formData.password !== formData.confirmPassword) {
                    newErrors.push(t('users_page.password_mismatch', 'Passwords do not match'));
                }
            }
        }

        if (newErrors.length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        try {
            let dataToSend;
            if (formData.type === 'employee') {
                dataToSend = {
                    name: formData.name,
                    type: 'employee'
                };
            } else {
                dataToSend = {
                    name: formData.name,
                    type: formData.type,
                    role: formData.role || 'employee',
                    email: formData.email,
                    phone: formData.phone,
                    branch: formData.branch || undefined
                };

                if (formData.roleId) dataToSend.roleId = formData.roleId;
                if (currentCompanyId && user?.role === 'superAdmin') {
                    dataToSend.companyId = currentCompanyId;
                }

                if (modalMode === 'add') {
                    dataToSend.password = formData.password;
                    dataToSend.confirmPassword = formData.confirmPassword;
                } else if (formData.password) {
                    dataToSend.password = formData.password;
                    dataToSend.confirmPassword = formData.confirmPassword;
                }
            }

            const response = modalMode === 'add'
                ? await api.post('/users', dataToSend)
                : await api.put(`/users/${selectedUserId}`, dataToSend);

            if (response.status === 200 || response.status === 201) {
                toast.success(modalMode === 'add' ? t('sales.common.success_message') : t('sales.common.success_message'));
                setIsModalOpen(false);
                fetchUsers();
            }
        } catch (error) {
            logError('Error saving user:', error);
            const msg = error.response?.data?.message || t('sales.common.error_message');
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        // We'll use confirmation later if needed, for now keep logic or Use confirm modal if exists
        const confirmed = await confirmDelete({ title: t('sales.common.confirm_delete', 'Confirm Delete'), message: t('sales.common.confirm_delete', 'Are you sure?'), confirmText: t('sales.common.confirm', 'Confirm'), cancelText: t('sales.common.cancel') });
        if (!confirmed) return;
        setLoading(true);
        try {
            await api.delete(`/users/${id}`);
            toast.success(t('sales.common.success_message'));
            fetchUsers();
        } catch (error) {
            logError('Error deleting user:', error);
            toast.error(t('sales.common.error_message'));
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

    if (forbidden) {
        return <Forbidden />;
    }

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
                                        <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('users_page.role', 'Role')}</th>
                                        <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('users_page.branch', 'Branch')}</th>
                                        <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('sales.common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-600">
                                    {filteredUsers.map((u) => (
                                        <tr key={u._id || u.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-2 font-bold text-gray-900">
                                                        <UserCircle size={16} className="text-gray-400" />
                                                        {u.name}
                                                    </div>
                                                    {u.email && (
                                                        <span className="text-[12px] text-gray-500 font-normal mr-6">
                                                            {u.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${u.type === 'user' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                                                    }`}>
                                                    <Shield size={12} />
                                                    {u.type === 'employee' ? t('users_page.employee', 'Employee') : t('users_page.user', 'User')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Shield size={14} className="text-gray-400" />
                                                    {roles.find(r => String(r._id) === String(u.roleId))?.name || u.role || '-'}
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
                                <h2 className="text-xl font-bold text-gray-900">
                                    {modalMode === 'add' ? t('users_page.add_user') : t('users_page.edit_user')}
                                </h2>
                            </div>
                            <X onClick={() => { setIsModalOpen(false); setErrors([]); }} className="text-gray-400 cursor-pointer hover:text-gray-900 transition-colors" />
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
                            {errors.length > 0 && (
                                <div className="p-4 bg-red-50 border-r-4 border-red-500 rounded-md mb-4">
                                    <ul className="list-disc list-inside text-red-600 text-sm font-bold space-y-1">
                                        {errors.map((err, idx) => <li key={idx} className="text-start">{err}</li>)}
                                    </ul>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 text-start">
                                        {t('users_page.name')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className={`w-full h-11 px-4 border border-gray-200 rounded-lg outline-none focus:border-indigo-500 transition-all text-start bg-white`}
                                        placeholder=""
                                    />
                                </div>

                                <div className="flex items-center gap-6">
                                    <label className="text-sm font-bold text-gray-700">{t('users_page.type')}</label>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="type"
                                                value="user"
                                                checked={formData.type === 'user'}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm font-semibold text-gray-700">{t('users_page.user')}</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="type"
                                                value="employee"
                                                checked={formData.type === 'employee'}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (modalMode === 'add') {
                                                        setFormData({
                                                            ...formData,
                                                            type: val,
                                                            email: '',
                                                            phone: '',
                                                            password: '',
                                                            confirmPassword: '',
                                                            roleId: '',
                                                            branch: ''
                                                        });
                                                    } else {
                                                        setFormData({ ...formData, type: val });
                                                    }
                                                }}
                                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm font-semibold text-gray-700">{t('users_page.employee', 'Employee')}</span>
                                        </label>
                                    </div>
                                </div>

                                {formData.type === 'user' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 text-start">
                                                {t('users_page.email')} <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                required
                                                name="email"
                                                id="email"
                                                autoComplete="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full h-11 px-4 border border-gray-200 rounded-lg outline-none focus:border-indigo-500 transition-all text-start bg-white"
                                                placeholder="example@mail.com"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 text-start">{t('users_page.phone_number')}</label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                id="phone"
                                                autoComplete="tel"
                                                value={formData.phone || ''}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full h-11 px-4 border border-gray-200 rounded-lg outline-none focus:border-indigo-500 transition-all text-start bg-white"
                                                placeholder="05XXXXXXXX"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 text-start">
                                                {t('users_page.password')} {modalMode === 'add' && <span className="text-red-500">*</span>}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    required={modalMode === 'add'}
                                                    name="password"
                                                    id="password"
                                                    autoComplete="new-password"
                                                    type={showPassword ? "text" : "password"}
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    className={`w-full h-11 ${i18n.language === 'ar' ? 'pl-10 pr-4' : 'pr-10 pl-4'} border border-gray-200 rounded-lg outline-none focus:border-indigo-500 transition-all text-start bg-white font-mono`}
                                                    placeholder="••••••••"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className={`absolute top-1/2 -translate-y-1/2 ${i18n.language === 'ar' ? 'left-3' : 'right-3'} text-gray-400 hover:text-gray-600`}
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 text-start">
                                                {t('users_page.confirm_password')} {modalMode === 'add' && <span className="text-red-500">*</span>}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    required={modalMode === 'add'}
                                                    name="confirmPassword"
                                                    id="confirmPassword"
                                                    autoComplete="new-password"
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    value={formData.confirmPassword}
                                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                    className={`w-full h-11 ${i18n.language === 'ar' ? 'pl-10 pr-4' : 'pr-10 pl-4'} border border-gray-200 rounded-lg outline-none focus:border-indigo-500 transition-all text-start bg-white font-mono`}
                                                    placeholder="••••••••"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className={`absolute top-1/2 -translate-y-1/2 ${i18n.language === 'ar' ? 'left-3' : 'right-3'} text-gray-400 hover:text-gray-600`}
                                                >
                                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 text-start">
                                                {t('users_page.role')} <span className="text-red-500">*</span>
                                            </label>
                                            {rolesError ? (
                                                <p className="text-sm text-red-500 mt-1">تعذر تحميل الأدوار، يرجى إعادة تحميل الصفحة</p>
                                            ) : (
                                                <select
                                                    required
                                                    value={formData.roleId}
                                                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                                                    className="w-full h-11 px-4 border border-gray-200 rounded-lg outline-none focus:border-indigo-500 transition-all text-start bg-white appearance-none"
                                                >
                                                    <option value="">{t('users_page.select_role')}</option>
                                                    {roles.length === 0 ? (
                                                        <option disabled value="">لا توجد أدوار متاحة، يرجى إضافة أدوار أولاً</option>
                                                    ) : (
                                                        roles.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)
                                                    )}
                                                </select>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 text-start">
                                                {t('users_page.branch')} <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                required
                                                value={formData.branch}
                                                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                                className="w-full h-11 px-4 border border-gray-200 rounded-lg outline-none focus:border-indigo-500 transition-all text-start bg-white appearance-none"
                                            >
                                                <option value="">{t('users_page.select_branch')}</option>
                                                <option value="main">{t('topbar.main_branch')}</option>
                                                {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                                            </select>
                                        </div>
                                    </>
                                )}


                            </div>

                            <div className="flex gap-3 pt-4 justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-2.5 bg-[#10B981] text-white rounded-lg font-bold hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-sm"
                                >
                                    {loading ? '...' : t('sales.common.save')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); setErrors([]); }}
                                    className="px-8 py-2.5 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50 transition-colors bg-white shadow-sm"
                                >
                                    {t('sales.common.cancel')}
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
