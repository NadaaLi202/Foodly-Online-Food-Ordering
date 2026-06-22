import { Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import EmptyState from '../../components/food/EmptyState';
import LoadingState from '../../components/food/LoadingState';
import { orderService } from '../../services/orderService';
import { formatCurrency } from '../../utils/format';

const OrdersPage = () => {
  const { t, i18n } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService.myOrders()
      .then(({ data }) => setOrders(data.orders))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <section className="mx-auto min-h-[70vh] max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-stone-950">{t('orders.title')}</h1>
        <p className="mt-2 text-stone-500">{t('orders.subtitle')}</p>
      </div>

      {!orders.length ? (
        <EmptyState title={t('orders.empty')} description={t('orders.emptyText')} />
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <article key={order._id} className="grid gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_auto] md:items-center">
              <div className="grid gap-3 sm:grid-cols-4">
                <div>
                  <p className="text-xs font-bold uppercase text-stone-400">{t('orders.orderNumber')}</p>
                  <p className="mt-1 font-black text-stone-950">{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-stone-400">{t('orders.date')}</p>
                  <p className="mt-1 font-semibold">{new Date(order.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-stone-400">{t('orders.total')}</p>
                  <p className="mt-1 font-semibold">{formatCurrency(order.totalPrice, i18n.language)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-stone-400">{t('orders.status')}</p>
                  <p className="mt-1 font-semibold text-emerald-700">{t(`statuses.${order.status}`)}</p>
                </div>
              </div>
              <Link to={`/orders/${order._id}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 font-semibold text-white hover:bg-stone-800">
                <Eye className="h-4 w-4" />
                {t('orders.track')}
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default OrdersPage;
