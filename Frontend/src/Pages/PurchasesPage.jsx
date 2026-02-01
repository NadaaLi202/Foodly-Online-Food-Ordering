import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, RefreshCw, LayoutGrid } from 'lucide-react';

const PurchasesPage = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('supplier_payments'); // Default active as per original screenshot

    return (
        <div className="space-y-6">
            {/* Header and Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {/* Breadcrumb / Title could go here if needed, but per screenshot it's empty or implicit */}
                <div />
            </div>

            {/* Tabs & Filter Bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    {/* Tabs */}
                    <div className="flex items-center bg-gray-50 rounded-lg p-1 w-full md:w-auto">
                        <button
                            onClick={() => setActiveTab('purchases')}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'purchases'
                                ? 'bg-white text-gray-800 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {t('purchases_page.purchases')}
                        </button>
                        <button
                            onClick={() => setActiveTab('supplier_payments')}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'supplier_payments'
                                ? 'bg-white text-gray-800 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {t('purchases_page.supplier_payments')}
                        </button>
                        <div className="px-3 border-l rtl:border-r border-gray-200">
                            <div className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600">
                                <LayoutGrid size={20} />
                            </div>
                        </div>
                    </div>

                    <button className="p-2 text-gray-400 hover:text-gray-600 hidden md:block">
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* Empty State */}
            <div className="bg-white rounded-lg border-2 border-dashed border-gray-200 min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
                <div className="flex flex-col items-center gap-4 max-w-sm">
                    <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300">
                        <span className="text-3xl font-light">00</span>
                        <span className="text-xl align-top">+</span>
                    </div>
                    <h3 className="text-gray-800 font-bold text-lg">
                        {t('purchases_page.no_supplier_payments')}
                    </h3>
                    <p className="text-gray-500 text-sm">
                        {t('purchases_page.start_creating')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PurchasesPage;
