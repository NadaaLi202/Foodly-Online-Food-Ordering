import api from './api';

const exportService = {
    exportProducts: async () => {
        const response = await api.get('/export/products', { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'Products_Export.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
    },
    exportCustomers: async () => {
        const response = await api.get('/export/customers', { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'Customers_Export.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
    },
    exportSuppliers: async () => {
        const response = await api.get('/export/suppliers', { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'Suppliers_Export.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
};

export default exportService;
