import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import InvoiceList from '../../components/Sales/InvoiceList';
import InvoiceForm from '../../components/Sales/InvoiceForm';
import InvoiceDetails from '../../components/Sales/InvoiceDetails';

const Invoices = () => {
    const { t, i18n } = useTranslation();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState('list'); // 'list', 'add', 'edit', 'details'
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    // Fetch invoices from API
    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:4000/api/v1/invoices');
            const data = await response.json();
            setInvoices(data.invoices || []);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleAddClick = () => {
        setSelectedInvoice(null);
        setView('add');
    };

    const handleInvoiceClick = async (invoice) => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:4000/api/v1/invoices/${invoice._id}`);
            const data = await response.json();
            if (response.ok) {
                setSelectedInvoice(data.invoice);
                setView('details');
            } else {
                alert(data.message || t('sales.common.error_message'));
            }
        } catch (error) {
            console.error('Error fetching invoice details:', error);
            alert(t('sales.common.error_message'));
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = async (invoice) => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:4000/api/v1/invoices/${invoice._id}`);
            const data = await response.json();
            if (response.ok) {
                setSelectedInvoice(data.invoice);
                setView('edit');
            } else {
                alert(data.message || t('sales.common.error_message'));
            }
        } catch (error) {
            console.error('Error fetching invoice for edit:', error);
            alert(t('sales.common.error_message'));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (formData) => {
        setLoading(true);
        try {
            const url = selectedInvoice
                ? `http://localhost:4000/api/v1/invoices/${selectedInvoice._id}`
                : 'http://localhost:4000/api/v1/invoices';
            const method = selectedInvoice ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                // alert(t('sales.common.success_message'));
                setView('list');
                fetchInvoices();
            } else {
                const error = await response.json();
                alert(error.message || t('sales.common.error_message'));
            }
        } catch (error) {
            console.error('Error saving invoice:', error);
            alert(t('sales.common.error_message'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`http://localhost:4000/api/v1/invoices/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                alert(t('sales.common.success_message'));
                setView('list');
                fetchInvoices();
            } else {
                const error = await response.json();
                alert(error.message || t('sales.common.error_message'));
            }
        } catch (error) {
            console.error('Error deleting invoice:', error);
            alert(t('sales.common.error_message'));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 overflow-hidden" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            {view === 'list' && (
                <InvoiceList
                    invoices={invoices}
                    loading={loading}
                    onAddClick={handleAddClick}
                    onFetchInvoices={fetchInvoices}
                    onInvoiceClick={handleInvoiceClick}
                    i18n={i18n}
                />
            )}

            {(view === 'add' || view === 'edit') && (
                <InvoiceForm
                    invoice={selectedInvoice}
                    onClose={() => setView('list')}
                    onSave={handleSave}
                    i18n={i18n}
                />
            )}

            {view === 'details' && (
                <InvoiceDetails
                    invoice={selectedInvoice}
                    onClose={() => setView('list')}
                    onEdit={handleEditClick}
                    onDelete={handleDelete}
                    i18n={i18n}
                />
            )}
        </div>
    );
};

export default Invoices;