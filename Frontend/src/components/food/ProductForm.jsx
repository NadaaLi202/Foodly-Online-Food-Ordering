import { Save, X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { foodCategories } from '../../utils/format';

const ProductForm = ({ product, onSubmit, onCancel, saving }) => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      image: '',
      category: 'Pizza',
      price: '',
      isAvailable: true,
    },
  });

  useEffect(() => {
    reset(product ? {
      name: product.name,
      description: product.description,
      image: product.image,
      category: product.category,
      price: product.price,
      isAvailable: product.isAvailable,
    } : {
      name: '',
      description: '',
      image: '',
      category: 'Pizza',
      price: '',
      isAvailable: true,
    });
  }, [product, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm lg:grid-cols-2">
      <label className="grid gap-2 text-sm font-semibold text-stone-700">
        {t('forms.name')}
        <input
          className="h-11 rounded-lg border border-stone-200 px-3 outline-none focus:border-orange-500"
          {...register('name', { required: t('validation.required') })}
        />
        {errors.name && <span className="text-xs text-red-600">{errors.name.message}</span>}
      </label>
      <label className="grid gap-2 text-sm font-semibold text-stone-700">
        {t('forms.category')}
        <select
          className="h-11 rounded-lg border border-stone-200 px-3 outline-none focus:border-orange-500"
          {...register('category', { required: t('validation.required') })}
        >
          {foodCategories.map((category) => (
            <option key={category} value={category}>{t(`categories.${category}`)}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-semibold text-stone-700">
        {t('forms.price')}
        <input
          type="number"
          min="0"
          step="1"
          className="h-11 rounded-lg border border-stone-200 px-3 outline-none focus:border-orange-500"
          {...register('price', { required: t('validation.required'), min: 0 })}
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-stone-700">
        {t('forms.imageUrl')}
        <input
          className="h-11 rounded-lg border border-stone-200 px-3 outline-none focus:border-orange-500"
          {...register('image')}
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-stone-700 lg:col-span-2">
        {t('forms.imageFile')}
        <input
          type="file"
          accept="image/*"
          className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
          {...register('imageFile')}
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-stone-700 lg:col-span-2">
        {t('forms.description')}
        <textarea
          rows="3"
          className="rounded-lg border border-stone-200 p-3 outline-none focus:border-orange-500"
          {...register('description', { required: t('validation.required') })}
        />
      </label>
      <label className="inline-flex items-center gap-3 text-sm font-semibold text-stone-700">
        <input type="checkbox" className="h-4 w-4 accent-orange-600" {...register('isAvailable')} />
        {t('forms.available')}
      </label>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-stone-200 px-4 font-semibold text-stone-700 hover:border-stone-300"
        >
          <X className="h-4 w-4" />
          {t('actions.cancel')}
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-orange-600 px-4 font-semibold text-white hover:bg-orange-700 disabled:bg-stone-300"
        >
          <Save className="h-4 w-4" />
          {saving ? t('states.saving') : t('actions.save')}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
