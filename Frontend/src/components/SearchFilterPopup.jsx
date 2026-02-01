import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

const SearchFilterPopup = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();

    const initialFilters = {
        number: '',
        status: '',
        supplier: '',
        product: '',
        payment_status: '',
        stock_movement_status: '',
        start_issue_date: '',
        end_issue_date: '',
        notes: '',
        line_item_description: ''
    };

    const [filters, setFilters] = useState(initialFilters);

    // Initialize filters from URL params when popup opens
    useEffect(() => {
        if (isOpen) {
            const currentFilters = { ...initialFilters };
            searchParams.forEach((value, key) => {
                if (key in currentFilters) {
                    currentFilters[key] = value;
                }
            });
            setFilters(currentFilters);
        }
    }, [isOpen, searchParams]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleReset = () => {
        setFilters(initialFilters);
        setSearchParams({}); // Clear URL params on reset
    };

    const handleApply = () => {
        const newParams = {};
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                newParams[key] = filters[key];
            }
        });
        setSearchParams(newParams);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with blur effect */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Popup Content */}
            <div className="relative w-full max-w-lg bg-white rounded-lg shadow-xl ring-1 ring-gray-900/5 overflow-hidden transform transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {t('sales.common.search_filter')}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Fields */}
                <div className="px-6 py-4 space-y-4 max-h-[80vh] overflow-y-auto">

                    {/* Number */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            {t('sales.common.number')}
                        </label>
                        <input
                            type="text"
                            name="number"
                            value={filters.number}
                            onChange={handleChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                        />
                    </div>

                    {/* Status */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            {t('sales.common.status')}
                        </label>
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border bg-white"
                        >
                            <option value="">{t('sales.common.unspecified')}</option>
                            <option value="draft">{t('sales.common.draft')}</option>
                            <option value="issued">{t('sales.common.issued')}</option>
                        </select>
                    </div>

                    {/* Supplier */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            {t('sales.common.supplier')}
                        </label>
                        <select
                            name="supplier"
                            value={filters.supplier}
                            onChange={handleChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border bg-white"
                        >
                            <option value="">{t('sales.common.unspecified')}</option>
                        </select>
                    </div>

                    {/* Product */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            {t('sales.common.product')}
                        </label>
                        <select
                            name="product"
                            value={filters.product}
                            onChange={handleChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border bg-white"
                        >
                            <option value="">{t('sales.common.unspecified')}</option>
                        </select>
                    </div>

                    {/* Payment Status */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            {t('sales.common.payment_status')}
                        </label>
                        <select
                            name="payment_status"
                            value={filters.payment_status}
                            onChange={handleChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border bg-white"
                        >
                            <option value="">{t('sales.common.unspecified')}</option>
                            <option value="unpaid">{t('sales.common.unpaid')}</option>
                            <option value="partially_paid">{t('sales.common.partially_paid_settled')}</option>
                            <option value="paid">{t('sales.common.paid_settled')}</option>
                        </select>
                    </div>

                    {/* Stock Movement Status */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            {t('sales.common.stock_movement_status')}
                        </label>
                        <select
                            name="stock_movement_status"
                            value={filters.stock_movement_status}
                            onChange={handleChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border bg-white"
                        >
                            <option value="">{t('sales.common.unspecified')}</option>
                            <option value="pending">{t('sales.common.receipt_pending')}</option>
                            <option value="partially_processed">{t('sales.common.partially_received')}</option>
                            <option value="processed">{t('sales.common.received')}</option>
                        </select>
                    </div>

                    {/* Start Issue Date */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            {t('sales.common.start_issue_date')}
                        </label>
                        <input
                            type="date"
                            name="start_issue_date"
                            value={filters.start_issue_date}
                            onChange={handleChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border bg-white"
                        />
                    </div>

                    {/* End Issue Date */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            {t('sales.common.end_issue_date')}
                        </label>
                        <input
                            type="date"
                            name="end_issue_date"
                            value={filters.end_issue_date}
                            onChange={handleChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border bg-white"
                        />
                    </div>

                    {/* Notes */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            {t('sales.common.notes')}
                        </label>
                        <input
                            type="text"
                            name="notes"
                            value={filters.notes}
                            onChange={handleChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                        />
                    </div>

                    {/* Line Item Description */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            {t('sales.common.line_item_description')}
                        </label>
                        <input
                            type="text"
                            name="line_item_description"
                            value={filters.line_item_description}
                            onChange={handleChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center gap-2 px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <button
                        onClick={handleReset}
                        className="rounded-md border border-transparent bg-red-500 px-4 py-2 font-medium text-white shadow-sm hover:bg-red-600 text-sm"
                    >
                        {t('sales.common.reset')}
                    </button>
                    <button
                        onClick={onClose}
                        className="ms-auto rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 shadow-sm hover:bg-gray-50 text-sm"
                    >
                        {t('sales.common.cancel')}
                    </button>
                    <button
                        onClick={handleApply}
                        className="rounded-md border border-transparent bg-emerald-500 px-4 py-2 font-medium text-white shadow-sm hover:bg-emerald-600 text-sm"
                    >
                        {t('sales.common.apply')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SearchFilterPopup;
