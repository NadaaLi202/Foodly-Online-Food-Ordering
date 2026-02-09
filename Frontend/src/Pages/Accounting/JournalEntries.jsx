import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/currencyFormatter';
import { Plus, Search, RefreshCw, X, Upload, Calendar, Edit3, Home, MoreVertical, ChevronsUpDown, Minus, ArrowRightLeft } from 'lucide-react';

const JournalEntries = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [entryNumber, setEntryNumber] = useState('26-1-000001');
    const [entryDate, setEntryDate] = useState('2026-01-29');
    const [description, setDescription] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [rows, setRows] = useState([
        { id: 1, account: '', description: '', debit: '', credit: '' },
        { id: 2, account: '', description: '', debit: '', credit: '' },
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [entries, setEntries] = useState([]);

    // Description Modal State
    const [isDescModalOpen, setIsDescModalOpen] = useState(false);
    const [currentDescRowId, setCurrentDescRowId] = useState(null);
    const [tempDescription, setTempDescription] = useState('');

    const filteredEntries = entries.filter(entry =>
        entry.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const dateInputRef = useRef(null);
    const fileInputRef = useRef(null);

    // Handle adding a new row
    const addRow = () => {
        setRows([...rows, { id: Date.now(), account: '', description: '', debit: '', credit: '' }]);
    };

    // Handle removing a row
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

    // Handle file selection
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setAttachments([...attachments, ...files]);
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
                    <button className="text-gray-400 hover:text-gray-600 transition-colors bg-white p-2 rounded-md border border-gray-100 shadow-sm">
                        <RefreshCw size={18} />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-[#4F46E5] text-white px-4 h-10 rounded-md hover:bg-indigo-700 transition-colors font-semibold shadow-sm text-sm"
                    >
                        <Plus size={18} strokeWidth={3} />
                        <span>{t('topbar.add')}</span>
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
                                    <th className="px-6 py-4">{t('accounting.journal_entries.entry_number')}</th>
                                    <th className="px-6 py-4">{t('accounting.journal_entries.date')}</th>
                                    <th className="px-6 py-4">{t('accounting.journal_entries.description')}</th>
                                    <th className="px-6 py-4 text-center">{t('accounting.journal_entries.total')}</th>
                                    <th className="px-6 py-4 text-center">{t('topbar.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredEntries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-6 py-4 text-indigo-600 font-bold">{entry.number}</td>
                                        <td className="px-6 py-4 text-gray-600">{entry.date}</td>
                                        <td className="px-6 py-4 text-gray-700">{entry.description}</td>
                                        <td className="px-6 py-4 text-center font-bold text-gray-900">{entry.total.toFixed(2)}</td>
                                        <td className="px-6 py-4 flex items-center justify-center gap-3">
                                            <button className="text-blue-500 hover:text-blue-700 font-bold">{t('accounting.chart_of_accounts.edit')}</button>
                                            <button className="text-red-500 hover:text-red-700 font-bold">{t('accounting.chart_of_accounts.delete')}</button>
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
                            <h2 className="text-xl font-bold text-gray-800">{t('accounting.journal_entries.add_entry')}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 overflow-y-auto flex-1 bg-white custom-scrollbar">

                            {/* Entry Info Row */}
                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-gray-600 px-1 text-start">{t('accounting.journal_entries.entry_number')}</label>
                                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg h-11 px-3 group">
                                        <div className="flex-1 flex items-center gap-2">
                                            <Edit3 size={18} className="text-indigo-500" />
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
                                        multiple
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
                                onClick={() => setIsModalOpen(false)}
                                className="px-8 py-2 bg-white border border-gray-300 text-gray-600 font-bold rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                {t('sales.common.cancel')}
                            </button>
                            <button className="px-8 py-2 bg-[#10B981] text-white font-bold rounded-md hover:bg-emerald-600 transition-colors shadow-sm">
                                {t('sales.common.save')}
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
        </div>
    );
};

export default JournalEntries;
