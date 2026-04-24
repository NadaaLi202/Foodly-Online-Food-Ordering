import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Search, RefreshCw, X, Upload, FileText, Trash2, Printer, Download, Share2, Edit2, Link, MoreVertical, Copy, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/authcontext';
import { formatCurrency } from '../../utils/currencyformatter';
import { generatePDF } from '../../utils/generatepdf';
import { requestPrintTemplateSelection } from '../../services/printtemplateservice';
import api from '../../services/api';
import logError from '../../utils/logerror';
import { confirmDelete } from '../../utils/confirmdelete';
import toast from 'react-hot-toast';
import { handleUniversalShare } from '../../utils/shareutils';

const getInitialExpenseFormData = () => ({
    code: '',
    date: new Date().toISOString().split('T')[0],
    wallet: 'main',
    account: '',
    amount: '',
    taxes: '',
    description: '',
    attachments: []
});

const Expenses = () => {
    const { t, i18n } = useTranslation();
    const { companySettings } = useAuth();
    const currency = companySettings?.currency || 'EGP';
    const location = useLocation();
    const navigate = useNavigate();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [errors, setErrors] = useState({});
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [modalMode, setModalMode] = useState('add');
    const [openActionMenu, setOpenActionMenu] = useState(null);

    const [formData, setFormData] = useState(getInitialExpenseFormData);
    const [chartAccounts, setChartAccounts] = useState([]);

    const ACCOUNT_TYPE_LABELS = { asset: 'أصول', liability: 'التزامات', equity: 'حقوق الملكية', income: 'إيرادات', expense: 'مصروفات' };
    const ACCOUNT_TYPE_ORDER = ['asset', 'liability', 'equity', 'income', 'expense'];

    const fetchExpenses = async (search = '') => {
        setLoading(true);
        try {
            const url = search
                ? `/expenses?search=${search}`
                : '/expenses';
            const response = await api.get(url);
            setExpenses(response.data.expenses || []);
        } catch (error) {
            logError('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
        api.get('/chart-of-accounts')
            .then(res => setChartAccounts(res.data.accounts || res.data.data || []))
            .catch(() => setChartAccounts([]));
    }, []);

    useEffect(() => {
        const openByNewRoute = location.pathname.endsWith('/finance/expenses/new');
        const openByState = Boolean(location.state?.openAddModal);

        if (!openByNewRoute && !openByState) return;

        setModalMode('add');
        setEditingExpense(null);
        setFormData(getInitialExpenseFormData());
        setUploadedFiles([]);
        setErrors({});
        setIsModalOpen(true);

        if (openByNewRoute) {
            navigate('/dashboard/finance/expenses', { replace: true });
        } else {
            navigate(location.pathname, { replace: true });
        }
    }, [location.pathname, location.state, navigate]);

    // ✅ إنشاء كود فريد تلقائياً
    const generateUniqueCode = (currentExpenses) => {
        let code = '';
        let isUnique = false;

        while (!isUnique) {
            // صيغة: EXP-2025-01-001
            const date = new Date();
            const year = date.getFullYear().toString().slice(-2);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const random = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
            code = `EXP-${year}-${month}-${random}`;

            // تحقق من عدم وجود الكود مسبقاً
            isUnique = !currentExpenses.some(exp => exp.code === code);
        }

        return code;
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.date) {
            newErrors.date = i18n.language === 'ar' ? 'التاريخ مطلوب' : 'Date is required';
        }

        if (!formData.wallet) {
            newErrors.wallet = i18n.language === 'ar' ? 'المحفظة مطلوبة' : 'Wallet is required';
        }

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            newErrors.amount = i18n.language === 'ar' ? 'المبلغ مطلوب ويجب أن يكون أكبر من صفر' : 'Amount is required and must be greater than zero';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        setUploadedFiles([...uploadedFiles, ...files]);
    };

    const removeFile = (index) => {
        const newFiles = uploadedFiles.filter((_, i) => i !== index);
        setUploadedFiles(newFiles);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            alert(i18n.language === 'ar' ? 'الرجاء ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
            return;
        }

        // ✅ File type validation
        const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx'];
        for (const file of uploadedFiles) {
            const extension = file.name.split('.').pop().toLowerCase();
            if (!allowedExtensions.includes(extension)) {
                alert(i18n.language === 'ar'
                    ? `نوع الملف ${extension} غير مسموح به. يرجى استخدام PDF أو الصور أو Word أو Excel.`
                    : `File type ${extension} is not allowed. Use PDF, images, Word or Excel.`);
                return;
            }
        }

        setLoading(true);

        try {
            // Create FormData object to handle both text fields and file uploads
            const formDataToSend = new FormData();

            // Append basic form fields
            formDataToSend.append('code', formData.code || '');
            formDataToSend.append('date', formData.date);
            formDataToSend.append('wallet', formData.wallet);
            formDataToSend.append('account', formData.account || '');
            formDataToSend.append('amount', formData.amount);
            formDataToSend.append('taxes', formData.taxes || '0');
            formDataToSend.append('description', formData.description || '');

            // Append existing attachments (for updates)
            if (formData.attachments && formData.attachments.length > 0) {
                formDataToSend.append('existingAttachments', JSON.stringify(formData.attachments));
            }

            // Append new uploaded files
            if (uploadedFiles && uploadedFiles.length > 0) {
                uploadedFiles.forEach((file) => {
                    formDataToSend.append('attachments', file);
                });
            }

            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            };

            const response = editingExpense
                ? await api.put(`/expenses/${editingExpense._id}`, formDataToSend, config)
                : await api.post('/expenses', formDataToSend, config);

            if (response.status === 200 || response.status === 201) {
                alert(i18n.language === 'ar'
                    ? (editingExpense ? 'تم تحديث المصروف بنجاح!' : 'تم إضافة المصروف بنجاح!')
                    : (editingExpense ? 'Expense updated successfully!' : 'Expense added successfully!'));
                setIsModalOpen(false);
                setEditingExpense(null);
                fetchExpenses();
                resetForm();
            } else {
                const error = response.data;
                const errorMessage = Array.isArray(error.message)
                    ? error.message.join('\n')
                    : (error.message || (i18n.language === 'ar' ? 'حدث خطأ' : 'Error occurred'));
                alert(errorMessage);
            }
        } catch (error) {
            logError('Error saving expense:', error);
            const msg = error.response?.data?.message || (i18n.language === 'ar' ? 'حدث خطأ في الاتصال بالسيرفر' : 'Server connection error');
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setFormData({
            code: expense.code || '',
            date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
            wallet: expense.wallet || 'main',
            account: expense.account || '',
            amount: expense.amount || '',
            taxes: expense.taxes || '',
            description: expense.description || '',
            attachments: expense.attachments || []
        });
        setUploadedFiles([]);
        setIsModalOpen(true);
        setModalMode('edit');
        setOpenActionMenu(null);
    };

    const handleView = (expense) => {
        setEditingExpense(expense);
        setFormData({
            code: expense.code || '',
            date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
            wallet: expense.wallet || 'main',
            account: expense.account || '',
            amount: expense.amount || '',
            taxes: expense.taxes || '',
            description: expense.description || '',
            attachments: expense.attachments || []
        });
        setUploadedFiles([]);
        setModalMode('view');
        setIsModalOpen(true);
        setOpenActionMenu(null);
    };

    const handleDuplicate = async (expense) => {
        // ✅ توليد كود جديد تلقائياً عند التكرار
        const newCode = generateUniqueCode(expenses);

        setFormData({
            code: newCode, // كود جديد فريد
            date: new Date().toISOString().split('T')[0],
            wallet: expense.wallet || 'main',
            account: expense.account || '',
            amount: expense.amount || '',
            taxes: expense.taxes || '',
            description: expense.description || '',
            attachments: []
        });
        setUploadedFiles([]);
        setEditingExpense(null);
        setModalMode('add');
        setIsModalOpen(true);
        setOpenActionMenu(null);
    };

    const handlePrint = async () => {
        try {
            await requestPrintTemplateSelection({
                actionType: 'print',
                source: 'expenses-print',
            });
        } catch {
            return;
        }

        const content = document.getElementById('expense-details');
        if (!content) return;

        try {
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                alert(i18n.language === 'ar' ? 'الرجاء السماح بالنوافذ المنبثقة للطباعة' : 'Please allow popups to print');
                return;
            }
            const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
            printWindow.document.write(`
                <!DOCTYPE html>
                <html dir="${dir}" lang="${i18n.language || 'en'}">
                <head>
                    <meta charset="utf-8">
                    <title>Expense ${formData.code || 'Details'}</title>
                    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                    <style>
                        body { font-family: system-ui, -apple-system, sans-serif; direction: ${dir}; padding: 24px; color: #1f2937; }
                        @media print { .no-print { display: none !important; } body { padding: 0; } }
                    </style>
                </head>
                <body>${content.innerHTML}</body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.onafterprint = () => printWindow.close();
            }, 350);
        } catch (err) {
            logError('Print error:', err);
            alert(i18n.language === 'ar' ? 'فشلت عملية الطباعة' : 'Failed to print');
        }
    };

    const triggerPdfDownload = (pdf, filename) => {
        try {
            pdf.save(filename);
        } catch (saveErr) {
            try {
                const blob = pdf.output('blob');
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.rel = 'noopener';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (blobErr) {
                logError('PDF save and blob fallback failed:', saveErr, blobErr);
                throw new Error('Download failed. Please allow downloads for this site.');
            }
        }
    };

    const getExpensePdfHtml = () => {
        const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
        const isArabic = i18n.language === 'ar';
        const label = (ar, en) => (isArabic ? ar : en);
        const dateStr = formData.date ? new Date(formData.date).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US') : '—';
        const amount = Number(formData.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const taxes = Number(formData.taxes || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const total = Number(calculateTotal() || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `
<!DOCTYPE html>
<html lang="${i18n.language || 'en'}" dir="${dir}">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800&display=swap" rel="stylesheet" />
    <style>
        * { box-sizing: border-box; direction: ${dir}; text-align: ${isArabic ? 'right' : 'left'}; font-family: 'Cairo', Arial, sans-serif; }
        body { margin: 0; padding: 24px; color: #1f2937; background: #fff; }
        .header { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e5e7eb; }
        .title { margin: 0 0 8px; font-size: 24px; font-weight: 900; color: #4f46e5; }
        .code { margin: 0; color: #6b7280; font-weight: 700; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .field { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px 14px; background: #fafafa; }
        .field label { display: block; font-size: 10px; font-weight: 800; color: #9ca3af; margin-bottom: 4px; text-transform: uppercase; }
        .field p { margin: 0; font-size: 14px; font-weight: 700; color: #1f2937; }
        .description-box { margin-top: 16px; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; background: #fafafa; }
        .description-box label { display:block; font-size: 10px; font-weight: 800; color: #9ca3af; margin-bottom: 8px; text-transform: uppercase; }
        .description-box p { margin: 0; font-size: 14px; font-weight: 700; line-height: 1.6; }
        .totals { margin-top: 24px; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
        .totals div { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 8px; font-size: 14px; font-weight: 700; }
        .totals .grand { font-size: 20px; font-weight: 900; color: #4f46e5; padding-top: 8px; border-top: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div id="expense-pdf-root">
        <div class="header">
            <h1 class="title">${label('تفاصيل المصروف', 'Expense Details')}</h1>
            <p class="code">${formData.code || '—'}</p>
        </div>
        <div class="grid">
            <div class="field"><label>${label('التاريخ', 'Date')}</label><p>${dateStr}</p></div>
            <div class="field"><label>${label('الخزينة', 'Wallet')}</label><p>${formData.wallet === 'main' ? label('الخزنة الرئيسية', 'Main Safe') : label('البنك', 'Bank')}</p></div>
            <div class="field"><label>${label('الحساب', 'Account')}</label><p>${formData.account || '—'}</p></div>
        </div>
        ${formData.description ? `
        <div class="description-box">
            <label>${label('الوصف', 'Description')}</label>
            <p>${formData.description}</p>
        </div>` : ''}
        <div class="totals">
            <div><span>${label('المبلغ', 'Amount')}</span><span>${formatCurrency(amount, currency)}</span></div>
            <div><span>${label('الضرائب', 'Taxes')}</span><span>${formatCurrency(taxes, currency)}</span></div>
            <div class="grand"><span>${label('إجمالي المصروف', 'Total Expense')}</span><span>${formatCurrency(total, currency)}</span></div>
        </div>
    </div>
</body>
</html>`;
    };

    const handleExportPDF = async () => {
        const filename = `Expense_${formData.code || 'Details'}.pdf`;
        try {
            const html = getExpensePdfHtml();
            const blob = await generatePDF(html, filename, { landscape: false });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (error) {
            logError('PDF export error:', error);
            alert(i18n.language === 'ar' ? 'حدث خطأ أثناء تصدير PDF' : 'Error exporting PDF');
        }
    };

    const handleDownloadAttachment = async (file) => {
        if (!file || !file.url) return;

        try {
            const response = await fetch(file.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.filename || 'attachment');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            logError('Download error:', error);
            window.open(file.url, '_blank');
        }
    };

    const handleShare = async () => {
        await handleUniversalShare({
            title: i18n.language === 'ar' ? 'تفاصيل المصروف' : 'Expense Details',
            text: `${i18n.language === 'ar' ? 'كود المصروف' : 'Expense Code'}: ${formData.code}\n${i18n.language === 'ar' ? 'المبلغ' : 'Amount'}: ${formatCurrency(calculateTotal(), currency)}`,
            url: window.location.href,
            t
        });
    };

    const removeExistingAttachment = (index) => {
        const newAttachments = formData.attachments.filter((_, i) => i !== index);
        setFormData({ ...formData, attachments: newAttachments });
    };

    const handleDelete = async (id) => {
        const confirmed = await confirmDelete({ title: t('sales.common.confirm_delete'), message: t('sales.common.confirm_delete'), confirmText: t('sales.common.confirm'), cancelText: t('sales.common.cancel') });
        if (!confirmed) {
            return;
        }

        try {
            const response = await api.delete(`/expenses/${id}`);

            if (response.status === 200) {
                alert(i18n.language === 'ar' ? 'تم حذف المصروف بنجاح!' : 'Expense deleted successfully!');
                fetchExpenses();
                setOpenActionMenu(null);
            } else {
                const error = response.data;
                alert(error.message || (i18n.language === 'ar' ? 'حدث خطأ في الحذف' : 'Error deleting expense'));
            }
        } catch (error) {
            logError('Error deleting expense:', error);
            alert(i18n.language === 'ar' ? 'حدث خطأ في الاتصال بالسيرفر' : 'Server connection error');
        }
    };

    const resetForm = () => {
        setFormData(getInitialExpenseFormData());
        setEditingExpense(null);
        setUploadedFiles([]);
        setErrors({});
    };

    const calculateTotal = () => {
        const amount = parseFloat(formData.amount) || 0;
        const taxes = parseFloat(formData.taxes) || 0;
        return (amount + taxes).toFixed(2);
    };

    return (
        <div className="min-h-screen bg-white" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-4 flex-1">
                    <button
                        type="button"
                        onClick={() => {
                            setModalMode('add');
                            setEditingExpense(null);
                            resetForm();
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors font-bold text-sm shadow-sm hover:shadow-md"
                    >
                        <Plus size={20} />
                        <span>{i18n.language === 'ar' ? 'إضافة مصروف جديد' : 'Add New Expense'}</span>
                    </button>

                    <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2.5 bg-white flex-1 max-w-sm">
                        <Search size={18} className="text-gray-400" />
                        <input
                            type="text"
                            placeholder={i18n.language === 'ar' ? 'بحث...' : 'Search...'}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                fetchExpenses(e.target.value);
                            }}
                            className={`w-full focus:outline-none text-sm bg-white font-medium placeholder-gray-400`}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 text-gray-600">
                    <FileText size={18} />
                    <span className="font-semibold">{i18n.language === 'ar' ? 'المصروفات' : 'Expenses'}</span>
                    <RefreshCw
                        size={16}
                        className={`cursor-pointer hover:text-indigo-600 transition-colors ${loading ? 'animate-spin text-indigo-600' : ''}`}
                        onClick={() => fetchExpenses(searchTerm)}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {loading && !isModalOpen ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : expenses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <div className="text-6xl mb-4">💰</div>
                        <p className="text-lg font-semibold">{i18n.language === 'ar' ? 'لا توجد مصروفات' : 'No expenses found'}</p>
                        <p className="text-sm text-indigo-600 cursor-pointer hover:underline font-medium" onClick={() => {
                            setModalMode('add');
                            resetForm();
                            setIsModalOpen(true);
                        }}>
                            {i18n.language === 'ar' ? 'ابدأ بإضافة مصروف' : 'Start by adding an expense'}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-semibold text-gray-600 uppercase tracking-wider`}>{i18n.language === 'ar' ? 'رقم المصروف' : 'Expense Code'}</th>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-semibold text-gray-600 uppercase tracking-wider`}>{i18n.language === 'ar' ? 'التاريخ' : 'Date'}</th>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-semibold text-gray-600 uppercase tracking-wider`}>{i18n.language === 'ar' ? 'الحالة' : 'Status'}</th>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-semibold text-gray-600 uppercase tracking-wider`}>{i18n.language === 'ar' ? 'الوصف' : 'Description'}</th>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-semibold text-gray-600 uppercase tracking-wider`}>{i18n.language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                                    <th className={`px-6 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-xs font-semibold text-gray-600 uppercase tracking-wider`}>{i18n.language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {expenses.map((expense) => (
                                    <tr key={expense._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 cursor-pointer hover:text-indigo-700 font-medium" onClick={() => handleView(expense)}>
                                            {expense.code || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                            {new Date(expense.date).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800`}>
                                                {i18n.language === 'ar' ? 'ثبت' : 'Posted'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate font-medium">
                                            {expense.description || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                                            {formatCurrency(expense.totalAmount || expense.amount, currency)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm relative">
                                            <div className="relative">
                                                <button
                                                    onClick={() => setOpenActionMenu(openActionMenu === expense._id ? null : expense._id)}
                                                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                                                >
                                                    <MoreVertical size={18} />
                                                </button>

                                                {/* Action Menu */}
                                                {openActionMenu === expense._id && (
                                                    <div className={`absolute ${i18n.language === 'ar' ? 'right-0' : 'left-0'} mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden`}>
                                                        <button
                                                            onClick={() => handleView(expense)}
                                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors border-b border-gray-100"
                                                        >
                                                            <Eye size={16} className="text-indigo-600" />
                                                            <span>{i18n.language === 'ar' ? 'عرض' : 'View'}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDuplicate(expense)}
                                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors border-b border-gray-100"
                                                        >
                                                            <Copy size={16} className="text-blue-600" />
                                                            <span>{i18n.language === 'ar' ? 'تكرار' : 'Duplicate'}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(expense._id)}
                                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                            <span>{i18n.language === 'ar' ? 'حذف' : 'Delete'}</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4" onClick={() => {
                    if (modalMode === 'view') {
                        setIsModalOpen(false);
                        setEditingExpense(null);
                        resetForm();
                    }
                }}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-800 tracking-tight">
                                {modalMode === 'view' ? (i18n.language === 'ar' ? 'عرض عملية صرف مالية' : 'View Expense Transaction') :
                                    modalMode === 'edit' ? (i18n.language === 'ar' ? 'تعديل مصروف' : 'Edit Expense') :
                                        (i18n.language === 'ar' ? 'إضافة مصروف جديد' : 'Add New Expense')}
                            </h2>
                            <div className="flex items-center gap-2">
                                {modalMode === 'view' && (
                                    <button
                                        onClick={() => setModalMode('edit')}
                                        className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg transition-colors"
                                        title={i18n.language === 'ar' ? 'تعديل' : 'Edit'}
                                    >
                                        <Edit2 size={20} />
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setEditingExpense(null);
                                        resetForm();
                                    }}
                                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Document Actions Banner */}
                        {modalMode === 'view' && (
                            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-wrap gap-4">
                                <div className="flex gap-4">
                                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 min-w-[120px]">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">{i18n.language === 'ar' ? 'المستند' : 'Document'}</label>
                                        <div className="flex items-center gap-3">
                                            <button onClick={handlePrint} className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors" title="Print"><Printer size={16} /></button>
                                            <button onClick={handleExportPDF} className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors" title="PDF"><Download size={16} /></button>
                                            <button onClick={handleShare} className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors" title="Share"><Share2 size={16} /></button>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 min-w-[120px]">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{i18n.language === 'ar' ? 'قيد اليومية' : 'Journal Entry'}</label>
                                        <p className="text-sm font-bold text-indigo-600 flex items-center gap-1">
                                            <Link size={14} />
                                            {formData.code || '—'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 min-w-[100px]">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{i18n.language === 'ar' ? 'الحالة' : 'Status'}</label>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase">{i18n.language === 'ar' ? 'ثبت' : 'Posted'}</span>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 min-w-[100px]">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{i18n.language === 'ar' ? 'المصدر' : 'Source'}</label>
                                        <p className="text-sm font-bold text-gray-700">{i18n.language === 'ar' ? 'يدوي' : 'Manual'}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 min-w-[100px]">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{i18n.language === 'ar' ? 'المستخدم' : 'User'}</label>
                                        <p className="text-sm font-bold text-gray-700">{editingExpense?.createdBy?.name || 'nada ali'}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6" id="expense-details">
                            {modalMode === 'view' ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{i18n.language === 'ar' ? 'الكود' : 'Code'}</label>
                                            <p className="text-sm font-bold text-gray-800 bg-gray-50 p-3 rounded-lg">{formData.code || '—'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{i18n.language === 'ar' ? 'التاريخ' : 'Date'}</label>
                                            <p className="text-sm font-bold text-gray-800 bg-gray-50 p-3 rounded-lg">{new Date(formData.date).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}</p>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{i18n.language === 'ar' ? 'الخزينة' : 'Wallet'}</label>
                                            <p className="text-sm font-bold text-gray-800 bg-gray-50 p-3 rounded-lg">
                                                {formData.wallet === 'main' ? (i18n.language === 'ar' ? 'الخزنة الرئيسية' : 'Main Safe') : (i18n.language === 'ar' ? 'البنك' : 'Bank')}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{i18n.language === 'ar' ? 'الحساب' : 'Account'}</label>
                                            <p className="text-sm font-bold text-gray-800 bg-gray-50 p-3 rounded-lg">{formData.account || (i18n.language === 'ar' ? 'بدون حساب' : 'No Account')}</p>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{i18n.language === 'ar' ? 'المبلغ' : 'Amount'}</label>
                                            <p className="text-sm font-bold text-gray-800 bg-gray-50 p-3 rounded-lg">{formatCurrency(formData.amount, currency)}</p>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{i18n.language === 'ar' ? 'الضرائب' : 'Taxes'}</label>
                                            <p className="text-sm font-bold text-gray-800 bg-gray-50 p-3 rounded-lg">{formData.taxes ? formatCurrency(formData.taxes, currency) : (i18n.language === 'ar' ? 'بدون ضرائب' : 'No Taxes')}</p>
                                        </div>
                                    </div>

                                    {formData.description && (
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">{i18n.language === 'ar' ? 'الوصف' : 'Description'}</label>
                                            <p className="text-sm font-bold text-gray-800 bg-gray-50 p-3 rounded-lg">{formData.description}</p>
                                        </div>
                                    )}

                                    {formData.attachments?.length > 0 && (
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">{i18n.language === 'ar' ? 'المرفقات' : 'Attachments'}</label>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {formData.attachments.map((file, idx) => (
                                                    <div key={idx} className="relative group">
                                                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-indigo-50 transition-colors group-hover:border-indigo-300">
                                                            <FileText size={24} className="text-gray-400 group-hover:text-indigo-600 mb-2" />
                                                            <span className="text-[10px] font-bold text-gray-500 group-hover:text-indigo-700 truncate w-full text-center">{file.filename || `File ${idx + 1}`}</span>
                                                        </a>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleDownloadAttachment(file);
                                                            }}
                                                            className="absolute top-2 right-2 p-1.5 bg-white shadow border border-gray-200 rounded text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Download size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200 text-center">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{i18n.language === 'ar' ? 'إجمالي المصروف' : 'Total Expense'}</p>
                                        <p className="text-3xl font-bold text-indigo-600">{formatCurrency(calculateTotal(), currency)}</p>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Code */}
                                    <div>
                                        <label className={`block text-sm font-bold text-gray-700 mb-1.5`}>
                                            {i18n.language === 'ar' ? 'الكود' : 'Code'}
                                        </label>
                                        <input
                                            type="text"
                                            name="code"
                                            value={formData.code}
                                            onChange={handleInputChange}
                                            placeholder={i18n.language === 'ar' ? 'سيتم توليده تلقائياً' : 'Will be auto-generated'}
                                            disabled={!editingExpense && modalMode === 'add'}
                                            className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium ${!editingExpense && modalMode === 'add' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        />
                                    </div>

                                    {/* Date */}
                                    <div>
                                        <label className={`block text-sm font-bold text-gray-700 mb-1.5`}>
                                            {i18n.language === 'ar' ? 'التاريخ' : 'Date'} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="date"
                                            value={formData.date}
                                            onChange={handleInputChange}
                                            className={`w-full border ${errors.date ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium`}
                                        />
                                        {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                                    </div>

                                    {/* Wallet */}
                                    <div>
                                        <label className={`block text-sm font-bold text-gray-700 mb-1.5`}>
                                            {i18n.language === 'ar' ? 'المحفظة' : 'Wallet'} <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="wallet"
                                            value={formData.wallet}
                                            onChange={handleInputChange}
                                            className={`w-full border ${errors.wallet ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white font-medium`}
                                        >
                                            <option value="main">{i18n.language === 'ar' ? 'الخزنة الرئيسية' : 'Main Safe'}</option>
                                            <option value="bank">{i18n.language === 'ar' ? 'الحساب البنكي الرئيسي' : 'Main Bank Account'}</option>
                                        </select>
                                        {errors.wallet && <p className="text-red-500 text-xs mt-1">{errors.wallet}</p>}
                                    </div>

                                    {/* Account */}
                                    <div>
                                        <label className={`block text-sm font-bold text-gray-700 mb-1.5`}>
                                            {i18n.language === 'ar' ? 'الحساب' : 'Account'}
                                        </label>
                                        <select
                                            name="account"
                                            value={formData.account}
                                            onChange={handleInputChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white font-medium"
                                            dir="rtl"
                                        >
                                            <option value="">{i18n.language === 'ar' ? 'اختر حساب' : 'Select Account'}</option>
                                            {ACCOUNT_TYPE_ORDER.map(typeKey => {
                                                const group = chartAccounts.filter(a => a.accountCategory === typeKey);
                                                if (group.length === 0) return null;
                                                return (
                                                    <optgroup key={typeKey} label={ACCOUNT_TYPE_LABELS[typeKey]}>
                                                        {group.map(acc => (
                                                            <option key={acc._id || acc.code} value={`${acc.name} #${acc.code}`}>
                                                                {acc.name} #{acc.code}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                );
                                            })}
                                        </select>
                                    </div>

                                    {/* Amount and Taxes */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={`block text-sm font-bold text-gray-700 mb-1.5`}>
                                                {i18n.language === 'ar' ? 'المبلغ' : 'Amount'} <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="amount"
                                                value={formData.amount}
                                                onChange={handleInputChange}
                                                placeholder="0.00"
                                                min="0"
                                                step="0.01"
                                                className={`w-full border ${errors.amount ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium`}
                                            />
                                            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                                        </div>

                                        <div>
                                            <label className={`block text-sm font-bold text-gray-700 mb-1.5`}>
                                                {i18n.language === 'ar' ? 'الضرائب' : 'Taxes'}
                                            </label>
                                            <input
                                                type="number"
                                                name="taxes"
                                                value={formData.taxes}
                                                onChange={handleInputChange}
                                                placeholder="0.00"
                                                min="0"
                                                step="0.01"
                                                className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium`}
                                            />
                                        </div>
                                    </div>

                                    {/* Total */}
                                    <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-gray-600">{i18n.language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                                            <span className="text-lg font-bold text-indigo-600">{calculateTotal()} {i18n.language === 'ar' ? 'ج.م' : 'EGP'}</span>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className={`block text-sm font-bold text-gray-700 mb-1.5`}>
                                            {i18n.language === 'ar' ? 'الوصف' : 'Description'}
                                        </label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows="3"
                                            className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none font-medium`}
                                            placeholder={i18n.language === 'ar' ? 'أدخل وصف المصروف...' : 'Enter expense description...'}
                                        />
                                    </div>

                                    {/* Attachments */}
                                    <div>
                                        <label className={`block text-sm font-bold text-gray-700 mb-1.5`}>
                                            {i18n.language === 'ar' ? 'المرفقات' : 'Attachments'}
                                        </label>
                                        <input
                                            type="file"
                                            multiple
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            id="file-upload"
                                        />
                                        <label
                                            htmlFor="file-upload"
                                            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer transition-colors block"
                                        >
                                            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                            <p className="text-sm font-bold text-gray-500">{i18n.language === 'ar' ? 'اضغط لرفع الملفات أو اسحبها هنا' : 'Click to upload or drag files'}</p>
                                        </label>

                                        {/* Existing Attachments */}
                                        {editingExpense && formData.attachments?.length > 0 && (
                                            <div className="mt-4">
                                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">{i18n.language === 'ar' ? 'المرفقات الحالية' : 'Current Attachments'}</p>
                                                <div className="space-y-2">
                                                    {formData.attachments.map((file, index) => (
                                                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-200">
                                                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-2 flex-1">
                                                                <FileText size={16} />
                                                                <span className="truncate">{file.filename || (i18n.language === 'ar' ? 'ملف ' : 'File ') + (index + 1)}</span>
                                                            </a>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeExistingAttachment(index)}
                                                                className="text-gray-400 hover:text-red-500 p-1"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* New Uploads */}
                                        {uploadedFiles.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                {uploadedFiles.map((file, index) => (
                                                    <div key={index} className="flex items-center justify-between bg-indigo-50 p-2 rounded-lg border border-indigo-200">
                                                        <span className="text-sm font-bold text-indigo-700">{file.name}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFile(index)}
                                                            className="text-red-500 hover:text-red-700 p-1"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex gap-3 pt-4 sticky bottom-0 bg-white border-t border-gray-200 py-2">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-bold text-sm disabled:opacity-50"
                                        >
                                            {loading ? (i18n.language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (i18n.language === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsModalOpen(false);
                                                setEditingExpense(null);
                                                resetForm();
                                            }}
                                            className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-bold text-sm"
                                        >
                                            {i18n.language === 'ar' ? 'إلغاء' : 'Cancel'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;

