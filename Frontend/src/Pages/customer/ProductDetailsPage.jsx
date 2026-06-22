import { ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import LoadingState from '../../components/food/LoadingState';
import { useCart } from '../../contexts/CartContext';
import { productService } from '../../services/productService';
import { formatCurrency } from '../../utils/format';

const ProductDetailsPage = () => {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productService.get(id)
      .then(({ data }) => setProduct(data.product))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <LoadingState />;
  }

  if (!product) {
    return null;
  }

  const handleAdd = () => {
    addItem(product);
    toast.success(t('messages.addedToCart'));
  };

  return (
    <section className="mx-auto grid min-h-[70vh] max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
      <div className="aspect-[4/3] overflow-hidden rounded-lg bg-stone-100">
        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
      </div>
      <div className="self-center">
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
          {t(`categories.${product.category}`)}
        </span>
        <h1 className="mt-5 text-4xl font-black text-stone-950">{product.name}</h1>
        <p className="mt-4 text-lg leading-8 text-stone-600">{product.description}</p>
        <div className="mt-6 text-3xl font-black text-orange-700">
          {formatCurrency(product.price, i18n.language)}
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!product.isAvailable}
          className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-orange-600 px-6 font-bold text-white hover:bg-orange-700 disabled:bg-stone-300"
        >
          <ShoppingCart className="h-5 w-5" />
          {product.isAvailable ? t('actions.add') : t('menu.unavailable')}
        </button>
      </div>
    </section>
  );
};

export default ProductDetailsPage;
