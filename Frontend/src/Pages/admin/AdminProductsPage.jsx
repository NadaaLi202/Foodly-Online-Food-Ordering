import { Edit, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import EmptyState from '../../components/food/EmptyState';
import LoadingState from '../../components/food/LoadingState';
import ProductForm from '../../components/food/ProductForm';
import { getErrorMessage } from '../../services/api';
import { productService } from '../../services/productService';
import { formatCurrency } from '../../utils/format';

const AdminProductsPage = () => {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadProducts = () => {
    setLoading(true);
    productService.list({ search: search || undefined })
      .then(({ data }) => setProducts(data.products))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const submitProduct = async (values) => {
    setSaving(true);
    try {
      if (editing) {
        await productService.update(editing._id, values);
        toast.success(t('messages.productUpdated'));
      } else {
        await productService.create(values);
        toast.success(t('messages.productCreated'));
      }
      setShowForm(false);
      setEditing(null);
      loadProducts();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const removeProduct = async (product) => {
    if (!window.confirm(t('messages.confirmDelete'))) {
      return;
    }

    await productService.remove(product._id);
    toast.success(t('messages.productDeleted'));
    loadProducts();
  };

  const submitSearch = (event) => {
    event.preventDefault();
    loadProducts();
  };

  return (
    <section className="mx-auto min-h-[70vh] max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-black text-stone-950">{t('admin.products')}</h1>
          <p className="mt-2 text-stone-500">{t('admin.productsText')}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 font-bold text-white hover:bg-orange-700"
        >
          <Plus className="h-4 w-4" />
          {t('admin.addProduct')}
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <ProductForm
            product={editing}
            onSubmit={submitProduct}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
            saving={saving}
          />
        </div>
      )}

      <form onSubmit={submitSearch} className="mb-6 flex gap-2">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('admin.searchProduct')}
          className="h-11 min-w-0 flex-1 rounded-lg border border-stone-200 bg-white px-4 outline-none focus:border-orange-500"
        />
        <button type="submit" className="inline-flex h-11 items-center gap-2 rounded-lg bg-stone-950 px-4 font-semibold text-white hover:bg-stone-800">
          <Search className="h-4 w-4" />
          {t('actions.search')}
        </button>
      </form>

      {loading ? (
        <LoadingState />
      ) : !products.length ? (
        <EmptyState title={t('menu.noResults')} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
          <div className="grid min-w-[800px] grid-cols-[80px_1.5fr_1fr_1fr_1fr_160px] border-b border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold text-stone-500">
            <span>{t('forms.image')}</span>
            <span>{t('forms.name')}</span>
            <span>{t('forms.category')}</span>
            <span>{t('forms.price')}</span>
            <span>{t('forms.available')}</span>
            <span>{t('actions.manage')}</span>
          </div>
          <div className="overflow-x-auto">
            {products.map((product) => (
              <div key={product._id} className="grid min-w-[800px] grid-cols-[80px_1.5fr_1fr_1fr_1fr_160px] items-center border-b border-stone-100 px-4 py-3 last:border-0">
                <img src={product.image} alt={product.name} className="h-14 w-14 rounded-lg object-cover" />
                <span className="font-bold text-stone-950">{product.name}</span>
                <span className="text-sm text-stone-600">{t(`categories.${product.category}`)}</span>
                <span className="font-bold">{formatCurrency(product.price, i18n.language)}</span>
                <span className={`text-sm font-bold ${product.isAvailable ? 'text-emerald-700' : 'text-red-700'}`}>
                  {product.isAvailable ? t('menu.available') : t('menu.unavailable')}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(product);
                      setShowForm(true);
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-700 hover:border-orange-300 hover:text-orange-700"
                    title={t('actions.edit')}
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeProduct(product)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                    title={t('actions.delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminProductsPage;
