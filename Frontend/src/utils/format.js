export const categories = ['All', 'Pizza', 'Burger', 'Pasta', 'Drinks', 'Desserts'];
export const foodCategories = ['Pizza', 'Burger', 'Pasta', 'Drinks', 'Desserts'];
export const orderStatuses = ['Pending', 'Preparing', 'On The Way', 'Delivered'];

export const formatCurrency = (value = 0, language = 'en') => new Intl.NumberFormat(
  language === 'ar' ? 'ar-EG' : 'en-US',
  {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  },
).format(value);

export const formatDate = (value, language = 'en') => {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};
