import { CreditCard, MapPin, PackageCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { orderService } from '../../services/orderService';
import { formatCurrency } from '../../utils/format';

const CheckoutPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { items, subtotal, deliveryFee, total, clearCart } = useCart();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      fullName: user?.name || '',
      phone: '',
      address: '',
      notes: '',
      paymentMethod: 'cash',
    },
  });

  const submitOrder = async (values) => {
    if (!items.length) {
      toast.error(t('cart.empty'));
      navigate('/cart');
      return;
    }

    const payload = {
      items: items.map((item) => ({ product: item._id, quantity: item.quantity })),
      paymentMethod: values.paymentMethod,
      shippingAddress: {
        fullName: values.fullName,
        phone: values.phone,
        address: values.address,
        notes: values.notes,
      },
    };

    const { data } = await orderService.create(payload);
    clearCart();
    toast.success(values.paymentMethod === 'online' ? t('messages.mockPaid') : t('messages.orderPlaced'));
    navigate(`/orders/${data.order._id}`);
  };

  return (
    <section className="mx-auto min-h-[70vh] max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-stone-950">{t('checkout.title')}</h1>
        <p className="mt-2 text-stone-500">{t('checkout.subtitle')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <form onSubmit={handleSubmit(submitOrder)} className="grid gap-5 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-lg font-black text-stone-950">
            <MapPin className="h-5 w-5 text-orange-600" />
            {t('checkout.deliveryInfo')}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-stone-700">
              {t('forms.fullName')}
              <input className="h-11 rounded-lg border border-stone-200 px-3 outline-none focus:border-orange-500" {...register('fullName', { required: t('validation.required') })} />
              {errors.fullName && <span className="text-xs text-red-600">{errors.fullName.message}</span>}
            </label>
            <label className="grid gap-2 text-sm font-semibold text-stone-700">
              {t('forms.phone')}
              <input className="h-11 rounded-lg border border-stone-200 px-3 outline-none focus:border-orange-500" {...register('phone', { required: t('validation.required') })} />
              {errors.phone && <span className="text-xs text-red-600">{errors.phone.message}</span>}
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold text-stone-700">
            {t('forms.address')}
            <textarea rows="3" className="rounded-lg border border-stone-200 p-3 outline-none focus:border-orange-500" {...register('address', { required: t('validation.required') })} />
            {errors.address && <span className="text-xs text-red-600">{errors.address.message}</span>}
          </label>
          <label className="grid gap-2 text-sm font-semibold text-stone-700">
            {t('forms.notes')}
            <textarea rows="2" className="rounded-lg border border-stone-200 p-3 outline-none focus:border-orange-500" {...register('notes')} />
          </label>

          <div className="flex items-center gap-2 text-lg font-black text-stone-950">
            <CreditCard className="h-5 w-5 text-orange-600" />
            {t('checkout.payment')}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-stone-200 p-4 hover:border-orange-300">
              <input type="radio" value="cash" className="h-4 w-4 accent-orange-600" {...register('paymentMethod')} />
              <span className="font-semibold">{t('payments.cash')}</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-stone-200 p-4 hover:border-orange-300">
              <input type="radio" value="online" className="h-4 w-4 accent-orange-600" {...register('paymentMethod')} />
              <span className="font-semibold">{t('payments.online')}</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 font-bold text-white hover:bg-orange-700 disabled:bg-stone-300"
          >
            <PackageCheck className="h-5 w-5" />
            {isSubmitting ? t('states.saving') : t('checkout.placeOrder')}
          </button>
        </form>

        <aside className="h-fit rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-stone-950">{t('cart.summary')}</h2>
          <div className="mt-4 grid gap-3">
            {items.map((item) => (
              <div key={item._id} className="flex justify-between gap-3 text-sm">
                <span className="text-stone-600">{item.quantity} x {item.name}</span>
                <span className="font-bold">{formatCurrency(item.price * item.quantity, i18n.language)}</span>
              </div>
            ))}
          </div>
          <dl className="mt-5 grid gap-3 border-t border-stone-200 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone-500">{t('cart.subtotal')}</dt>
              <dd className="font-bold">{formatCurrency(subtotal, i18n.language)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">{t('cart.delivery')}</dt>
              <dd className="font-bold">{formatCurrency(deliveryFee, i18n.language)}</dd>
            </div>
            <div className="flex justify-between text-lg">
              <dt className="font-black">{t('cart.total')}</dt>
              <dd className="font-black text-orange-700">{formatCurrency(total, i18n.language)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
};

export default CheckoutPage;
