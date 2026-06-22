import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import EmptyState from '../../components/food/EmptyState';
import LoadingState from '../../components/food/LoadingState';
import { orderService } from '../../services/orderService';
import { formatCurrency, orderStatuses } from '../../utils/format';

const AdminOrdersPage = () => {
  const { t, i18n } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = () => {
    setLoading(true);
    orderService.getAll()
      .then(({ data }) => setOrders(data.orders))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = async (order, status) => {
    await orderService.updateStatus(order._id, status);
    toast.success(t('messages.orderUpdated'));
    loadOrders();
  };

  return (
    <section className="mx-auto min-h-[70vh] max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-stone-950">{t('admin.orders')}</h1>
        <p className="mt-2 text-stone-500">{t('admin.ordersText')}</p>
      </div>

      {loading ? (
        <LoadingState />
      ) : !orders.length ? (
        <EmptyState title={t('orders.empty')} />
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <article key={order._id} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
              <div className="grid gap-4 lg:grid-cols-[1fr_220px] lg:items-center">
                <div className="grid gap-3 sm:grid-cols-4">
                  <div>
                    <p className="text-xs font-bold uppercase text-stone-400">{t('orders.orderNumber')}</p>
                    <p className="mt-1 font-black">{order.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-stone-400">{t('orders.customer')}</p>
                    <p className="mt-1 font-semibold">{order.user?.name || order.shippingAddress.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-stone-400">{t('orders.payment')}</p>
                    <p className="mt-1 font-semibold">{t(`payments.${order.paymentMethod}`)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-stone-400">{t('orders.total')}</p>
                    <p className="mt-1 font-semibold">{formatCurrency(order.totalPrice, i18n.language)}</p>
                  </div>
                </div>
                <select
                  value={order.status}
                  onChange={(event) => updateStatus(order, event.target.value)}
                  className="h-11 rounded-lg border border-stone-200 px-3 font-semibold outline-none focus:border-orange-500"
                >
                  {orderStatuses.map((status) => (
                    <option key={status} value={status}>{t(`statuses.${status}`)}</option>
                  ))}
                </select>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {order.items.map((item) => (
                  <span key={`${order._id}-${item.product}`} className="rounded-lg bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-700">
                    {item.quantity} x {item.name}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default AdminOrdersPage;
