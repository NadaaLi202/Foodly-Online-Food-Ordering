/**
 * Navigation path builders for the app.
 * Use with useNavigate() or <Link to={path}>.
 */

export const paths = {
    clientDetails: (clientId) => `/dashboard/sales/customers/${clientId}`,
    supplierDetails: (supplierId) => `/dashboard/purchases/suppliers/${supplierId}`,
    salesPayments: (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.contactId) params.set('contactId', filters.contactId);
        if (filters.operationType) params.set('operationType', filters.operationType);
        if (filters.treasury) params.set('treasury', filters.treasury);
        const qs = params.toString();
        return `/dashboard/sales/payments${qs ? `?${qs}` : ''}`;
    },
    supplierPayments: (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.contactId) params.set('contactId', filters.contactId);
        if (filters.operationType) params.set('operationType', filters.operationType);
        if (filters.treasury) params.set('treasury', filters.treasury);
        const qs = params.toString();
        return `/dashboard/purchases/payments${qs ? `?${qs}` : ''}`;
    },
    safeDetails: (treasury = 'main') => `/dashboard/finance/safes?treasury=${treasury}`,
    bankDetails: () => `/dashboard/finance/bank-accounts`,
    salesInvoices: (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.contactId) params.set('contactId', filters.contactId);
        const qs = params.toString();
        return `/dashboard/sales/invoices${qs ? `?${qs}` : ''}`;
    },
    purchaseInvoices: (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.contactId) params.set('contactId', filters.contactId);
        const qs = params.toString();
        return `/dashboard/purchases/invoices${qs ? `?${qs}` : ''}`;
    },
    salesInvoiceDetails: (invoiceId) => `/dashboard/sales/invoices?openId=${invoiceId}`,
    purchaseInvoiceDetails: (invoiceId) => `/dashboard/purchases/invoices?openId=${invoiceId}`,
};
