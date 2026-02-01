import React, { useState } from 'react';
import { X, Plus, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AddSupplierModal = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const [supplierType, setSupplierType] = useState('individual');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={onClose}
                ></div>

                {/* Modal Panel */}
                <div className="relative transform rounded-lg bg-gray-100 text-start shadow-xl transition-all w-full my-8 max-w-6xl z-10">

                    {/* Header */}
                    <div className="border-b border-gray-200 bg-white px-6 py-4 rounded-t-lg">
                        <div className="flex flex-wrap items-center justify-between sm:flex-nowrap">
                            <div>
                                <h3 className="text-lg font-medium leading-6 text-gray-900">
                                    {t('purchases.suppliers.add_title', 'Add Supplier')}
                                </h3>
                            </div>
                            <div className="flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="px-6 py-5 bg-gray-50 rounded-b-lg">
                        <form className="space-y-6 divide-y divide-gray-300">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                {/* Left Column: Basic Info */}
                                <div className="grid content-start grid-cols-1 sm:grid-cols-6 gap-y-2 gap-x-4">
                                    <div className="sm:col-span-3">
                                        <label className="block text-sm font-medium text-gray-700">
                                            {t('purchases.suppliers.type', 'Type')}
                                        </label>
                                        <div className="mt-2 flex items-center space-x-7 rtl:space-x-reverse">
                                            <div className="flex items-center">
                                                <input
                                                    id="individual"
                                                    name="type"
                                                    type="radio"
                                                    className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-transparent"
                                                    value="individual"
                                                    checked={supplierType === 'individual'}
                                                    onChange={() => setSupplierType('individual')}
                                                />
                                                <label htmlFor="individual" className="ms-2 block text-sm font-medium text-gray-700">
                                                    {t('purchases.suppliers.individual', 'Individual')}
                                                </label>
                                            </div>
                                            <div className="flex items-center">
                                                <input
                                                    id="company"
                                                    name="type"
                                                    type="radio"
                                                    className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-transparent"
                                                    value="company"
                                                    checked={supplierType === 'company'}
                                                    onChange={() => setSupplierType('company')}
                                                />
                                                <label htmlFor="company" className="ms-2 block text-sm font-medium text-gray-700">
                                                    {t('purchases.suppliers.company', 'Company')}
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="sm:col-span-6 xl:col-span-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('sales.common.code', 'Code')}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                disabled
                                                className="block w-full rounded-md border-gray-300 disabled:bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border text-gray-500"
                                                value="1-000001"
                                            />
                                            <div className="absolute inset-y-0 end-0 flex items-center pe-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4 cursor-pointer text-indigo-900">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"></path>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="sm:col-span-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('sales.common.name', 'Name')} <span className="font-bold text-red-600">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                                            />
                                        </div>
                                    </div>

                                    <div className="sm:col-span-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('sales.common.initial_balance', 'Initial Balance')}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                                            />
                                        </div>
                                    </div>

                                    <div className="sm:col-span-6">
                                        <label className="block text-sm font-medium text-gray-700">
                                            {t('sales.common.notes', 'Notes')}
                                        </label>
                                        <div className="mt-1">
                                            <textarea
                                                rows="3"
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Contact Details */}
                                <div className="grid content-start grid-cols-1 gap-y-2 gap-x-4 sm:grid-cols-6">
                                    <div className="sm:col-span-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-lg font-medium text-gray-900">
                                                {t('purchases.suppliers.contact_details', 'Contact Details')}
                                            </h3>
                                        </div>

                                        <div className="flex gap-x-5 mb-4">
                                            <div className="flex items-center">
                                                <input id="check_phone" type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" defaultChecked />
                                                <label htmlFor="check_phone" className="ms-1 block text-sm font-medium text-gray-700">
                                                    {t('sales.common.phone', 'Phone')}
                                                </label>
                                            </div>
                                            <div className="flex items-center">
                                                <input id="check_email" type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" defaultChecked />
                                                <label htmlFor="check_email" className="ms-1 block text-sm font-medium text-gray-700">
                                                    {t('sales.common.email', 'Email')}
                                                </label>
                                            </div>
                                            <div className="flex items-center">
                                                <input id="check_address" type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" defaultChecked />
                                                <label htmlFor="check_address" className="ms-1 block text-sm font-medium text-gray-700">
                                                    {t('sales.common.address', 'Address')}
                                                </label>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="sm:col-span-1">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.common.phone', 'Phone')}</label>
                                                <input type="tel" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                                            </div>
                                            <div className="sm:col-span-1">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.common.mobile', 'Mobile')}</label>
                                                <input type="tel" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.common.email', 'Email')}</label>
                                                <input type="email" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.common.address_line1', 'Address Line 1')}</label>
                                                <input type="text" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.common.address_line2', 'Address Line 2')}</label>
                                                <input type="text" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                                            </div>
                                            <div className="sm:col-span-1">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.common.district', 'District')}</label>
                                                <input type="text" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                                            </div>
                                            <div className="sm:col-span-1">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.common.city', 'City')}</label>
                                                <input type="text" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                                            </div>
                                            <div className="sm:col-span-1">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.common.postal_code', 'Postal Code')}</label>
                                                <input type="text" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                                            </div>
                                            <div className="sm:col-span-1">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.common.state', 'State')}</label>
                                                <input type="text" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                                            </div>
                                            <div className="sm:col-span-1">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.common.country', 'Country')}</label>
                                                <div className="relative">
                                                    <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border bg-white appearance-none">
                                                        <option>{t('sales.common.choose_option', 'Choose an option')}</option>
                                                    </select>
                                                    <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center px-2 text-gray-500">
                                                        <ChevronDown size={14} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Contacts Button */}
                            <div className="pt-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    {t('purchases.suppliers.additional_contacts', 'Additional Contacts')}
                                </h3>
                                <button type="button" className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-indigo-700">
                                    <Plus className="-ms-0.5 me-2 h-4 w-4" />
                                    {t('purchases.suppliers.add_contact', 'Add New Contact')}
                                </button>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex gap-x-2 justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 shadow-sm hover:bg-gray-50 text-sm"
                                >
                                    {t('sales.common.cancel', 'Cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="inline-flex gap-1 rounded-md border border-transparent bg-emerald-500 px-4 py-2 font-medium text-white shadow-sm hover:bg-emerald-600 text-sm"
                                >
                                    {t('sales.common.save', 'Save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddSupplierModal;
