import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, RefreshCw, X, Circle } from 'lucide-react';

const DashboardPage = () => {
    const { t } = useTranslation();

    const SummaryCard = ({ title, amount }) => (
        <div className="bg-white px-4 py-5 sm:p-6 rounded-lg shadow border border-gray-200 flex flex-col justify-between">
            <h3 className="text-base font-normal text-gray-900">{title}</h3>
            <div className="mt-1 flex items-baseline justify-between md:block lg:flex">
                <div className="text-2xl font-semibold text-indigo-600">
                    {amount}
                </div>
            </div>
        </div>
    );

    const ActivityCard = ({ title, emptyText }) => (
        <div className="overflow-hidden rounded-lg bg-white border border-gray-200 shadow">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-4 sm:px-6">
                <h3 className="text-base font-semibold leading-6 text-gray-900">{title}</h3>
                <span className="inline-flex items-center gap-x-1.5 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                    <Circle size={6} className="fill-green-500" /> {t('dashboard.live')}
                </span>
            </div>
            <div className="text-sm text-center p-5">
                {emptyText}
            </div>
        </div>
    );

    return (
        <div className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex justify-between items-center">
                    {/* Breadcrumbs or Title could go here based on HTML but HTML shows breadcrumbs. 
                       For now keeping minimal or empty if not in HTML body provided fully (HTML had breadcrumbs). 
                       User provided body has breadcrumbs. I will omit breadcrumbs implementation for now as it's complex 
                       and focus on the main content structure as requested. */}
                </div>

                {/* Info Banner - Invoice Templates */}
                <div className="relative rounded-md bg-blue-50 p-4 shadow">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <FileText className="h-7 w-7 text-blue-400" />
                        </div>
                        <div className="ms-3">
                            <h3 className="text-sm font-medium text-blue-800">{t('dashboard.invoice_templates')}</h3>
                            <div className="mt-2 text-sm text-blue-700">
                                <p>
                                    {t('dashboard.invoice_templates_desc')}
                                </p>
                            </div>
                        </div>
                    </div>
                    <button type="button" className="absolute end-2 top-2 rounded-md bg-blue-50 p-1.5 text-blue-500 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-blue-50">
                        <X size={20} />
                    </button>
                </div>

                {/* Time Filter & Update Info */}
                <div>
                    <div className="flex items-end">
                        <div className="text-base font-semibold leading-6 text-gray-900">{t('dashboard.last_30_days')}</div>
                        <div className="ms-2 text-xs text-gray-600">{t('dashboard.last_update')} {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <button type="button" className="ms-1">
                            <RefreshCw size={16} className="text-gray-500" />
                        </button>
                    </div>

                    {/* Summary Cards Grid */}
                    <dl className="mt-3 grid grid-cols-1 divide-y divide-gray-300 overflow-hidden rounded-lg bg-white border border-gray-200 shadow md:grid-cols-3 md:divide-x rtl:md:divide-x-reverse md:divide-y-0">
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-base font-normal text-gray-900">{t('dashboard.sales')}</dt>
                            <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
                                <div className="flex items-baseline text-2xl font-semibold text-indigo-600">0.00 EGP</div>
                            </dd>
                        </div>
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-base font-normal text-gray-900">{t('dashboard.client_payments')}</dt>
                            <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
                                <div className="flex items-baseline text-2xl font-semibold text-indigo-600">0.00 EGP</div>
                            </dd>
                        </div>
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-base font-normal text-gray-900">{t('dashboard.profit')}</dt>
                            <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
                                <div className="flex items-baseline text-2xl font-semibold text-indigo-600">0.00 EGP</div>
                            </dd>
                        </div>
                    </dl>
                </div>

                {/* Combined Grid for Activity & Low Stock */}
                <div className="grid gap-5 lg:grid-cols-3">
                    <ActivityCard
                        title={t('dashboard.latest_invoices')}
                        emptyText={t('dashboard.no_invoices')}
                    />
                    <ActivityCard
                        title={t('dashboard.latest_clients')}
                        emptyText={t('dashboard.no_clients')}
                    />
                    <ActivityCard
                        title={t('dashboard.latest_client_payments')}
                        emptyText={t('dashboard.no_client_payments')}
                    />

                    {/* Low Stock Section - Spans 2 cols */}
                    <div className="overflow-hidden rounded-lg bg-white border border-gray-200 shadow lg:col-span-2">
                        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-4 sm:px-6">
                            <h3 className="text-base font-semibold leading-6 text-gray-900">{t('dashboard.low_inventory')}</h3>
                        </div>
                        <div className="text-sm text-center p-5">
                            {t('dashboard.no_low_inventory')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
