import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/currencyFormatter';
import { Plus, Search, RefreshCw, X, Upload, Calendar, Edit3, Home, MoreVertical, ChevronsUpDown, Minus, ArrowRightLeft, Share2, Printer, Download, Info, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import journalEntryService from '../../services/journalEntryService';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import { buildJournalEntryPdf, downloadJournalEntryPdf, openJournalEntryPdfInNewTab } from '../../utils/journalEntryPdf';

const JournalEntries = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [entryNumber, setEntryNumber] = useState('26-1-000001');
    const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
    const [source, setSource] = useState('');
    const [description, setDescription] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [rows, setRows] = useState([
        { id: 1, account: '', description: '', debit: '', credit: '' },
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [viewingEntry, setViewingEntry] = useState(null);
    const [viewForm, setViewForm] = useState({ date: '', number: '', source: '', description: '', rows: [], attachments: [] });
    const [viewSaveLoading, setViewSaveLoading] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ open: false, entryId: null });
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);

    // Description Modal State
    const [isDescModalOpen, setIsDescModalOpen] = useState(false);
    const [currentDescRowId, setCurrentDescRowId] = useState(null);
    const [tempDescription, setTempDescription] = useState('');

    const filteredEntries = entries.filter(entry =>
        entry.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.source || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const dateInputRef = useRef(null);
    const fileInputRef = useRef(null);
    const viewDateInputRef = useRef(null);
    const viewFileInputRef = useRef(null);

    // Fetch entries on component mount
    useEffect(() => {
        fetchEntries();
    }, []);

    // Fetch all journal entries
    const fetchEntries = async () => {
        setLoading(true);
        try {
            const response = await journalEntryService.getAllJournalEntries();
            if (response.restrictions) {
                const formattedEntries = response.restrictions.map(entry => ({
                    id: entry._id,
                    _id: entry._id,
                    number: entry.number,
                    date: entry.date ? new Date(entry.date).toISOString().split('T')[0] : '',
                    source: entry.source || '',
                    description: entry.description || '',
                    total: entry.totalDebit || entry.totalCredit || 0,
                    totalDebit: entry.totalDebit || 0,
                    totalCredit: entry.totalCredit || 0,
                    entries: entry.entries || [],
                    attachment: entry.attachment || null
                }));
                setEntries(formattedEntries);
            }
        } catch (error) {
            console.error('Error fetching entries:', error);
            const msg = error.response?.data?.message || t('sales.common.error_message');
            if (error.response?.status !== 401 && error.response?.status !== 403) {
                toast.error(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle adding a new row
    const addRow = () => {
        setRows([...rows, { id: Date.now(), account: '', description: '', debit: '', credit: '' }]);
    };

    // Handle removing a row (keep at least one row)
    const removeRow = (id) => {
        if (rows.length > 1) {
            setRows(rows.filter(row => row.id !== id));
        }
    };

    // Handle input changes
    const handleRowChange = (id, field, value) => {
        setRows(rows.map(row =>
            row.id === id ? { ...row, [field]: value } : row
        ));
    };

    // Handle file selection with validation
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = [];

        for (const file of files) {
            const fileType = file.type;
            const isValidType = fileType.startsWith('image/') || fileType === 'application/pdf';

            if (!isValidType) {
                toast.error(t('accounting.journal_entries.invalid_file_type', 'Only images and PDF files are allowed'));
                continue;
            }

            validFiles.push(file);
        }

        // Backend only accepts one file, so take the first one
        if (validFiles.length > 0) {
            setAttachments([validFiles[0]]);
        }
    };

    // Calculate totals
    const totalDebit = rows.reduce((sum, row) => sum + Number(row.debit || 0), 0);
    const totalCredit = rows.reduce((sum, row) => sum + Number(row.credit || 0), 0);

    const formattedDate = entryDate.split('-').reverse().map(part => parseInt(part)).join('-');

    const openDescModal = (id, currentDesc) => {
        setCurrentDescRowId(id);
        setTempDescription(currentDesc);
        setIsDescModalOpen(true);
    };

    const swapAccount = (id) => {
        const index = rows.findIndex(r => r.id === id);
        if (index === -1 || rows.length < 2) return;

        let targetIndex = index + 1;
        if (targetIndex >= rows.length) {
            targetIndex = index - 1;
        }

        const newRows = [...rows];
        const temp = newRows[index].account;
        newRows[index].account = newRows[targetIndex].account;
        newRows[targetIndex].account = temp;
        setRows(newRows);
    };

    const saveDescription = () => {
        if (currentDescRowId) {
            handleRowChange(currentDescRowId, 'description', tempDescription);
        }
        setIsDescModalOpen(false);
    };

    // Reset form (single row by default)
    const resetForm = () => {
        setEntryNumber('26-1-000001');
        setEntryDate(new Date().toISOString().split('T')[0]);
        setSource('');
        setDescription('');
        setAttachments([]);
        setRows([{ id: 1, account: '', description: '', debit: '', credit: '' }]);
        setEditingEntry(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handle form submission
    const handleSubmit = async () => {
        // Validation
        if (!entryDate) {
            toast.error(t('accounting.journal_entries.date_required', 'Date is required'));
            return;
        }

        const validRows = rows.filter(row => row.account.trim() !== '');
        if (validRows.length < 1) {
            toast.error(t('accounting.journal_entries.at_least_one_account', 'At least one account is required'));
            return;
        }

        // Build entries as array (single entry or multiple; no balance check)
        const entriesPayload = validRows.map(row => ({
            accountId: row.account.trim(),
            debit: Number(row.debit || 0),
            credit: Number(row.credit || 0),
            description: row.description || ''
        }));

        const payload = {
            number: entryNumber,
            date: entryDate,
            source: source || '',
            description: description || '',
            totalDebit,
            totalCredit,
            entries: entriesPayload
        };
        console.log(payload);

        setLoading(true);
        try {
            const formData = new FormData();

            formData.append('number', payload.number);
            formData.append('date', payload.date);
            formData.append('source', payload.source);
            formData.append('description', payload.description);
            formData.append('totalDebit', payload.totalDebit.toString());
            formData.append('totalCredit', payload.totalCredit.toString());
            formData.append('entries', JSON.stringify(payload.entries));

            if (attachments.length > 0 && attachments[0]) {
                formData.append('attachment', attachments[0]);
            }

            if (editingEntry) {
                // Update existing entry
                await journalEntryService.updateJournalEntry(editingEntry._id, formData);
                toast.success(t('sales.common.success_message', 'Entry updated successfully'));
            } else {
                // Create new entry
                await journalEntryService.createJournalEntry(formData);
                toast.success(t('sales.common.success_message', 'Entry created successfully'));
            }

            setIsModalOpen(false);
            resetForm();
            fetchEntries();
        } catch (error) {
            console.error('Error saving entry:', error);
            const msg = error.response?.data?.message || t('sales.common.error_message', 'An error occurred');
            if (error.response?.status === 400) {
                toast.error(msg);
            } else if (error.response?.status === 403) {
                toast.error(msg || t('sales.common.unauthorized', 'You are not authorized to perform this action'));
            } else if (error.response?.status !== 401) {
                toast.error(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle edit
    const handleEdit = async (entry) => {
        try {
            const response = await journalEntryService.getJournalEntryById(entry._id);
            const entryData = response.restriction || response;

            setEditingEntry(entryData);
            setEntryNumber(entryData.number || '');
            setEntryDate(entryData.date ? new Date(entryData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
            setSource(entryData.source || '');
            setDescription(entryData.description || '');

            // Set rows from entry data (allow single or multiple)
            if (entryData.entries && entryData.entries.length > 0) {
                const formattedRows = entryData.entries.map((entryRow, index) => ({
                    id: entryRow._id || Date.now() + index,
                    account: entryRow.account || '',
                    description: entryRow.description || '',
                    debit: entryRow.debit != null ? entryRow.debit.toString() : '',
                    credit: entryRow.credit != null ? entryRow.credit.toString() : ''
                }));
                setRows(formattedRows);
            } else {
                setRows([{ id: 1, account: '', description: '', debit: '', credit: '' }]);
            }

            // Don't set attachment file (browser restriction), but keep reference
            setAttachments([]);
            setIsModalOpen(true);
        } catch (error) {
            console.error('Error fetching entry:', error);
            const msg = error.response?.data?.message || t('sales.common.error_message', 'An error occurred');
            if (error.response?.status !== 401 && error.response?.status !== 403) {
                toast.error(msg);
            }
        }
    };

    // Handle delete
    const handleDelete = (id) => {
        setDeleteModal({ open: true, entryId: id });
    };

    const confirmDelete = async () => {
        if (!deleteModal.entryId) return;

        setDeleteLoading(true);
        try {
            await journalEntryService.deleteJournalEntry(deleteModal.entryId);
            toast.success(t('sales.common.success_message', 'Entry deleted successfully'));
            setEntries(prev => prev.filter(e => e._id !== deleteModal.entryId));
            setDeleteModal({ open: false, entryId: null });
        } catch (error) {
            console.error('Error deleting entry:', error);
            const msg = error.response?.data?.message || t('sales.common.error_message', 'An error occurred');
            if (error.response?.status === 403) {
                toast.error(msg || t('sales.common.unauthorized', 'You are not authorized to perform this action'));
            } else if (error.response?.status !== 401) {
                toast.error(msg);
            }
        } finally {
            setDeleteLoading(false);
        }
    };

    // Handle modal close
    const handleModalClose = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const handleOpenModal = async () => {
        setIsModalOpen(true);
        if (!editingEntry) {
            try {
                const response = await journalEntryService.getNextNumber();
                setEntryNumber(response.nextNumber);
            } catch (error) {
                console.error('Error fetching next entry number:', error);
            }
        }
    };

    // View journal entry details
    const handleView = async (entry) => {
        try {
            const response = await journalEntryService.getJournalEntryById(entry._id);
            const data = response.restriction || response;
            const dateStr = data.date ? new Date(data.date).toISOString().split('T')[0] : '';
            const entryObj = {
                _id: data._id,
                number: data.number,
                date: dateStr,
                source: data.source || '',
                description: data.description || '',
                totalDebit: data.totalDebit ?? 0,
                totalCredit: data.totalCredit ?? 0,
                entries: data.entries || [],
                attachment: data.attachment || null
            };
            setViewingEntry(entryObj);
            const formRows = (data.entries || []).map((row, i) => ({
                id: row._id || Date.now() + i,
                account: row.account || '',
                description: row.description || '',
                debit: row.debit != null ? String(row.debit) : '',
                credit: row.credit != null ? String(row.credit) : ''
            }));
            if (formRows.length === 0) formRows.push({ id: 1, account: '', description: '', debit: '', credit: '' });
            setViewForm({
                date: dateStr,
                number: data.number || '',
                source: data.source || '',
                description: data.description || '',
                rows: formRows,
                attachments: []
            });
            if (viewFileInputRef.current) viewFileInputRef.current.value = '';
        } catch (error) {
            console.error('Error fetching entry:', error);
            const msg = error.response?.data?.message || t('sales.common.error_message', 'An error occurred');
            if (error.response?.status !== 401 && error.response?.status !== 403) {
                toast.error(msg);
            }
        }
    };

    const closeViewModal = () => {
        setViewingEntry(null);
        setViewForm({ date: '', number: '', source: '', description: '', rows: [], attachments: [] });
    };

    const addViewRow = () => setViewForm(prev => ({ ...prev, rows: [...prev.rows, { id: Date.now(), account: '', description: '', debit: '', credit: '' }] }));
    const removeViewRow = (id) => {
        if (viewForm.rows.length <= 1) return;
        setViewForm(prev => ({ ...prev, rows: prev.rows.filter(r => r.id !== id) }));
    };
    const handleViewRowChange = (id, field, value) => {
        setViewForm(prev => ({ ...prev, rows: prev.rows.map(r => r.id === id ? { ...r, [field]: value } : r) }));
    };
    const viewTotalDebit = viewForm.rows.reduce((s, r) => s + Number(r.debit || 0), 0);
    const viewTotalCredit = viewForm.rows.reduce((s, r) => s + Number(r.credit || 0), 0);

    const handleViewFileChange = (e) => {
        const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/') || f.type === 'application/pdf');
        if (files.length) setViewForm(prev => ({ ...prev, attachments: [files[0]] }));
    };

    const handleSaveFromView = async () => {
        if (!viewingEntry?._id) return;
        const validRows = viewForm.rows.filter(r => (r.account || '').trim() !== '');
        if (validRows.length < 1) {
            toast.error(t('accounting.journal_entries.at_least_one_account', 'At least one account is required'));
            return;
        }
        setViewSaveLoading(true);
        try {
            const formData = new FormData();
            formData.append('number', viewForm.number);
            formData.append('date', viewForm.date);
            formData.append('source', viewForm.source || '');
            formData.append('description', viewForm.description || '');
            formData.append('totalDebit', String(viewTotalDebit));
            formData.append('totalCredit', String(viewTotalCredit));
            formData.append('entries', JSON.stringify(validRows.map(r => ({
                accountId: r.account.trim(),
                debit: Number(r.debit || 0),
                credit: Number(r.credit || 0),
                description: r.description || ''
            }))));
            if (viewForm.attachments.length > 0 && viewForm.attachments[0]) formData.append('attachment', viewForm.attachments[0]);
            await journalEntryService.updateJournalEntry(viewingEntry._id, formData);
            toast.success(t('sales.common.success_message', 'Entry updated successfully'));
            fetchEntries();
            closeViewModal();
        } catch (err) {
            const msg = err.response?.data?.message || t('sales.common.error_message', 'An error occurred');
            toast.error(msg);
        } finally {
            setViewSaveLoading(false);
        }
    };

    // PDF / Download / Share / Print use current view form data when in view modal
    const getEntryForPdf = () => {
        if (!viewingEntry) return null;
        if (viewForm.rows.length) {
            return {
                _id: viewingEntry._id,
                number: viewForm.number,
                date: viewForm.date,
                description: viewForm.description,
                totalDebit: viewTotalDebit,
                totalCredit: viewTotalCredit,
                entries: viewForm.rows.map(r => ({
                    account: r.account,
                    description: r.description,
                    debit: Number(r.debit || 0),
                    credit: Number(r.credit || 0)
                }))
            };
        }
        return {
            _id: viewingEntry._id,
            number: viewingEntry.number,
            date: viewingEntry.date,
            description: viewingEntry.description,
            totalDebit: viewingEntry.totalDebit,
            totalCredit: viewingEntry.totalCredit,
            entries: viewingEntry.entries || []
        };
    };

    const handleDownloadPdf = () => {
        const entry = getEntryForPdf();
        if (!entry) return;
        setPdfLoading(true);
        try {
            downloadJournalEntryPdf(entry, `journal-entry-${entry.number || entry._id}.pdf`, {
                title: t('accounting.journal_entries.view_entry'),
                locale: i18n.language
            });
            toast.success(t('accounting.journal_entries.download') + ' — OK');
        } catch (err) {
            toast.error(err.message || 'Download failed');
        } finally {
            setPdfLoading(false);
        }
    };

    const handlePrintPdf = () => {
        const entry = getEntryForPdf();
        if (!entry) return;
        setPdfLoading(true);
        try {
            openJournalEntryPdfInNewTab(entry, {
                title: t('accounting.journal_entries.view_entry'),
                locale: i18n.language
            });
            toast.success(t('accounting.journal_entries.print') + ' — OK');
        } catch (err) {
            toast.error(err.message || 'Print failed');
        } finally {
            setPdfLoading(false);
        }
    };

    const handleShare = async () => {
        const entry = getEntryForPdf();
        if (!entry) return;
        try {
            const blob = buildJournalEntryPdf(entry, {
                title: t('accounting.journal_entries.view_entry'),
                locale: i18n.language
            });
            const file = new File([blob], `journal-entry-${entry.number || 'entry'}.pdf`, { type: 'application/pdf' });
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: t('accounting.journal_entries.view_entry') + ' ' + (entry.number || ''),
                    files: [file]
                });
                toast.success(t('accounting.journal_entries.share') + ' — OK');
            } else {
                downloadJournalEntryPdf(entry, `journal-entry-${entry.number || entry._id}.pdf`, {
                    title: t('accounting.journal_entries.view_entry'),
                    locale: i18n.language
                });
                toast.success(t('accounting.journal_entries.download') + ' (share not available)');
            }
        } catch (err) {
            if (err.name !== 'AbortError') toast.error(err.message || 'Share failed');
        }
    };

    return (
        <div className="p-6 bg-white min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Top Toolbar */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    {/* Breadcrumbs */}
                    <div className="flex items-center bg-white border border-gray-200 rounded-md overflow-hidden h-10 shadow-sm">
                        <button className="px-3 h-full text-gray-400 hover:text-gray-600 transition-colors bg-white">
                            <Home size={18} />
                        </button>
                        <div className="flex items-center text-[#4B5563] font-medium text-sm h-full relative">
                            <span className="h-full w-[1px] bg-gray-200 skew-x-[-20deg] mx-1"></span>
                            <div className="px-4 h-full flex items-center hover:bg-gray-50 cursor-pointer bg-white">
                                {t('sidebar.accounting')}
                            </div>
                            <span className="h-full w-[1px] bg-gray-200 skew-x-[-20deg] mx-1"></span>
                            <div className="px-5 h-full flex items-center bg-gray-50/80 font-bold text-gray-700">
                                {t('accounting.journal_entries.title')}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={fetchEntries}
                        disabled={loading}
                        className="text-gray-400 hover:text-gray-600 transition-colors bg-white p-2 rounded-md border border-gray-100 shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleOpenModal}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all duration-300 shadow-lg shadow-indigo-100 active:scale-95 whitespace-nowrap"
                    >
                        <Plus size={20} />
                        <span>{t('accounting.journal_entries.add_entry')}</span>
                    </button>

                    <div className="relative h-10">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t('accounting.chart_of_accounts.search_account')}
                            className="bg-[#F0F7FF] border border-[#BFDBFE] text-[#2563EB] px-4 h-full pr-10 rounded-md hover:bg-blue-100 transition-colors outline-none focus:ring-1 focus:ring-blue-400 font-semibold w-72 placeholder:text-blue-400 text-sm"
                        />
                        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* List Content */}
            <div className="bg-white">
                {entries.length === 0 ? (
                    <div className="h-[500px] flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-200 rounded-xl mt-4">
                        <div className="mb-6 opacity-40">
                            <div className="w-16 h-16 grid grid-cols-2 gap-2 p-2.5 border-[3px] border-gray-300 rounded-xl relative">
                                <div className="bg-gray-300 rounded-[3px]"></div>
                                <div className="border-[2px] border-gray-300 rounded-[3px]"></div>
                                <div className="border-[2px] border-gray-300 rounded-[3px]"></div>
                                <div
                                    onClick={() => setIsModalOpen(true)}
                                    className="bg-[#4F46E5] rounded-[3px] flex items-center justify-center text-white font-black text-2xl relative cursor-pointer hover:bg-indigo-600 transition-colors"
                                >
                                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-[-1px] ml-[-0.5px]">+</span>
                                </div>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-1">{t('accounting.journal_entries.no_entries')}</h3>
                        <p className="text-sm font-medium">{t('accounting.journal_entries.start_creating')}</p>
                    </div>
                ) : filteredEntries.length > 0 ? (
                    <div className="overflow-x-auto border border-gray-100 rounded-xl shadow-sm">
                        <table className="w-full text-sm text-left" dir={isRTL ? 'rtl' : 'ltr'}>
                            <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">{t('accounting.journal_entries.daily_entry_number')}</th>
                                    <th className="px-6 py-4">{t('accounting.journal_entries.date')}</th>

                                    <th className="px-6 py-4 text-center">{t('accounting.journal_entries.total')}</th>
                                    <th className="px-6 py-4 text-center">{t('topbar.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredEntries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <button
                                                type="button"
                                                onClick={() => handleView(entry)}
                                                className="text-indigo-600 hover:text-indigo-800 font-bold text-start w-full hover:underline"
                                            >
                                                {entry.number}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{entry.date}</td>

                                        <td className="px-6 py-4 text-center font-bold text-gray-900">{entry.total.toFixed(2)}</td>
                                        <td className="px-6 py-4 flex items-center justify-center gap-3">
                                            <button
                                                onClick={() => handleView(entry)}
                                                className="text-indigo-600 hover:text-indigo-800 font-bold"
                                            >
                                                {t('topbar.view')}
                                            </button>
                                            <button
                                                onClick={() => handleEdit(entry)}
                                                className="text-blue-500 hover:text-blue-700 font-bold"
                                            >
                                                {t('accounting.chart_of_accounts.edit')}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(entry._id)}
                                                className="text-red-500 hover:text-red-700 font-bold"
                                            >
                                                {t('accounting.chart_of_accounts.delete')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="h-[300px] flex flex-col items-center justify-center text-gray-400">
                        <Search size={48} className="mb-4 opacity-20" />
                        <h3 className="text-lg font-bold text-gray-800">{t('sales.common.no_results')}</h3>
                    </div>
                )}
            </div>

            {/* Pixel Perfect Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[1px]" dir={isRTL ? 'rtl' : 'ltr'}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[1100px] overflow-hidden flex flex-col max-h-[95vh]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingEntry ? t('accounting.journal_entries.edit_entry', 'Edit Entry') : t('accounting.journal_entries.add_entry')}
                            </h2>
                            <button onClick={handleModalClose} className="text-gray-400 hover:text-gray-600 transition">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 overflow-y-auto flex-1 bg-white custom-scrollbar">

                            {/* Entry Info Row */}
                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-gray-600 px-1 text-start">
                                        {t('accounting.journal_entries.daily_entry_number')}
                                    </label>
                                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg h-11 px-3 group">
                                        <div className="flex-1 flex items-center gap-2">
                                            <span className="text-gray-500 font-medium">{entryNumber}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-gray-600 px-1 text-start">{t('accounting.journal_entries.date')}</label>
                                    <div className="flex items-center bg-white border border-gray-200 rounded-lg h-11 px-3 group relative">
                                        <div className="flex-1 flex items-center gap-2 cursor-pointer h-full" onClick={() => dateInputRef.current?.showPicker()}>
                                            <Calendar size={18} className="text-gray-400" />
                                            <span className="text-gray-700 font-medium">{formattedDate}</span>
                                        </div>
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEntryDate('');
                                            }}
                                            className="text-red-500 cursor-pointer hover:text-red-700 transition px-1 h-full flex items-center"
                                        >
                                            <X size={16} />
                                        </div>
                                        <input
                                            type="date"
                                            ref={dateInputRef}
                                            value={entryDate}
                                            onChange={(e) => setEntryDate(e.target.value)}
                                            className="absolute inset-0 opacity-0 pointer-events-none"
                                        />
                                    </div>
                                </div>
                            </div>



                            {/* Table Container */}
                            <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
                                <table className="w-full border-collapse">
                                    <thead className="bg-gray-50/50 border-b border-gray-200">
                                        <tr className="text-sm font-bold text-gray-600">
                                            <th className="w-[45px]"></th>
                                            <th className="px-4 py-3 text-start">
                                                <span className="text-red-500 ml-1">*</span>{t('accounting.journal_entries.account')}
                                            </th>
                                            <th className="px-4 py-3 text-start w-[35%]">{t('accounting.journal_entries.description')}</th>
                                            <th className="px-4 py-3 text-center w-[120px]">{t('accounting.journal_entries.debit')}</th>
                                            <th className="px-4 py-3 text-center w-[120px]">{t('accounting.journal_entries.credit')}</th>
                                            <th className="w-[45px]"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {rows.map((row) => (
                                            <tr key={row.id} className="group h-12">
                                                <td className="bg-gray-50/30 flex items-center justify-center">
                                                    <MoreVertical size={16} className="text-gray-300" />
                                                </td>
                                                <td className="p-0 border-x border-gray-100 relative bg-white">
                                                    <div className="flex items-center w-full h-11 px-3 gap-2">
                                                        <div
                                                            onClick={() => swapAccount(row.id)}
                                                            className="text-gray-400 cursor-pointer hover:text-indigo-500 transition-colors"
                                                        >
                                                            <ArrowRightLeft size={14} />
                                                        </div>
                                                        <div className="relative flex-1">
                                                            <select
                                                                value={row.account}
                                                                onChange={(e) => handleRowChange(row.id, 'account', e.target.value)}
                                                                className="w-full h-11 bg-transparent outline-none text-gray-500 appearance-none text-start pr-8"
                                                            >
                                                                <option value="">{t('accounting.journal_entries.choose_account')}</option>
                                                                {/* Account options */}
                                                                <option value="1211">{t('accounting.journal_entries.accounts.main_treasury')} #1211</option>
                                                                <option value="1221">{t('accounting.journal_entries.accounts.main_bank_account')} #1221</option>
                                                                <option value="1251">{t('accounting.journal_entries.accounts.main_warehouse')} #1251</option>
                                                                <option value="12610001">{t('accounting.journal_entries.accounts.other_customers')} #12610001</option>
                                                                <option value="1262">{t('accounting.journal_entries.accounts.other_debit_parties')} #1262</option>
                                                                <option value="127">{t('accounting.journal_entries.accounts.cash_shortage_excess')} #127</option>
                                                                <option value="128">{t('accounting.journal_entries.accounts.currency_exchange')} #128</option>
                                                                <option value="129">{t('accounting.journal_entries.accounts.purchases_under_receipt')} #129</option>
                                                                <option value="21110001">{t('accounting.journal_entries.accounts.other_suppliers')} #21110001</option>
                                                                <option value="2112">{t('accounting.journal_entries.accounts.other_credit_parties')} #2112</option>
                                                                <option value="213">{t('accounting.journal_entries.accounts.opening_balances')} #213</option>
                                                                <option value="2141">{t('accounting.journal_entries.accounts.vat_paid')} #2141</option>
                                                                <option value="2142">{t('accounting.journal_entries.accounts.vat_collected')} #2142</option>
                                                                <option value="31">{t('accounting.journal_entries.accounts.capital')} #31</option>
                                                                <option value="32">{t('accounting.journal_entries.accounts.retained_earnings')} #32</option>
                                                                <option value="411">{t('accounting.journal_entries.accounts.sales')} #411</option>
                                                                <option value="412">{t('accounting.journal_entries.accounts.sales_returns')} #412</option>
                                                                <option value="421">{t('accounting.journal_entries.accounts.other_income')} #421</option>
                                                                <option value="422">{t('accounting.journal_entries.accounts.capital_gains_losses')} #422</option>
                                                                <option value="423">{t('accounting.journal_entries.accounts.purchases_settlement')} #423</option>
                                                                <option value="511">{t('accounting.journal_entries.accounts.purchases')} #511</option>
                                                                <option value="512">{t('accounting.journal_entries.accounts.purchases_returns')} #512</option>
                                                                <option value="521">{t('accounting.journal_entries.accounts.cost_of_goods_sold')} #521</option>
                                                                <option value="523">{t('accounting.journal_entries.accounts.sales_settlement')} #523</option>
                                                                <option value="5301">{t('accounting.journal_entries.accounts.rent')} #5301</option>
                                                                <option value="5302">{t('accounting.journal_entries.accounts.electricity')} #5302</option>
                                                                <option value="5303">{t('accounting.journal_entries.accounts.phone_internet')} #5303</option>
                                                                <option value="5304">{t('accounting.journal_entries.accounts.maintenance')} #5304</option>
                                                                <option value="5305">{t('accounting.journal_entries.accounts.water')} #5305</option>
                                                                <option value="5306">{t('accounting.journal_entries.accounts.government_fees')} #5306</option>
                                                                <option value="541">{t('accounting.journal_entries.accounts.bad_debts')} #541</option>
                                                                <option value="542">{t('accounting.journal_entries.accounts.inventory_shortage_excess')} #542</option>
                                                                <option value="543">{t('accounting.journal_entries.accounts.other_expenses')} #543</option>
                                                            </select>
                                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                                                <ChevronsUpDown size={14} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-0 border-e border-gray-100 relative">
                                                    <div className="flex items-center w-full h-11 px-3">
                                                        <input
                                                            type="text"
                                                            value={row.description}
                                                            onChange={(e) => handleRowChange(row.id, 'description', e.target.value)}
                                                            className="flex-1 bg-transparent outline-none text-gray-700 text-start"
                                                        />
                                                        <div
                                                            onClick={() => openDescModal(row.id, row.description)}
                                                            className="text-gray-400 cursor-pointer hover:text-indigo-500 transition-colors ml-1"
                                                        >
                                                            <ChevronsUpDown size={14} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-0 border-e border-gray-100">
                                                    <input
                                                        type="text"
                                                        value={row.debit}
                                                        onChange={(e) => handleRowChange(row.id, 'debit', e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-full h-11 px-3 bg-transparent outline-none text-center text-gray-700 font-medium"
                                                    />
                                                </td>
                                                <td className="p-0 border-e border-gray-100">
                                                    <input
                                                        type="text"
                                                        value={row.credit}
                                                        onChange={(e) => handleRowChange(row.id, 'credit', e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-full h-11 px-3 bg-transparent outline-none text-center text-gray-700 font-medium"
                                                    />
                                                </td>
                                                <td className="flex items-center justify-center">
                                                    <button
                                                        onClick={() => removeRow(row.id)}
                                                        className="w-5 h-5 rounded-full bg-[#EF4444] text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                                                    >
                                                        <Minus size={12} strokeWidth={4} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50/50 font-bold border-t border-gray-200">
                                        <tr className="h-12 text-gray-700">
                                            <td className="bg-white"></td>
                                            <td className="px-4 bg-white">
                                                <button
                                                    onClick={addRow}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#4F46E5] text-white hover:bg-indigo-700 transition-colors shadow-sm font-bold text-sm"
                                                >
                                                    <Plus size={16} strokeWidth={3} />
                                                    <span>{t('topbar.add')}</span>
                                                </button>
                                            </td>
                                            <td className="px-4 bg-white text-center font-bold">
                                                {t('accounting.journal_entries.total')}
                                            </td>
                                            <td className="text-center text-[#10B981] text-md font-bold">
                                                {formatCurrency(totalDebit, 'EGP')}
                                            </td>
                                            <td className="text-center text-[#10B981] text-md font-bold">
                                                {formatCurrency(totalCredit, 'EGP')}
                                            </td>
                                            <td className="bg-white"></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* bottom inputs */}
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-gray-600 px-1">{t('accounting.journal_entries.attachments')}</label>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*,application/pdf"
                                        className="hidden"
                                    />
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="h-[120px] border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50/50 transition-colors bg-gray-50/20 group"
                                    >
                                        <div className="mb-2 text-gray-300 group-hover:text-indigo-400 transition-colors">
                                            <Upload size={32} />
                                        </div>
                                        <p className="text-[#4F46E5] font-bold text-sm">{t('accounting.journal_entries.drag_drop')}</p>
                                    </div>
                                    {attachments.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {attachments.map((file, index) => (
                                                <span key={index} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-100">
                                                    {file.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-gray-600 px-1">{t('accounting.journal_entries.description')}</label>
                                    <textarea
                                        rows={4}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 text-start resize-none bg-gray-50/20"
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-5 border-t border-gray-100 flex items-center gap-3 justify-end bg-white">
                            <button
                                onClick={handleModalClose}
                                disabled={loading}
                                className="px-8 py-2 bg-white border border-gray-300 text-gray-600 font-bold rounded-md hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                            >
                                {t('sales.common.cancel')}
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-8 py-2 bg-[#10B981] text-white font-bold rounded-md hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50"
                            >
                                {loading ? t('sales.common.loading', 'Loading...') : t('sales.common.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Description Sub-Modal */}
            {isDescModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[1px]">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                            <span className="font-bold text-gray-700">{t('accounting.journal_entries.description')}</span>
                            <button onClick={() => setIsDescModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-4">
                            <textarea
                                rows={4}
                                autoFocus
                                value={tempDescription}
                                onChange={(e) => setTempDescription(e.target.value)}
                                className="w-full p-3 border border-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700 text-start resize-none"
                            ></textarea>
                        </div>
                        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                            <button
                                onClick={() => setIsDescModalOpen(false)}
                                className="px-4 py-1.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition"
                            >
                                {t('sales.common.cancel')}
                            </button>
                            <button
                                onClick={saveDescription}
                                className="px-6 py-1.5 bg-[#4F46E5] text-white text-sm font-bold rounded hover:bg-indigo-700 transition shadow-sm"
                            >
                                {t('sales.common.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Journal Entry Details Modal - matches reference screen, fully editable */}
            {viewingEntry && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[1px]" dir={isRTL ? 'rtl' : 'ltr'}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[1100px] overflow-hidden flex flex-col max-h-[95vh]">
                        {/* Header: Close (top-left) | Title centered | Share (orange), PDF, Print | User, Document, Source (gray / light blue) */}
                        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-gray-100">
                            <button onClick={closeViewModal} className="text-gray-400 hover:text-gray-600 transition p-1 order-first">
                                <X size={24} />
                            </button>
                            <h2 className="text-xl font-bold text-gray-800 flex-1 text-center">{t('accounting.journal_entries.view_entry')}</h2>
                            <div className="flex items-center gap-2 order-3 w-full sm:w-auto sm:order-none">
                                <button type="button" onClick={handleShare} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 transition">
                                    <Share2 size={18} />
                                    {t('accounting.journal_entries.share')}
                                </button>
                                <button type="button" onClick={handleDownloadPdf} disabled={pdfLoading} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 transition disabled:opacity-60">
                                    <FileText size={18} />
                                    {t('accounting.journal_entries.pdf')}
                                </button>
                                <button type="button" onClick={handlePrintPdf} disabled={pdfLoading} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-100 transition disabled:opacity-60">
                                    <Printer size={18} />
                                    {t('accounting.journal_entries.print')}
                                </button>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="px-3 py-2 rounded-lg bg-gray-100 border border-gray-200">
                                    <span className="text-xs font-bold text-gray-500 uppercase block">{t('accounting.journal_entries.user')}</span>
                                    <p className="text-sm text-gray-800">—</p>
                                </div>
                                <div className="px-3 py-2 rounded-lg bg-gray-100 border border-gray-200">
                                    <span className="text-xs font-bold text-gray-500 uppercase block">{t('accounting.journal_entries.document')}</span>
                                    <p className="text-sm text-gray-800">—</p>
                                </div>

                            </div>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {/* Info banner */}
                            <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-blue-50 border border-blue-100 text-blue-800 text-sm">
                                <Info size={18} className="shrink-0 mt-0.5" />
                                <span>{t('accounting.journal_entries.auto_entry_info')}</span>
                            </div>
                            {/* Number & Date - editable */}
                            <div className="grid grid-cols-2 gap-6 mb-4">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-gray-600">{t('accounting.journal_entries.daily_entry_number')}</label>
                                    <input
                                        type="text"
                                        value={viewForm.number}
                                        onChange={(e) => setViewForm(prev => ({ ...prev, number: e.target.value }))}
                                        className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 font-medium outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-gray-600">{t('accounting.journal_entries.date')}</label>
                                    <div className="flex items-center bg-white border border-gray-200 rounded-lg h-11 px-3 gap-2">
                                        <Calendar size={18} className="text-gray-400 shrink-0" />
                                        <input
                                            ref={viewDateInputRef}
                                            type="date"
                                            value={viewForm.date}
                                            onChange={(e) => setViewForm(prev => ({ ...prev, date: e.target.value }))}
                                            className="flex-1 bg-transparent outline-none text-gray-700 font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Entries table: editable rows with Add / Remove / Totals */}
                            <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
                                <table className="w-full border-collapse text-sm">
                                    <thead className="bg-gray-50/50 border-b border-gray-200">
                                        <tr className="text-gray-600 font-bold">
                                            <th className="w-10 py-3"></th>
                                            <th className="px-4 py-3 text-start"><span className="text-red-500">*</span> {t('accounting.journal_entries.account')}</th>
                                            <th className="px-4 py-3 text-start w-[35%]">{t('accounting.journal_entries.description')}</th>
                                            <th className="px-4 py-3 text-center w-28">{t('accounting.journal_entries.debit')}</th>
                                            <th className="px-4 py-3 text-center w-28">{t('accounting.journal_entries.credit')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {viewForm.rows.map((row) => (
                                            <tr key={row.id} className="h-12 text-gray-700">
                                                <td className="bg-gray-50/30 w-10 text-center align-middle">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeViewRow(row.id)}
                                                        disabled={viewForm.rows.length <= 1}
                                                        className="inline-flex w-5 h-5 rounded-full bg-red-500 text-white items-center justify-center hover:bg-red-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                                    >
                                                        <Minus size={12} strokeWidth={4} />
                                                    </button>
                                                </td>
                                                <td className="p-0 border-x border-gray-100 relative bg-white">
                                                    <div className="relative flex-1 flex items-center w-full h-11 px-3">
                                                        <select
                                                            value={row.account}
                                                            onChange={(e) => handleViewRowChange(row.id, 'account', e.target.value)}
                                                            className="w-full h-11 bg-transparent outline-none text-gray-600 appearance-none text-start pr-8 border-0"
                                                        >
                                                            <option value="">{t('accounting.journal_entries.choose_account')}</option>
                                                            <option value="1211">{t('accounting.journal_entries.accounts.main_treasury')} #1211</option>
                                                            <option value="1221">{t('accounting.journal_entries.accounts.main_bank_account')} #1221</option>
                                                            <option value="1251">{t('accounting.journal_entries.accounts.main_warehouse')} #1251</option>
                                                            <option value="12610001">{t('accounting.journal_entries.accounts.other_customers')} #12610001</option>
                                                            <option value="1262">{t('accounting.journal_entries.accounts.other_debit_parties')} #1262</option>
                                                            <option value="127">{t('accounting.journal_entries.accounts.cash_shortage_excess')} #127</option>
                                                            <option value="128">{t('accounting.journal_entries.accounts.currency_exchange')} #128</option>
                                                            <option value="129">{t('accounting.journal_entries.accounts.purchases_under_receipt')} #129</option>
                                                            <option value="21110001">{t('accounting.journal_entries.accounts.other_suppliers')} #21110001</option>
                                                            <option value="2112">{t('accounting.journal_entries.accounts.other_credit_parties')} #2112</option>
                                                            <option value="213">{t('accounting.journal_entries.accounts.opening_balances')} #213</option>
                                                            <option value="2141">{t('accounting.journal_entries.accounts.vat_paid')} #2141</option>
                                                            <option value="2142">{t('accounting.journal_entries.accounts.vat_collected')} #2142</option>
                                                            <option value="31">{t('accounting.journal_entries.accounts.capital')} #31</option>
                                                            <option value="32">{t('accounting.journal_entries.accounts.retained_earnings')} #32</option>
                                                            <option value="411">{t('accounting.journal_entries.accounts.sales')} #411</option>
                                                            <option value="412">{t('accounting.journal_entries.accounts.sales_returns')} #412</option>
                                                            <option value="421">{t('accounting.journal_entries.accounts.other_income')} #421</option>
                                                            <option value="422">{t('accounting.journal_entries.accounts.capital_gains_losses')} #422</option>
                                                            <option value="423">{t('accounting.journal_entries.accounts.purchases_settlement')} #423</option>
                                                            <option value="511">{t('accounting.journal_entries.accounts.purchases')} #511</option>
                                                            <option value="512">{t('accounting.journal_entries.accounts.purchases_returns')} #512</option>
                                                            <option value="521">{t('accounting.journal_entries.accounts.cost_of_goods_sold')} #521</option>
                                                            <option value="523">{t('accounting.journal_entries.accounts.sales_settlement')} #523</option>
                                                            <option value="5301">{t('accounting.journal_entries.accounts.rent')} #5301</option>
                                                            <option value="5302">{t('accounting.journal_entries.accounts.electricity')} #5302</option>
                                                            <option value="5303">{t('accounting.journal_entries.accounts.phone_internet')} #5303</option>
                                                            <option value="5304">{t('accounting.journal_entries.accounts.maintenance')} #5304</option>
                                                            <option value="5305">{t('accounting.journal_entries.accounts.water')} #5305</option>
                                                            <option value="5306">{t('accounting.journal_entries.accounts.government_fees')} #5306</option>
                                                            <option value="541">{t('accounting.journal_entries.accounts.bad_debts')} #541</option>
                                                            <option value="542">{t('accounting.journal_entries.accounts.inventory_shortage_excess')} #542</option>
                                                            <option value="543">{t('accounting.journal_entries.accounts.other_expenses')} #543</option>
                                                        </select>
                                                    </div>
                                                </td>
                                                <td className="p-0 border-e border-gray-100">
                                                    <input
                                                        type="text"
                                                        value={row.description}
                                                        onChange={(e) => handleViewRowChange(row.id, 'description', e.target.value)}
                                                        className="w-full h-11 px-3 bg-transparent outline-none text-gray-700 text-start border-0"
                                                    />
                                                </td>
                                                <td className="p-0 border-e border-gray-100">
                                                    <input
                                                        type="text"
                                                        value={row.debit}
                                                        onChange={(e) => handleViewRowChange(row.id, 'debit', e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-full h-11 px-3 bg-transparent outline-none text-center text-gray-700 font-medium border-0"
                                                    />
                                                </td>
                                                <td className="p-0 border-e border-gray-100">
                                                    <input
                                                        type="text"
                                                        value={row.credit}
                                                        onChange={(e) => handleViewRowChange(row.id, 'credit', e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-full h-11 px-3 bg-transparent outline-none text-center text-gray-700 font-medium border-0"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50/50 font-bold border-t border-gray-200">
                                        <tr className="h-12 text-gray-700">
                                            <td className="bg-white w-10"></td>
                                            <td className="px-4 bg-white">
                                                <button type="button" onClick={addViewRow} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#4F46E5] text-white hover:bg-indigo-700 transition font-bold text-sm">
                                                    <Plus size={16} strokeWidth={3} />
                                                    {t('topbar.add')}
                                                </button>
                                            </td>
                                            <td className="px-4 bg-white text-center font-bold">{t('accounting.journal_entries.total')}</td>
                                            <td className="text-center text-[#10B981] text-md font-bold">{formatCurrency(viewTotalDebit, 'EGP')}</td>
                                            <td className="text-center text-[#10B981] text-md font-bold">{formatCurrency(viewTotalCredit, 'EGP')}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            {/* Attachments + Description */}
                            <div className="grid grid-cols-2 gap-8 mb-6">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-gray-600">{t('accounting.journal_entries.attachments')}</label>
                                    <input type="file" ref={viewFileInputRef} onChange={handleViewFileChange} accept="image/*,application/pdf" className="hidden" />
                                    <div
                                        onClick={() => viewFileInputRef.current?.click()}
                                        className="h-[120px] border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50/50 transition bg-gray-50/20"
                                    >
                                        {(viewingEntry.attachment && viewForm.attachments.length === 0) ? (
                                            <a href={viewingEntry.attachment} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-semibold" onClick={(e) => e.stopPropagation()}>
                                                {t('accounting.journal_entries.download')}
                                            </a>
                                        ) : viewForm.attachments.length > 0 ? (
                                            <span className="text-sm text-indigo-600 font-semibold">{viewForm.attachments[0].name}</span>
                                        ) : (
                                            <>
                                                <Upload size={32} className="mb-2 text-gray-300" />
                                                <p className="text-[#4F46E5] font-bold text-sm">{t('accounting.journal_entries.drag_drop')}</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-gray-600">{t('accounting.journal_entries.description')}</label>
                                    <textarea
                                        rows={4}
                                        value={viewForm.description}
                                        onChange={(e) => setViewForm(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full p-4 border border-gray-200 rounded-lg text-gray-700 text-start resize-none bg-gray-50/20 outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>
                        {/* Footer: green Save - calls API */}
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-start">
                            <button
                                onClick={handleSaveFromView}
                                disabled={viewSaveLoading}
                                className="px-8 py-2 bg-[#10B981] text-white font-bold rounded-md hover:bg-emerald-600 transition disabled:opacity-50"
                            >
                                {viewSaveLoading ? t('sales.common.loading', 'Loading...') : t('sales.common.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmDeleteModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, entryId: null })}
                onConfirm={confirmDelete}
                loading={deleteLoading}
            />
        </div>
    );
};

export default JournalEntries;
