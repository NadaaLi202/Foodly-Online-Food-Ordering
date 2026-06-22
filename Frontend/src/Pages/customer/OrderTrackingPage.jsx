import { Package } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LoadingState from '../../components/food/LoadingState';
import StatusTimeline from '../../components/food/StatusTimeline';
import { orderService } from '../../services/orderService';
import { formatCurrency } from '../../utils/format';

const OrderTrackingPage = () => {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService.getById(id)
      .then(({ data }) => setOrder(data.order))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <LoadingState />;
  }

  if (!order) {
    return null;
  }

  return (
    <section className="mx-auto min-h-[70vh] max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-black text-stone-950">{t('tracking.title')}</h1>
          <p className="mt-2 text-stone-500">{order.orderNumber}</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 font-bold text-emerald-700">
          <Package className="h-4 w-4" />
          {t(`statuses.${order.status}`)}
        </span>
      </div>

      <StatusTimeline status={order.status} />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-stone-950">{t('tracking.items')}</h2>
          <div className="mt-4 grid gap-4">
            {order.items.map((item) => (
              <div key={item.product} className="flex items-center gap-4 border-b border-stone-100 pb-4 last:border-0 last:pb-0">
                <img src={item.image} alt={item.name} className="h-16 w-16 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-stone-950">{item.name}</h3>
                  <p className="text-sm text-stone-500">{item.quantity} x {formatCurrency(item.price, i18n.language)}</p>
                </div>
                <span className="font-bold">{formatCurrency(item.quantity * item.price, i18n.language)}</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="h-fit rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-stone-950">{t('tracking.details')}</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-stone-500">{t('orders.payment')}</dt>
              <dd className="font-bold">{t(`payments.${order.paymentMethod}`)}</dd>
            </div>
            <div>
              <dt className="text-stone-500">{t('forms.fullName')}</dt>
              <dd className="font-bold">{order.shippingAddress.fullName}</dd>
            </div>
            <div>
              <dt className="text-stone-500">{t('forms.address')}</dt>
              <dd className="font-bold">{order.shippingAddress.address}</dd>
            </div>
            <div className="border-t border-stone-200 pt-3">
              <dt className="text-stone-500">{t('orders.total')}</dt>
              <dd className="text-xl font-black text-orange-700">{formatCurrency(order.totalPrice, i18n.language)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
};

export default OrderTrackingPage;
