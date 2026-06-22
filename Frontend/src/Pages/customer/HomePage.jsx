import { ArrowRight, Flame, Search, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProductCard from '../../components/food/ProductCard';
import LoadingState from '../../components/food/LoadingState';
import { productService } from '../../services/productService';
import { foodCategories } from '../../utils/format';

const HomePage = () => {
  const { t } = useTranslation();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productService.list()
      .then(({ data }) => setFeatured(data.products.slice(0, 6)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section
        className="relative min-h-[560px] bg-cover bg-center text-white"
        style={{ backgroundImage: "linear-gradient(90deg, rgba(28,25,23,.88), rgba(28,25,23,.42)), url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1800&q=80')" }}
      >
        <div className="mx-auto flex min-h-[560px] max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold backdrop-blur">
              <Flame className="h-4 w-4 text-orange-300" />
              {t('home.badge')}
            </span>
            <h1 className="mt-6 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              {t('home.title')}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-stone-100">
              {t('home.subtitle')}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/menu" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 font-bold text-white hover:bg-orange-700">
                <ShoppingCart className="h-5 w-5" />
                {t('home.orderNow')}
              </Link>
              <Link to="/menu" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 font-bold text-stone-950 hover:bg-stone-100">
                <Search className="h-5 w-5" />
                {t('home.browseMenu')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-black text-stone-950">{t('home.categories')}</h2>
            <p className="mt-2 text-stone-500">{t('home.categoriesText')}</p>
          </div>
          <Link to="/menu" className="inline-flex items-center gap-2 text-sm font-bold text-orange-700 hover:text-orange-800">
            {t('actions.viewAll')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {foodCategories.map((category) => (
            <Link
              key={category}
              to={`/menu?category=${category}`}
              className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-md"
            >
              <span className="text-sm font-semibold text-orange-700">{t(`categories.${category}`)}</span>
              <h3 className="mt-3 text-xl font-black text-stone-950">{t(`categoryDescriptions.${category}.title`)}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-500">{t(`categoryDescriptions.${category}.text`)}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-3xl font-black text-stone-950">{t('home.featured')}</h2>
          <p className="mt-2 text-stone-500">{t('home.featuredText')}</p>
        </div>
        {loading ? (
          <LoadingState />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((product) => <ProductCard key={product._id} product={product} />)}
          </div>
        )}
      </section>

      <section className="bg-emerald-700 text-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_.6fr] md:items-center lg:px-8">
          <div>
            <h2 className="text-3xl font-black">{t('home.ctaTitle')}</h2>
            <p className="mt-3 max-w-2xl text-emerald-50">{t('home.ctaText')}</p>
          </div>
          <Link to="/checkout" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 font-bold text-emerald-800 hover:bg-emerald-50">
            <ShoppingCart className="h-5 w-5" />
            {t('home.ctaButton')}
          </Link>
        </div>
      </section>
    </>
  );
};

export default HomePage;
