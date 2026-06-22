import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import EmptyState from '../../components/food/EmptyState';
import LoadingState from '../../components/food/LoadingState';
import ProductCard from '../../components/food/ProductCard';
import { productService } from '../../services/productService';
import { categories } from '../../utils/format';

const MenuPage = () => {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.get('search') || '');
  const selectedCategory = params.get('category') || 'All';

  useEffect(() => {
    setLoading(true);
    productService.list({
      search: params.get('search') || undefined,
      category: selectedCategory !== 'All' ? selectedCategory : undefined,
    })
      .then(({ data }) => setProducts(data.products))
      .finally(() => setLoading(false));
  }, [params, selectedCategory]);

  const submitSearch = (event) => {
    event.preventDefault();
    const next = new URLSearchParams(params);

    if (search.trim()) {
      next.set('search', search.trim());
    } else {
      next.delete('search');
    }

    setParams(next);
  };

  const setCategory = (category) => {
    const next = new URLSearchParams(params);

    if (category === 'All') {
      next.delete('category');
    } else {
      next.set('category', category);
    }

    setParams(next);
  };

  return (
    <section className="mx-auto min-h-[70vh] max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-black text-stone-950">{t('menu.title')}</h1>
          <p className="mt-2 text-stone-500">{t('menu.subtitle')}</p>
        </div>
        <form onSubmit={submitSearch} className="flex w-full gap-2 lg:max-w-md">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('menu.searchPlaceholder')}
            className="h-12 min-w-0 flex-1 rounded-lg border border-stone-200 bg-white px-4 outline-none focus:border-orange-500"
          />
          <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 font-semibold text-white hover:bg-stone-800">
            <Search className="h-4 w-4" />
            {t('actions.search')}
          </button>
        </form>
      </div>

      <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setCategory(category)}
            className={`h-10 shrink-0 rounded-lg border px-4 text-sm font-bold ${selectedCategory === category ? 'border-orange-600 bg-orange-600 text-white' : 'border-stone-200 bg-white text-stone-700 hover:border-orange-300'}`}
          >
            {t(`categories.${category}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState />
      ) : products.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => <ProductCard key={product._id} product={product} />)}
        </div>
      ) : (
        <EmptyState title={t('menu.noResults')} description={t('menu.noResultsText')} />
      )}
    </section>
  );
};

export default MenuPage;
