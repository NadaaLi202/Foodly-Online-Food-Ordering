import { ClipboardList, Package, RefreshCw, Users, WalletCards } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LoadingState from '../../components/food/LoadingState';
import { dashboardService } from '../../services/dashboardService';
import { getErrorMessage } from '../../services/api';
import { formatCurrency } from '../../utils/format';

const emptyStats = {
  totalOrders: 0,
  totalProducts: 0,
  totalUsers: 0,
  revenue: 0,
};

const AdminDashboardPage = () => {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await dashboardService.stats();
      setStats(data.stats || emptyStats);
    } catch (err) {
      setError(getErrorMessage(err, t('messages.statsLoadFailed')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const cards = [
    { label: t('admin.stats.orders'), value: stats.totalOrders ?? 0, icon: ClipboardList, color: 'text-orange-700 bg-orange-50' },
    { label: t('admin.stats.products'), value: stats.totalProducts ?? 0, icon: Package, color: 'text-emerald-700 bg-emerald-50' },
    { label: t('admin.stats.users'), value: stats.totalUsers ?? 0, icon: Users, color: 'text-cyan-700 bg-cyan-50' },
    // Revenue follows the backend aggregate: sum totalPrice across all orders, including non-delivered orders.
    { label: t('admin.stats.revenue'), value: formatCurrency(stats.revenue ?? 0, i18n.language), icon: WalletCards, color: 'text-rose-700 bg-rose-50' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-stone-950 sm:text-4xl">{t('admin.dashboard')}</h1>
        <p className="mt-2 text-stone-500">{t('admin.dashboardText')}</p>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-800">
          <p className="font-bold">{t('states.error')}</p>
          <p className="mt-1 text-sm">{error}</p>
          <button
            type="button"
            onClick={loadStats}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-red-700 px-4 text-sm font-bold text-white hover:bg-red-800"
          >
            <RefreshCw className="h-4 w-4" />
            {t('actions.retry')}
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <article key={card.label} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                <div className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-stone-500">{card.label}</p>
                <p className="mt-2 text-3xl font-black text-stone-950">{card.value}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Link to="/admin/products" className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm hover:border-orange-300">
              <h2 className="text-xl font-black text-stone-950">{t('admin.products')}</h2>
              <p className="mt-2 text-sm leading-6 text-stone-500">{t('admin.productsText')}</p>
            </Link>
            <Link to="/admin/orders" className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm hover:border-orange-300">
              <h2 className="text-xl font-black text-stone-950">{t('admin.orders')}</h2>
              <p className="mt-2 text-sm leading-6 text-stone-500">{t('admin.ordersText')}</p>
            </Link>
            <Link to="/admin/users" className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm hover:border-orange-300">
              <h2 className="text-xl font-black text-stone-950">{t('admin.users')}</h2>
              <p className="mt-2 text-sm leading-6 text-stone-500">{t('admin.usersText')}</p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;
