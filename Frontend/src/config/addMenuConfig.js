/**
 * Configuration for the "Add (+)" dynamic dropdown menu.
 * 
 * Each item contains:
 * - label: The Arabic name displayed in the menu.
 * - path: The React Router path to navigate to.
 * - state: Optional navigation state (e.g., to open a specific view or modal).
 * - permission: Object with module and action for granular RBAC.
 */
export const addMenuConfig = [
    {
        label: "فاتورة",
        path: "/dashboard/sales/invoices/new",
        permission: { module: "sales_invoices", action: "add" },
        icon: "FileText"
    },
    {
        label: "عرض سعر",
        path: "/dashboard/sales/quotations/new",
        permission: { module: "sales_invoices", action: "add" },
        icon: "FileText"
    },
    {
        label: "عميل",
        path: "/dashboard/sales/customers",
        state: { openAddModal: true },
        permission: { module: "customers", action: "add" },
        icon: "UserPlus"
    },
    {
        label: "منتج",
        path: "/dashboard/inventory/products",
        state: { openAddModal: true },
        permission: { module: "products", action: "add" },
        icon: "Package"
    },
    {
        label: "مصروف",
        path: "/dashboard/finance/expenses/new",
        permission: { module: "finance_operations", action: "add" },
        icon: "CreditCard"
    },
    {
        label: "فاتورة مشتريات",
        path: "/dashboard/purchases/invoices/new",
        permission: { module: "purchase_invoices", action: "add" },
        icon: "ShoppingCart"
    },
    {
        label: "مورد",
        path: "/dashboard/purchases/suppliers",
        state: { openAddModal: true },
        permission: { module: "suppliers", action: "add" },
        icon: "Truck"
    }
];
