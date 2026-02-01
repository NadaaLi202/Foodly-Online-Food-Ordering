import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, RefreshCw, Info } from 'lucide-react';

const Transactions = () => {
    const { t } = useTranslation();

    return (
        <div className="container mx-auto px-6 py-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div />

            </div>



            <div className="bg-blue-50 border-l-4 rtl:border-r-4 rtl:border-l-0 border-blue-400 p-4 rounded-md">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <Info className="h-5 w-5 text-blue-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3 rtl:mr-3 rtl:ml-0">
                        <h3 className="text-sm font-medium text-blue-800">
                            {t('finance_page.no_transactions')}
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <p>
                                {t('finance_page.no_transactions_desc')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Transactions;
