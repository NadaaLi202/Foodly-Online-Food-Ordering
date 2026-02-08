import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus,
    Search,
    RefreshCw,
    X,
    Calendar,
    Warehouse,
    Hash,
    Eye,
    Edit,
    Trash2,
    Filter,
    MoreVertical,
    CheckCircle2,
    Clock,
    XCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const Permissions = () => {
    const { t, i18n } = useTranslation();
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [filterData, setFilterData] = useState({
        number: '',
        warehouse: '',
        startDate: '',
        endDate: ''
    });

    const [addFormData, setAddFormData] = useState({
        number: '',
        warehouse: '',
        startDate: '',
        endDate: ''
    });

    const fetchPermissions = async () => {
        setLoading(true);
        try {
            const response = await api.get('/requisitions');
            setPermissions(response.data.requisitions || []);
        } catch (error) {
            console.error('Error fetching permissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPermission = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.post('/requisitions', addFormData);

            if (response.status === 200 || response.status === 201) {
                setIsAddModalOpen(false);
                setAddFormData({ number: '', warehouse: '', startDate: '', endDate: '' });
                fetchPermissions();
            } else {
                const data = response.data;
                alert(data.message || (i18n.language === 'ar' ? 'فشل في إضافة الإذن' : 'Failed to add permission'));
            }
        } catch (error) {
            console.error('Error adding permission:', error);
            const data = error.response?.data;
            alert(data?.message || (i18n.language === 'ar' ? 'فشل في إضافة الإذن' : 'Failed to add permission'));
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePermission = async (id) => {
        if (!window.confirm(i18n.language === 'ar' ? 'هل أنت متأكد من حذف هذا الإذن؟' : 'Are you sure you want to delete this permission?')) return;

        setLoading(true);
        try {
            const response = await api.delete(`/requisitions/${id}`);

            if (response.status === 200) {
                fetchPermissions();
            } else {
                console.error('Failed to delete permission');
            }
        } catch (error) {
            console.error('Error deleting permission:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            const response = await api.patch(`/requisitions/${id}`, { status });

            if (response.status === 200) {
                fetchPermissions();
            } else {
                console.error('Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    useEffect(() => {
        fetchPermissions();
    }, []);

    const filteredPermissions = useMemo(() => {
        return permissions.filter(item => {
            const matchNumber = filterData.number ? item.number?.toLowerCase().includes(filterData.number.toLowerCase()) : true;
            const matchWarehouse = filterData.warehouse ? item.warehouse === filterData.warehouse : true;
            const matchStart = filterData.startDate ? item.startDate >= filterData.startDate : true;
            const matchEnd = filterData.endDate ? item.endDate <= filterData.endDate : true;
            return matchNumber && matchWarehouse && matchStart && matchEnd;
        });
    }, [permissions, filterData]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilterData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddInputChange = (e) => {
        const { name, value } = e.target;
        setAddFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetFilters = () => {
        setFilterData({ number: '', warehouse: '', startDate: '', endDate: '' });
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved': return <CheckCircle2 size={14} />;
            case 'pending': return <Clock size={14} />;
            case 'rejected': return <XCircle size={14} />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200 px-6 py-5 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Warehouse size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{t('stocked.permissions.title')}</h1>
                            {/* <p className="text-sm text-gray-500">{t('stocked.permissions.no_permissions_desc', 'Manage inventory requisitions and permissions')}</p> */}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all font-semibold shadow-lg shadow-indigo-100 group"
                        >
                            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                            <span>{t('sales.common.add')}</span>
                        </button>

                        <button
                            onClick={() => setIsFilterModalOpen(true)}
                            className="flex items-center gap-2 border border-gray-200 bg-white text-gray-700 px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                        >
                            <Filter size={18} className="text-gray-400" />
                            <span>{t('sales.common.search_filter')}</span>
                        </button>

                        <button
                            onClick={fetchPermissions}
                            className={`p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all bg-white ${loading && !isAddModalOpen ? 'animate-spin' : ''}`}
                            title={t('sales.common.refresh')}
                        >
                            <RefreshCw size={20} className="text-gray-500" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                {loading && !isAddModalOpen ? (
                    <div className="flex flex-col items-center justify-center h-96 gap-4">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                            <Warehouse className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600" size={24} />
                        </div>
                        <p className="text-gray-500 animate-pulse font-medium">{i18n.language === 'ar' ? 'جاري التحميل...' : 'Loading permissions...'}</p>
                    </div>
                ) : filteredPermissions.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center shadow-sm">
                        <div className="inline-flex p-6 bg-indigo-50 text-indigo-200 rounded-full mb-6">
                            <Warehouse size={64} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{t('stocked.permissions.no_permissions')}</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mb-8">{i18n.language === 'ar' ? 'لم يتم العثور على أي أذونات تطابق معايير البحث الخاصة بك.' : 'No permissions found matching your search criteria.'}</p>
                        <button
                            onClick={() => { resetFilters(); fetchPermissions(); }}
                            className="text-indigo-600 font-semibold hover:underline"
                        >
                            {i18n.language === 'ar' ? 'مسح التصفية' : 'Clear Filters'}
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[#FBFCFE] border-b border-gray-200">
                                    <tr>
                                        <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('stocked.permissions.number')}</th>
                                        <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('stocked.permissions.warehouse')}</th>
                                        <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('stocked.permissions.start_date')}</th>
                                        <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('stocked.permissions.end_date')}</th>
                                        <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('stocked.permissions.status')}</th>
                                        <th className={`px-6 py-4 font-bold text-gray-700 text-${i18n.language === 'ar' ? 'right' : 'left'}`}>{t('stocked.permissions.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredPermissions.map((item) => (
                                        <tr key={item.id || item._id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Hash size={14} className="text-gray-300" />
                                                    <span className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.number}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Warehouse size={14} className="text-gray-400" />
                                                    {item.warehouse === 'main' ? t('sales.common.main_warehouse') : t('sales.common.secondary_warehouse')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{new Date(item.startDate).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}</td>
                                            <td className="px-6 py-4 text-gray-600">{new Date(item.endDate).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyles(item.status || 'pending')}`}>
                                                    {getStatusIcon(item.status || 'pending')}
                                                    {t(`stocked.permissions.status_${item.status || 'pending'}`)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleUpdateStatus(item._id, 'approved')}
                                                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                        title={t('stocked.permissions.approve', 'Approve')}
                                                    >
                                                        <CheckCircle2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePermission(item._id)}
                                                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                        title={t('stocked.permissions.delete')}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                                <button className="p-1.5 text-gray-400 group-hover:hidden transition-all">
                                                    <MoreVertical size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* Filter Modal */}
            {isFilterModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300">
                        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                                    <Filter size={24} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">{t('sales.common.search_filter')}</h2>
                            </div>
                            <X className="text-gray-400 cursor-pointer hover:text-gray-900" onClick={() => setIsFilterModalOpen(false)} />
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <input type="text" name="number" value={filterData.number} onChange={handleFilterChange} placeholder={t('stocked.permissions.number')} className={`w-full p-4 bg-gray-50 rounded-xl outline-none text-${i18n.language === 'ar' ? 'right' : 'left'}`} />
                                <select name="warehouse" value={filterData.warehouse} onChange={handleFilterChange} className={`w-full p-4 bg-gray-50 rounded-xl outline-none text-${i18n.language === 'ar' ? 'right' : 'left'}`}>
                                    <option value="">{t('sales.common.select_warehouse')}</option>
                                    <option value="main">{t('sales.common.main_warehouse')}</option>
                                    <option value="secondary">{t('sales.common.secondary_warehouse')}</option>
                                </select>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={resetFilters} className="flex-1 p-4 bg-rose-50 text-rose-600 rounded-xl font-bold">{i18n.language === 'ar' ? 'إعادة' : 'Reset'}</button>
                                <button onClick={() => setIsFilterModalOpen(false)} className="flex-1 p-4 bg-emerald-500 text-white rounded-xl font-bold">{i18n.language === 'ar' ? 'تطبيق' : 'Apply'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Permission Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300">
                        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                                    <Plus size={24} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">{t('stocked.permissions.add_permission')}</h2>
                            </div>
                            <X className="text-gray-400 cursor-pointer hover:text-gray-900" onClick={() => setIsAddModalOpen(false)} />
                        </div>
                        <form onSubmit={handleAddPermission} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="relative">
                                    <Hash className={`absolute ${i18n.language === 'ar' ? 'right-4' : 'left-4'} top-4 text-gray-400`} size={20} />
                                    <input
                                        required
                                        type="text"
                                        name="number"
                                        value={addFormData.number}
                                        onChange={handleAddInputChange}
                                        className={`w-full ${i18n.language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 bg-gray-50 rounded-xl outline-none focus:bg-white focus:border-indigo-500 border-2 border-transparent transition-all text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                                        placeholder={t('stocked.permissions.number')}
                                    />
                                </div>
                                <div className="relative">
                                    <Warehouse className={`absolute ${i18n.language === 'ar' ? 'right-4' : 'left-4'} top-4 text-gray-400`} size={20} />
                                    <select
                                        required
                                        name="warehouse"
                                        value={addFormData.warehouse}
                                        onChange={handleAddInputChange}
                                        className={`w-full ${i18n.language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 bg-gray-50 rounded-xl outline-none focus:bg-white focus:border-indigo-500 border-2 border-transparent transition-all appearance-none text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                                    >
                                        <option value="">{t('sales.common.select_warehouse')}</option>
                                        <option value="main">{t('sales.common.main_warehouse')}</option>
                                        <option value="secondary">{t('sales.common.secondary_warehouse')}</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative">
                                        <Calendar className={`absolute ${i18n.language === 'ar' ? 'right-4' : 'left-4'} top-4 text-gray-400`} size={20} />
                                        <input
                                            required
                                            type="date"
                                            name="startDate"
                                            value={addFormData.startDate}
                                            onChange={handleAddInputChange}
                                            className={`w-full ${i18n.language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 bg-gray-50 rounded-xl outline-none text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                                        />
                                    </div>
                                    <div className="relative">
                                        <Calendar className={`absolute ${i18n.language === 'ar' ? 'right-4' : 'left-4'} top-4 text-gray-400`} size={20} />
                                        <input
                                            required
                                            type="date"
                                            name="endDate"
                                            value={addFormData.endDate}
                                            onChange={handleAddInputChange}
                                            className={`w-full ${i18n.language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 bg-gray-50 rounded-xl outline-none text-${i18n.language === 'ar' ? 'right' : 'left'}`}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 p-4 border-2 border-gray-100 rounded-xl font-bold text-gray-600">{t('sales.common.cancel')}</button>
                                <button type="submit" disabled={loading} className="flex-1 p-4 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-100">
                                    {loading ? '...' : (i18n.language === 'ar' ? 'إضافة' : 'Add')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Permissions;
