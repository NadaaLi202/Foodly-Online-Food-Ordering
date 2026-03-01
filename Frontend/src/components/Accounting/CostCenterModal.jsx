import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import costCenterService from '../../services/costCenterService';

const CostCenterModal = ({ isOpen, onClose, onSuccess, editingItem, mainCenters }) => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        type: 'main',
        parentId: ''
    });

    useEffect(() => {
        if (editingItem) {
            setFormData({
                name: editingItem.name || '',
                type: editingItem.type || 'main',
                parentId: editingItem.parentId?._id || editingItem.parentId || ''
            });
        } else {
            setFormData({
                name: '',
                type: 'main',
                parentId: ''
            });
        }
    }, [editingItem]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name) {
            toast.error(isRTL ? 'الاسم مطلوب' : 'Name is required');
            return;
        }

        if (formData.type === 'sub' && !formData.parentId) {
            toast.error(isRTL ? 'مركز التكلفة الرئيسي مطلوب' : 'Parent cost center is required');
            return;
        }

        setLoading(true);
        try {
            if (editingItem) {
                await costCenterService.updateCostCenter(editingItem._id, formData);
                toast.success(t('sales.common.success_message'));
            } else {
                await costCenterService.createCostCenter(formData);
                toast.success(t('sales.common.success_message'));
            }
            onSuccess();
            onClose();
        } catch (error) {
            const msg = error.response?.data?.message || t('sales.common.error_message');
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[1px]" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">
                        {editingItem ? (isRTL ? 'تعديل مركز تكلفة' : 'Edit Cost Center') : (isRTL ? 'إضافة مركز تكلفة' : 'Add Cost Center')}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Type Selection */}
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-gray-700">{isRTL ? 'النوع' : 'Type'}</label>
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="type"
                                    value="main"
                                    checked={formData.type === 'main'}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value, parentId: '' })}
                                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className={`text-sm font-medium ${formData.type === 'main' ? 'text-indigo-600' : 'text-gray-600'}`}>
                                    {isRTL ? 'رئيسي' : 'Main'}
                                </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="type"
                                    value="sub"
                                    checked={formData.type === 'sub'}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className={`text-sm font-medium ${formData.type === 'sub' ? 'text-indigo-600' : 'text-gray-600'}`}>
                                    {isRTL ? 'فرعي' : 'Sub'}
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Name Input */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-gray-600">
                            {isRTL ? 'الاسم' : 'Name'} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full h-11 border border-gray-200 rounded-lg px-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-gray-700"
                            placeholder={isRTL ? 'أدخل اسم مركز التكلفة' : 'Enter cost center name'}
                        />
                    </div>

                    {/* Parent Dropdown (only for sub) */}
                    {formData.type === 'sub' && (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="block text-sm font-bold text-gray-600">
                                {isRTL ? 'مركز التكلفة الرئيسي' : 'Main Cost Center'} <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.parentId}
                                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                                className="w-full h-11 border border-gray-200 rounded-lg px-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-gray-700 bg-white"
                            >
                                <option value="">{isRTL ? 'اختر مركز تكلفة رئيسي' : 'Select parent cost center'}</option>
                                {mainCenters.map(center => (
                                    <option key={center._id} value={center._id}>{center.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 h-11 bg-[#00a884] hover:bg-[#008f70] text-white rounded-lg font-bold shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                            <span>{isRTL ? 'حفظ' : 'Save'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-11 bg-white border border-gray-200 text-gray-600 rounded-lg font-bold hover:bg-gray-50 transition-all"
                        >
                            {isRTL ? 'إلغاء' : 'Cancel'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CostCenterModal;
