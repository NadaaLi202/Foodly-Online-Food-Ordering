import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, RefreshCw, LayoutGrid } from 'lucide-react';

const Expenses = () => {
    const { t } = useTranslation();

    return (
        <div className="container mx-auto px-6 py-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div />

            </div>



            <div className="mt-5">
                <button
                    className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none transition-colors"
                >
                    <LayoutGrid className="mx-auto h-12 w-12 text-gray-400" strokeWidth={1.5} />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                        {t('finance_page.no_expenses')}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {t('finance_page.start_expenses')}
                    </p>
                </button>
            </div>
        </div>
    );
};

export default Expenses;
