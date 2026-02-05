import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getTransactionConfig } from '../../config/transactionTypes';
import InvoiceList from './InvoiceList';
import InvoiceForm from './InvoiceForm';
import InvoiceDetails from './InvoiceDetails';

const TransactionPage = ({ configKey }) => {
    const { t, i18n } = useTranslation();
    const config = getTransactionConfig(configKey);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState('list');
    const [selected, setSelected] = useState(null);

    const fetchList = async () => {
        setLoading(true);
        try {
            const response = await fetch(config.listUrl);
            const data = await response.json();
            setItems(data.data || data.transactions || []);
        } catch (error) {
            console.error('Error fetching list:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const listUrl = config.listUrl;
        setLoading(true);
        fetch(listUrl)
            .then((res) => res.json())
            .then((data) => setItems(data.data || data.transactions || []))
            .catch((err) => console.error('Error fetching list:', err))
            .finally(() => setLoading(false));
    }, [configKey]);

    const handleAddClick = () => {
        setSelected(null);
        setView('add');
    };

    const handleItemClick = async (item) => {
        setLoading(true);
        try {
            const response = await fetch(config.getOneUrl(item._id));
            const data = await response.json();
            if (response.ok) {
                setSelected(data);
                setView('details');
            } else {
                alert(data.message || t('sales.common.error_message'));
            }
        } catch (error) {
            console.error('Error fetching details:', error);
            alert(t('sales.common.error_message'));
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = async (item) => {
        setLoading(true);
        try {
            const response = await fetch(config.getOneUrl(item._id));
            const data = await response.json();
            if (response.ok) {
                setSelected(data);
                setView('edit');
            } else {
                alert(data.message || t('sales.common.error_message'));
            }
        } catch (error) {
            console.error('Error fetching for edit:', error);
            alert(t('sales.common.error_message'));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (formData, options = {}) => {
        setLoading(true);
        try {
            const url = selected ? config.getOneUrl(selected._id) : config.createUrl;
            const method = selected ? 'PATCH' : 'POST';
            const response = await fetch(url, { method, body: formData });

            if (response.ok) {
                if (options.stayOnDetails && selected?._id) {
                    const res = await fetch(config.getOneUrl(selected._id));
                    const data = await res.json();
                    if (res.ok) setSelected(data);
                } else {
                    setView('list');
                }
                fetchList();
            } else {
                const error = await response.json();
                alert(error.message || t('sales.common.error_message'));
            }
        } catch (error) {
            console.error('Error saving:', error);
            alert(t('sales.common.error_message'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetch(config.getOneUrl(id), { method: 'DELETE' });
            if (response.ok) {
                alert(t('sales.common.success_message'));
                setView('list');
                fetchList();
            } else {
                const error = await response.json();
                alert(error.message || t('sales.common.error_message'));
            }
        } catch (error) {
            console.error('Error deleting:', error);
            alert(t('sales.common.error_message'));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 overflow-hidden" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            {view === 'list' && (
                <InvoiceList
                    invoices={items}
                    loading={loading}
                    onAddClick={handleAddClick}
                    onFetchInvoices={fetchList}
                    onInvoiceClick={handleItemClick}
                    i18n={i18n}
                    noItemsKey={config.noItemsKey}
                    startKey={config.startKey}
                />
            )}

            {(view === 'add' || view === 'edit') && (
                <InvoiceForm
                    invoice={selected}
                    onClose={() => setView('list')}
                    onSave={handleSave}
                    i18n={i18n}
                    contactType={config.contactType}
                    addTitleKey={config.addTitleKey}
                    editTitleKey={config.editTitleKey}
                    numberPlaceholderKey={config.numberPlaceholderKey}
                    clientLabelKey={config.clientLabelKey}
                />
            )}

            {view === 'details' && (
                <InvoiceDetails
                    invoice={selected}
                    onClose={() => setView('list')}
                    onEdit={handleEditClick}
                    onDelete={handleDelete}
                    onSave={handleSave}
                    loading={loading}
                    i18n={i18n}
                    viewTitleKey={config.viewTitleKey}
                    filenamePrefix={config.filenamePrefix}
                />
            )}
        </div>
    );
};

export default TransactionPage;
