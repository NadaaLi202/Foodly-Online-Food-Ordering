import { RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import EmptyState from '../../components/food/EmptyState';
import LoadingState from '../../components/food/LoadingState';
import { getErrorMessage } from '../../services/api';
import { orderService } from '../../services/orderService';
import { formatCurrency, formatDate, orderStatuses } from '../../utils/format';

const getCustomerName = (order) => order.user?.name || order.shippingAddress?.fullName || '-';

const getItemsSummary = (items = []) => items.map((item) => `${item.quantity} x ${item.name}`).join(', ');

const AdminOrdersPage = () => {
  const { t, i18n } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [updatingOrderId, setUpdatingOrderId] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await orderService.getAll();
      setOrders(data.orders || []);
    } catch (err) {
      setError(getErrorMessage(err, t('messages.ordersLoadFailed')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => (
    statusFilter === 'All'
      ? orders
      : orders.filter((order) => order.status === statusFilter)
  ), [orders, statusFilter]);

  const updateStatus = async (order, status) => {
    if (order.status === status) {
      return;
    }

    setUpdatingOrderId(order._id);

    try {
      const { data } = await orderService.updateStatus(order._id, status);
      setOrders((currentOrders) => currentOrders.map((item) => (
        item._id === order._id ? { ...item, status: data.order?.status || status } : item
      )));
      toast.success(t('messages.orderUpdated'));
    } catch (err) {
      toast.error(getErrorMessage(err, t('messages.orderUpdateFailed')));
    } finally {
      setUpdatingOrderId('');
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-stone-950 sm:text-4xl">{t('admin.orders')}</h1>
          <p className="mt-2 text-stone-500">{t('admin.ordersText')}</p>
        </div>

        <label className="grid gap-2 text-sm font-bold text-stone-700">
          {t('admin.statusFilter')}
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 rounded-lg border border-stone-200 bg-white px-3 outline-none focus:border-orange-500"
          >
            <option value="All">{t('admin.allStatuses')}</option>
            {orderStatuses.map((status) => (
              <option key={status} value={status}>{t(`statuses.${status}`)}</option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-800">
          <p className="font-bold">{t('states.error')}</p>
          <p className="mt-1 text-sm">{error}</p>
          <button
            type="button"
            onClick={loadOrders}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-red-700 px-4 text-sm font-bold text-white hover:bg-red-800"
          >
            <RefreshCw className="h-4 w-4" />
            {t('actions.retry')}
          </button>
        </div>
      ) : !filteredOrders.length ? (
        <EmptyState title={t('orders.empty')} description={t('orders.emptyText')} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white shadow-sm">
          <table className="w-full min-w-[1040px] text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-stone-500">
              <tr>
                <th className="px-4 py-3 text-start font-bold">{t('orders.orderNumber')}</th>
                <th className="px-4 py-3 text-start font-bold">{t('orders.customer')}</th>
                <th className="px-4 py-3 text-start font-bold">{t('tracking.items')}</th>
                <th className="px-4 py-3 text-start font-bold">{t('orders.total')}</th>
                <th className="px-4 py-3 text-start font-bold">{t('orders.payment')}</th>
                <th className="px-4 py-3 text-start font-bold">{t('orders.status')}</th>
                <th className="px-4 py-3 text-start font-bold">{t('orders.date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredOrders.map((order) => (
                <tr key={order._id} className="align-top">
                  <td className="px-4 py-3 font-black text-stone-950">{order.orderNumber || order._id}</td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-stone-950">{getCustomerName(order)}</p>
                    {order.user?.email && <p className="mt-1 text-xs text-stone-500">{order.user.email}</p>}
                  </td>
                  <td className="max-w-sm px-4 py-3 text-stone-600">{getItemsSummary(order.items)}</td>
                  <td className="px-4 py-3 font-bold">{formatCurrency(order.totalPrice, i18n.language)}</td>
                  <td className="px-4 py-3 text-stone-600">{t(`payments.${order.paymentMethod}`)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      disabled={updatingOrderId === order._id}
                      onChange={(event) => updateStatus(order, event.target.value)}
                      className="h-10 rounded-lg border border-stone-200 bg-white px-3 font-semibold outline-none focus:border-orange-500 disabled:cursor-not-allowed disabled:bg-stone-100"
                    >
                      {orderStatuses.map((status) => (
                        <option key={status} value={status}>{t(`statuses.${status}`)}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{formatDate(order.createdAt, i18n.language)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
