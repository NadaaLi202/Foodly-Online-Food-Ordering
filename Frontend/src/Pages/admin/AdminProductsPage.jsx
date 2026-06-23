import { Edit, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
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
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingProductId, setPendingProductId] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadProducts = async (query = search) => {
    setLoading(true);
    setError('');

    try {
      const { data } = await productService.list({ search: query || undefined });
      setProducts(data.products || []);
    } catch (err) {
      setError(getErrorMessage(err, t('messages.productsLoadFailed')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts('');
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
    } catch (err) {
      toast.error(getErrorMessage(err, t('messages.productSaveFailed')));
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (product) => {
    const nextAvailability = !product.isAvailable;
    setPendingProductId(product._id);

    try {
      await productService.update(product._id, { isAvailable: nextAvailability });
      setProducts((currentProducts) => currentProducts.map((item) => (
        item._id === product._id ? { ...item, isAvailable: nextAvailability } : item
      )));
      toast.success(t('messages.productAvailabilityUpdated'));
    } catch (err) {
      toast.error(getErrorMessage(err, t('messages.productAvailabilityFailed')));
    } finally {
      setPendingProductId('');
    }
  };

  const removeProduct = async (product) => {
    if (!window.confirm(t('messages.confirmDelete'))) {
      return;
    }

    setPendingProductId(product._id);

    try {
      await productService.remove(product._id);
      toast.success(t('messages.productDeleted'));
      setProducts((currentProducts) => currentProducts.filter((item) => item._id !== product._id));
    } catch (err) {
      toast.error(getErrorMessage(err, t('messages.productDeleteFailed')));
    } finally {
      setPendingProductId('');
    }
  };

  const submitSearch = (event) => {
    event.preventDefault();
    loadProducts(search);
  };

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-stone-950 sm:text-4xl">{t('admin.products')}</h1>
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
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-800">
          <p className="font-bold">{t('states.error')}</p>
          <p className="mt-1 text-sm">{error}</p>
          <button
            type="button"
            onClick={() => loadProducts(search)}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-red-700 px-4 text-sm font-bold text-white hover:bg-red-800"
          >
            <RefreshCw className="h-4 w-4" />
            {t('actions.retry')}
          </button>
        </div>
      ) : !products.length ? (
        <EmptyState title={t('menu.noResults')} description={t('menu.noResultsText')} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white shadow-sm">
          <table className="w-full min-w-[860px] text-start text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-stone-500">
              <tr>
                <th className="px-4 py-3 text-start font-bold">{t('forms.image')}</th>
                <th className="px-4 py-3 text-start font-bold">{t('forms.name')}</th>
                <th className="px-4 py-3 text-start font-bold">{t('forms.category')}</th>
                <th className="px-4 py-3 text-start font-bold">{t('forms.price')}</th>
                <th className="px-4 py-3 text-start font-bold">{t('forms.available')}</th>
                <th className="px-4 py-3 text-start font-bold">{t('actions.manage')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {products.map((product) => (
                <tr key={product._id} className="align-middle">
                  <td className="px-4 py-3">
                    <img src={product.image || '/foodly-icon.svg'} alt={product.name} className="h-14 w-14 rounded-lg object-cover" />
                  </td>
                  <td className="px-4 py-3 font-bold text-stone-950">{product.name}</td>
                  <td className="px-4 py-3 text-stone-600">{t(`categories.${product.category}`)}</td>
                  <td className="px-4 py-3 font-bold">{formatCurrency(product.price, i18n.language)}</td>
                  <td className="px-4 py-3">
                    <label className="inline-flex items-center gap-2 text-sm font-bold text-stone-700">
                      <input
                        type="checkbox"
                        checked={Boolean(product.isAvailable)}
                        disabled={pendingProductId === product._id}
                        onChange={() => toggleAvailability(product)}
                        className="h-4 w-4 accent-orange-600 disabled:cursor-not-allowed"
                      />
                      {product.isAvailable ? t('menu.available') : t('menu.unavailable')}
                    </label>
                  </td>
                  <td className="px-4 py-3">
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
                        disabled={pendingProductId === product._id}
                        onClick={() => removeProduct(product)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        title={t('actions.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
