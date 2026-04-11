/**
 * Configuration for the "Add (+)" dynamic dropdown menu.
 *
 * route: required logical route from product spec.
 * fallbackPath: mapped existing in-app route (dashboard layout).
 */
export const addMenuConfig = [
    {
        key: 'invoice',
        label: 'فاتورة',
        route: '/sales/invoices/new',
        fallbackPath: '/dashboard/sales/invoices/new',
        permission: { module: 'sales_invoices', action: 'add' },
        icon: 'FileText'
    },
    {
        key: 'quote',
        label: 'عرض سعر',
        route: '/sales/quotes/new',
        fallbackPath: '/dashboard/sales/quotations/new',
        permission: { module: 'sales_invoices', action: 'add' },
        icon: 'FileText'
    },
    {
        key: 'client',
        label: 'عميل',
        route: '/clients/new',
        fallbackPath: '/dashboard/sales/customers',
        state: { openAddModal: true },
        permission: { module: 'customers', action: 'add' },
        icon: 'UserPlus'
    },
    {
        key: 'product',
        label: 'منتج',
        route: '/products/new',
        fallbackPath: '/dashboard/inventory/products',
        state: { openAddModal: true },
        permission: { module: 'products', action: 'add' },
        icon: 'Package'
    },
    {
        key: 'purchase_invoice',
        label: 'فاتورة مشتريات',
        route: '/purchases/invoices/new',
        fallbackPath: '/dashboard/purchases/invoices/new',
        permission: { module: 'purchase_invoices', action: 'add' },
        icon: 'ShoppingCart'
    },
    {
        key: 'supplier',
        label: 'مورد',
        route: '/suppliers/new',
        fallbackPath: '/dashboard/purchases/suppliers',
        state: { openAddModal: true },
        permission: { module: 'suppliers', action: 'add' },
        icon: 'Truck'
    },
    {
        key: 'expense',
        label: 'مصروف',
        route: '/expenses/new',
        fallbackPath: '/dashboard/finance/expenses/new',
        permission: { module: 'finance_operations', action: 'add' },
        icon: 'CreditCard'
    },
    {
        key: 'requisition',
        label: 'أذونة مالية',
        route: '/finance/requisitions/new',
        fallbackPath: '/dashboard/finance/requisitions/new',
        permission: { module: 'finance_operations', action: 'add' },
        icon: 'FileText'
    }
];
