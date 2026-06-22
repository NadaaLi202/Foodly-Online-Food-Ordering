import { Eye, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../contexts/CartContext';
import { formatCurrency } from '../../utils/format';

const ProductCard = ({ product }) => {
  const { t, i18n } = useTranslation();
  const { addItem } = useCart();

  const handleAdd = () => {
    addItem(product);
    toast.success(t('messages.addedToCart'));
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <Link to={`/menu/${product._id}`} className="block aspect-[4/3] overflow-hidden bg-stone-100">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {t(`categories.${product.category}`)}
          </span>
          <span className="text-sm font-bold text-orange-700">
            {formatCurrency(product.price, i18n.language)}
          </span>
        </div>
        <h3 className="text-lg font-bold text-stone-950">{product.name}</h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-6 text-stone-500">{product.description}</p>
        <div className="mt-4 flex gap-2">
          <Link
            to={`/menu/${product._id}`}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-stone-200 px-3 text-sm font-semibold text-stone-700 hover:border-orange-300 hover:text-orange-700"
          >
            <Eye className="h-4 w-4" />
            {t('actions.details')}
          </Link>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!product.isAvailable}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-orange-600 px-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            <ShoppingCart className="h-4 w-4" />
            {product.isAvailable ? t('actions.add') : t('menu.unavailable')}
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
