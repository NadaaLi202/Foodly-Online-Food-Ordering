import { ClipboardList, Package, Users, WalletCards } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LoadingState from '../../components/food/LoadingState';
import { dashboardService } from '../../services/dashboardService';
import { formatCurrency } from '../../utils/format';

const AdminDashboardPage = () => {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.stats()
      .then(({ data }) => setStats(data.stats))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingState />;
  }

  const cards = [
    { label: t('admin.stats.orders'), value: stats.totalOrders, icon: ClipboardList, color: 'text-orange-700 bg-orange-50' },
    { label: t('admin.stats.products'), value: stats.totalProducts, icon: Package, color: 'text-emerald-700 bg-emerald-50' },
    { label: t('admin.stats.users'), value: stats.totalUsers, icon: Users, color: 'text-cyan-700 bg-cyan-50' },
    { label: t('admin.stats.revenue'), value: formatCurrency(stats.revenue, i18n.language), icon: WalletCards, color: 'text-rose-700 bg-rose-50' },
  ];

  return (
    <section className="mx-auto min-h-[70vh] max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-stone-950">{t('admin.dashboard')}</h1>
        <p className="mt-2 text-stone-500">{t('admin.dashboardText')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
    </section>
  );
};

export default AdminDashboardPage;
