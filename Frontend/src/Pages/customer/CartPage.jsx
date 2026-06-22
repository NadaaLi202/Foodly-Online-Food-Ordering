import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import EmptyState from '../../components/food/EmptyState';
import { useCart } from '../../contexts/CartContext';
import { formatCurrency } from '../../utils/format';

const CartPage = () => {
  const { t, i18n } = useTranslation();
  const {
    items,
    subtotal,
    deliveryFee,
    total,
    increase,
    decrease,
    removeItem,
    clearCart,
  } = useCart();

  return (
    <section className="mx-auto min-h-[70vh] max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-black text-stone-950">{t('cart.title')}</h1>
          <p className="mt-2 text-stone-500">{t('cart.subtitle')}</p>
        </div>
        {items.length > 0 && (
          <button type="button" onClick={clearCart} className="inline-flex h-11 items-center gap-2 rounded-lg border border-red-200 px-4 font-semibold text-red-700 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
            {t('cart.clear')}
          </button>
        )}
      </div>

      {!items.length ? (
        <EmptyState title={t('cart.empty')} description={t('cart.emptyText')} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-4">
            {items.map((item) => (
              <article key={item._id} className="grid gap-4 rounded-lg border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-[120px_1fr_auto] sm:items-center">
                <img src={item.image} alt={item.name} className="aspect-square w-full rounded-lg object-cover sm:w-[120px]" />
                <div>
                  <h3 className="text-lg font-bold text-stone-950">{item.name}</h3>
                  <p className="mt-1 text-sm text-stone-500">{t(`categories.${item.category}`)}</p>
                  <p className="mt-2 font-bold text-orange-700">{formatCurrency(item.price, i18n.language)}</p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                  <div className="flex h-10 items-center rounded-lg border border-stone-200">
                    <button type="button" onClick={() => decrease(item._id)} className="inline-flex h-10 w-10 items-center justify-center text-stone-700 hover:text-orange-700">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center font-bold">{item.quantity}</span>
                    <button type="button" onClick={() => increase(item._id)} className="inline-flex h-10 w-10 items-center justify-center text-stone-700 hover:text-orange-700">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button type="button" onClick={() => removeItem(item._id)} className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                    {t('actions.remove')}
                  </button>
                </div>
              </article>
            ))}
          </div>

          <aside className="h-fit rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-stone-950">{t('cart.summary')}</h2>
            <dl className="mt-5 grid gap-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-500">{t('cart.subtotal')}</dt>
                <dd className="font-bold">{formatCurrency(subtotal, i18n.language)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">{t('cart.delivery')}</dt>
                <dd className="font-bold">{formatCurrency(deliveryFee, i18n.language)}</dd>
              </div>
              <div className="flex justify-between border-t border-stone-200 pt-3 text-lg">
                <dt className="font-black">{t('cart.total')}</dt>
                <dd className="font-black text-orange-700">{formatCurrency(total, i18n.language)}</dd>
              </div>
            </dl>
            <Link to="/checkout" className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 font-bold text-white hover:bg-orange-700">
              <ShoppingBag className="h-5 w-5" />
              {t('cart.checkout')}
            </Link>
          </aside>
        </div>
      )}
    </section>
  );
};

export default CartPage;
