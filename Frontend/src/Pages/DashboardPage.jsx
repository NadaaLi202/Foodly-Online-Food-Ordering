import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, RefreshCw, X, Circle } from 'lucide-react';
import { formatCurrency } from '../utils/currencyformatter';
import api from '../services/api';
import { useAuth } from '../context/authcontext';

/* ─── helpers ──────────────────────────────────────────────── */

/** Return { startDate, endDate } for the last N days as ISO strings */
const last30Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
    };
};

/** Format a date string to Arabic-friendly short date */
const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
};

/** Silently ignore 403 — return null; rethrow everything else */
const silentFetch = async (promise) => {
    try {
        return await promise;
    } catch (err) {
        if (err.response?.status === 403) return null;
        throw err;
    }
};

/* ─── sub-components ────────────────────────────────────────── */

const Skeleton = ({ rows = 1, className = '' }) => (
    <div className={`space-y-2 ${className}`}>
        {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded animate-pulse w-full" />
        ))}
    </div>
);

const WidgetError = ({ message = 'تعذر تحميل البيانات' }) => (
    <div className="text-sm text-center p-5 text-red-400">{message}</div>
);

const EmptyState = ({ text }) => (
    <div className="text-sm text-center p-5 text-gray-400">{text}</div>
);

const StatusBadge = ({ status }) => {
    const map = {
        paid: { label: 'مدفوعة', color: 'bg-green-100 text-green-700' },
        unpaid: { label: 'غير مدفوعة', color: 'bg-orange-100 text-orange-700' },
        partial: { label: 'جزئي', color: 'bg-yellow-100 text-yellow-700' },
        draft: { label: 'مسودة', color: 'bg-gray-100 text-gray-600' },
    };
    const s = map[status] ?? { label: status ?? '—', color: 'bg-gray-100 text-gray-600' };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${s.color}`}>
            {s.label}
        </span>
    );
};

/* ─── main component ────────────────────────────────────────── */

const DashboardPage = () => {
    const { t } = useTranslation();
    const { companySettings } = useAuth();
    const currency = companySettings?.currency || 'EGP';

    /* ── state ── */
    const [dismissBanner, setDismissBanner] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);

    // Summary cards
    const [salesTotal, setSalesTotal] = useState(0);
    const [paymentsTotal, setPaymentsTotal] = useState(0);
    const [profit, setProfit] = useState(0);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState(false);

    // Latest invoices
    const [invoices, setInvoices] = useState([]);
    const [invoicesLoading, setInvoicesLoading] = useState(true);
    const [invoicesError, setInvoicesError] = useState(false);

    // New clients
    const [clients, setClients] = useState([]);
    const [clientsLoading, setClientsLoading] = useState(true);
    const [clientsError, setClientsError] = useState(false);

    // Latest payments
    const [payments, setPayments] = useState([]);
    const [paymentsLoading, setPaymentsLoading] = useState(true);
    const [paymentsError, setPaymentsError] = useState(false);

    // Low stock
    const [lowStock, setLowStock] = useState([]);
    const [lowStockLoading, setLowStockLoading] = useState(true);
    const [lowStockError, setLowStockError] = useState(false);

    /* ── fetch functions ── */

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        setStatsError(false);
        try {
            const { startDate, endDate } = last30Days();

            const [invRes, payRes] = await Promise.allSettled([
                silentFetch(api.get('/transactions/sales/invoices', { params: { dateFrom: startDate, dateTo: endDate, limit: 500, page: 1 } })),
                silentFetch(api.get('/payments/sales', { params: { dateFrom: startDate, dateTo: endDate, limit: 500, page: 1 } })),
            ]);

            // Sales = sum of transaction totals
            const invList = invRes.status === 'fulfilled' && invRes.value
                ? (invRes.value.data?.data ?? [])
                : [];
            const totalSales = invList.reduce((acc, inv) => acc + (inv.totalAmount ?? 0), 0);

            // Payments = sum of received payment amounts
            const payList = payRes.status === 'fulfilled' && payRes.value
                ? (payRes.value.data?.payments ?? [])
                : [];
            const totalPayments = payList
                .filter(p => p.operationType === 'receive')
                .reduce((acc, p) => acc + (p.amount ?? 0), 0);

            setSalesTotal(totalSales);
            setPaymentsTotal(totalPayments);
            setProfit(totalSales - totalPayments);
        } catch {
            setStatsError(true);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    const fetchInvoices = useCallback(async () => {
        setInvoicesLoading(true);
        setInvoicesError(false);
        try {
            const res = await silentFetch(api.get('/transactions/sales/invoices', { params: { limit: 5, page: 1 } }));
            setInvoices(res ? (res.data?.data ?? []) : []);
        } catch {
            setInvoicesError(true);
        } finally {
            setInvoicesLoading(false);
        }
    }, []);

    const fetchClients = useCallback(async () => {
        setClientsLoading(true);
        setClientsError(false);
        try {
            const res = await silentFetch(api.get('/contacts/customers', { params: { limit: 5 } }));
            const list = res ? (res.data?.contacts ?? res.data?.data ?? []) : [];
            // sort by createdAt desc, take 5
            const sorted = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
            setClients(sorted);
        } catch {
            setClientsError(true);
        } finally {
            setClientsLoading(false);
        }
    }, []);

    const fetchPayments = useCallback(async () => {
        setPaymentsLoading(true);
        setPaymentsError(false);
        try {
            const res = await silentFetch(api.get('/payments/sales', { params: { limit: 5, page: 1 } }));
            setPayments(res ? (res.data?.payments ?? []) : []);
        } catch {
            setPaymentsError(true);
        } finally {
            setPaymentsLoading(false);
        }
    }, []);

    const fetchLowStock = useCallback(async () => {
        setLowStockLoading(true);
        setLowStockError(false);
        try {
            const res = await silentFetch(api.get('/products'));
            const all = res ? (res.data?.products ?? []) : [];
            const low = all.filter(p =>
                p.type === 'tracked' &&
                (p.lowStockThreshold > 0) &&
                (p.stockQuantity <= p.lowStockThreshold)
            );
            setLowStock(low);
        } catch {
            setLowStockError(true);
        } finally {
            setLowStockLoading(false);
        }
    }, []);

    const fetchAll = useCallback(async () => {
        await Promise.allSettled([
            fetchStats(),
            fetchInvoices(),
            fetchClients(),
            fetchPayments(),
            fetchLowStock(),
        ]);
        setLastUpdated(new Date());
    }, [fetchStats, fetchInvoices, fetchClients, fetchPayments, fetchLowStock]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    /* ── render helpers ── */

    const fmtLastUpdated = () => {
        if (!lastUpdated) return '';
        return lastUpdated.toLocaleDateString('ar-EG') + ' ' +
            lastUpdated.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    };

    /* ── render ── */

    return (
        <div className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">

                {/* ── Info Banner ── */}
                {!dismissBanner && (
                    <div className="relative rounded-md bg-blue-50 p-4 shadow">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <FileText className="h-7 w-7 text-blue-400" />
                            </div>
                            <div className="ms-3">
                                <h3 className="text-sm font-medium text-blue-800">{t('dashboard.invoice_templates')}</h3>
                                <div className="mt-2 text-sm text-blue-700">
                                    <p>{t('dashboard.invoice_templates_desc')}</p>
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setDismissBanner(true)}
                            className="absolute end-2 top-2 rounded-md bg-blue-50 p-1.5 text-blue-500 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-blue-50"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}

                {/* ── Time Filter & Refresh ── */}
                <div>
                    <div className="flex items-center flex-wrap gap-2">
                        <div className="text-base font-semibold leading-6 text-gray-900">{t('dashboard.last_30_days')}</div>
                        <div className="ms-2 text-xs text-gray-600">
                            {lastUpdated
                                ? <>{t('dashboard.last_update')} {fmtLastUpdated()}</>
                                : <span className="inline-block w-32 h-3 bg-gray-200 rounded animate-pulse" />
                            }
                        </div>
                        <button
                            type="button"
                            onClick={fetchAll}
                            className="ms-1 hover:text-indigo-600 transition-colors"
                            title="تحديث البيانات"
                        >
                            <RefreshCw size={16} className="text-gray-500" />
                        </button>
                    </div>

                    {/* ── Summary Cards ── */}
                    <dl className="mt-3 grid grid-cols-1 divide-y divide-gray-300 overflow-hidden rounded-lg bg-white border border-gray-200 shadow md:grid-cols-3 md:divide-x rtl:md:divide-x-reverse md:divide-y-0">
                        {/* Sales */}
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-base font-normal text-gray-900">{t('dashboard.sales')}</dt>
                            <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
                                <div className="flex items-baseline text-2xl font-semibold text-indigo-600">
                                    {statsLoading
                                        ? <span className="h-7 w-28 bg-gray-200 rounded animate-pulse inline-block" />
                                        : statsError
                                            ? <span className="text-red-400 text-sm">تعذر التحميل</span>
                                            : formatCurrency(salesTotal, currency)
                                    }
                                </div>
                            </dd>
                        </div>

                        {/* Payments */}
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-base font-normal text-gray-900">{t('dashboard.client_payments')}</dt>
                            <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
                                <div className="flex items-baseline text-2xl font-semibold text-indigo-600">
                                    {statsLoading
                                        ? <span className="h-7 w-28 bg-gray-200 rounded animate-pulse inline-block" />
                                        : statsError
                                            ? <span className="text-red-400 text-sm">تعذر التحميل</span>
                                            : formatCurrency(paymentsTotal, currency)
                                    }
                                </div>
                            </dd>
                        </div>

                        {/* Profit */}
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-base font-normal text-gray-900">{t('dashboard.profit')}</dt>
                            <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
                                <div className={`flex items-baseline text-2xl font-semibold ${profit >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>
                                    {statsLoading
                                        ? <span className="h-7 w-28 bg-gray-200 rounded animate-pulse inline-block" />
                                        : statsError
                                            ? <span className="text-red-400 text-sm">تعذر التحميل</span>
                                            : formatCurrency(profit, currency)
                                    }
                                </div>
                            </dd>
                        </div>
                    </dl>
                </div>

                {/* ── Activity Widgets Grid ── */}
                <div className="grid gap-5 lg:grid-cols-3">

                    {/* Widget: Latest Invoices */}
                    <div className="overflow-hidden rounded-lg bg-white border border-gray-200 shadow">
                        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-4 sm:px-6">
                            <h3 className="text-base font-semibold leading-6 text-gray-900">{t('dashboard.latest_invoices')}</h3>
                            <span className="inline-flex items-center gap-x-1.5 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                                <Circle size={6} className="fill-green-500" /> {t('dashboard.live')}
                            </span>
                        </div>
                        {invoicesLoading ? (
                            <div className="p-5"><Skeleton rows={4} /></div>
                        ) : invoicesError ? (
                            <WidgetError />
                        ) : invoices.length === 0 ? (
                            <EmptyState text={t('dashboard.no_invoices')} />
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {invoices.map((inv) => (
                                    <div key={inv._id} className="px-4 py-3 flex items-center justify-between gap-2 hover:bg-gray-50 transition-colors">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-bold text-indigo-700 truncate">{inv.transactionNumber ?? '—'}</span>
                                            <span className="text-xs text-gray-500 truncate">{inv.contact?.name ?? '—'}</span>
                                        </div>
                                        <div className="flex flex-col items-end shrink-0 gap-1">
                                            <span className="text-sm font-bold text-gray-800">{formatCurrency(inv.totalAmount ?? 0, inv.currency || currency)}</span>
                                            <StatusBadge status={inv.status} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Widget: New Clients */}
                    <div className="overflow-hidden rounded-lg bg-white border border-gray-200 shadow">
                        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-4 sm:px-6">
                            <h3 className="text-base font-semibold leading-6 text-gray-900">{t('dashboard.latest_clients')}</h3>
                            <span className="inline-flex items-center gap-x-1.5 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                                <Circle size={6} className="fill-green-500" /> {t('dashboard.live')}
                            </span>
                        </div>
                        {clientsLoading ? (
                            <div className="p-5"><Skeleton rows={4} /></div>
                        ) : clientsError ? (
                            <WidgetError />
                        ) : clients.length === 0 ? (
                            <EmptyState text={t('dashboard.no_clients')} />
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {clients.map((c) => (
                                    <div key={c._id} className="px-4 py-3 flex items-center justify-between gap-2 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                                                {(c.name ?? '?').charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-sm font-bold text-gray-800 truncate">{c.name ?? '—'}</span>
                                        </div>
                                        <span className="text-xs text-gray-400 shrink-0">{fmtDate(c.createdAt)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Widget: Latest Payments */}
                    <div className="overflow-hidden rounded-lg bg-white border border-gray-200 shadow">
                        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-4 sm:px-6">
                            <h3 className="text-base font-semibold leading-6 text-gray-900">{t('dashboard.latest_client_payments')}</h3>
                            <span className="inline-flex items-center gap-x-1.5 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                                <Circle size={6} className="fill-green-500" /> {t('dashboard.live')}
                            </span>
                        </div>
                        {paymentsLoading ? (
                            <div className="p-5"><Skeleton rows={4} /></div>
                        ) : paymentsError ? (
                            <WidgetError />
                        ) : payments.length === 0 ? (
                            <EmptyState text={t('dashboard.no_client_payments')} />
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {payments.map((p) => (
                                    <div key={p._id} className="px-4 py-3 flex items-center justify-between gap-2 hover:bg-gray-50 transition-colors">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-bold text-gray-800 truncate">
                                                {p.contact?.name ?? '—'}
                                            </span>
                                            <span className="text-xs text-gray-400">{fmtDate(p.date)}</span>
                                        </div>
                                        <span className="text-sm font-bold text-green-600 shrink-0">
                                            {formatCurrency(p.amount ?? 0, p.currency || currency)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Widget: Low Stock — spans 2 cols */}
                    <div className="overflow-hidden rounded-lg bg-white border border-gray-200 shadow lg:col-span-2">
                        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-4 sm:px-6">
                            <h3 className="text-base font-semibold leading-6 text-gray-900">{t('dashboard.low_inventory')}</h3>
                        </div>
                        {lowStockLoading ? (
                            <div className="p-5"><Skeleton rows={4} /></div>
                        ) : lowStockError ? (
                            <WidgetError />
                        ) : lowStock.length === 0 ? (
                            <EmptyState text={t('dashboard.no_low_inventory')} />
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {lowStock.map((p) => {
                                    const critical = p.stockQuantity === 0;
                                    return (
                                        <div key={p._id} className="px-4 py-3 flex items-center justify-between gap-2 hover:bg-gray-50 transition-colors">
                                            <span className="text-sm font-bold text-gray-800 truncate min-w-0">{p.name}</span>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className="text-xs text-gray-400">
                                                    الحد الأدنى: <span className="font-bold text-gray-600">{p.lowStockThreshold}</span>
                                                </span>
                                                <span className={`text-sm font-black px-2 py-0.5 rounded-full ${critical ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {p.stockQuantity}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
