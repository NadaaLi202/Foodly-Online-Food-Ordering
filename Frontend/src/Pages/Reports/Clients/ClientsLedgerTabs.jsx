import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, PieChart } from 'lucide-react';
import SummaryCustomerReport from './SummaryCustomerReport';
import ClientGeneralLedger from './ClientGeneralLedger';

const ClientsLedgerTabs = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();

    // Determine active tab from URL
    const isLedger = location.pathname.includes('/general-ledger');
    const activeTab = isLedger ? 'ledger' : 'summary';

    const handleTabChange = (tab) => {
        if (tab === 'ledger') {
            navigate('/dashboard/reports/clients/general-ledger');
        } else {
            navigate('/dashboard/reports/clients/summary');
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Tabs Header */}
            <div className="bg-white border-b border-gray-200 px-6 pt-4 no-print">
                <div className="flex gap-1">
                    <button
                        onClick={() => handleTabChange('summary')}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2 ${
                            activeTab === 'summary'
                                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        } rounded-t-lg`}
                    >
                        <PieChart className="w-4 h-4" />
                        {t('reports.summary') || 'Summary'}
                    </button>
                    <button
                        onClick={() => handleTabChange('ledger')}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2 ${
                            activeTab === 'ledger'
                                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        } rounded-t-lg`}
                    >
                        <FileText className="w-4 h-4" />
                        {t('reports.clients.client_general_ledger') || 'كشف حساب العميل'}
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto">
                {activeTab === 'summary' ? <SummaryCustomerReport /> : <ClientGeneralLedger />}
            </div>
        </div>
    );
};

export default ClientsLedgerTabs;
