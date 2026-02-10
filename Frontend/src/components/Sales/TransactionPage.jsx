import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { getTransactionConfig } from '../../config/transactionTypes';
import InvoiceList from './InvoiceList';
import InvoiceForm from './InvoiceForm';
import InvoiceDetails from './InvoiceDetails';
import api from '../../services/api';

const TransactionPage = ({ configKey }) => {
    const { t, i18n } = useTranslation();
    const [searchParams] = useSearchParams();
    const contactId = searchParams.get('contactId');
    const openId = searchParams.get('openId');
    const openIdHandled = useRef(false);
    const config = getTransactionConfig(configKey);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState('list');
    const [selected, setSelected] = useState(null);

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const queryParams = {};
            if (contactId) queryParams.contactId = contactId;
            const response = await api.get(config.listUrl, { params: queryParams });
            const data = response.data;
            setItems(data.data || data.transactions || []);
        } catch (error) {
            console.error('Error fetching list:', error);
        } finally {
            setLoading(false);
        }
    }, [config.listUrl, contactId]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    useEffect(() => {
        if (openId && !openIdHandled.current) {
            openIdHandled.current = true;
            const openInvoice = async () => {
                setLoading(true);
                try {
                    const response = await api.get(config.getOneUrl(openId));
                    setSelected(response.data);
                    setView('details');
                } catch (e) {
                    console.error('Could not open invoice:', e);
                } finally {
                    setLoading(false);
                }
            };
            openInvoice();
        }
    }, [openId]);

    const handleAddClick = () => {
        setSelected(null);
        setView('add');
    };

    const handleItemClick = async (item) => {
        setLoading(true);
        try {
            const response = await api.get(config.getOneUrl(item._id));
            const data = response.data;
            setSelected(data);
            setView('details');
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
            const response = await api.get(config.getOneUrl(item._id));
            const data = response.data;
            setSelected(data);
            setView('edit');
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

            // Note: formData is likely a FormData object now due to file uploads
            // api utility handles Content-Type automatically or we can force it if needed, 
            // but Axios usually auto-detects FormData.
            const response = await api({
                method,
                url,
                data: formData
            });

            toast.success(t('sales.common.success_message'));
            if (options.stayOnDetails && selected?._id) {
                const res = await api.get(config.getOneUrl(selected._id));
                setSelected(res.data);
            } else {
                setView('list');
            }
            fetchList();
        } catch (error) {
            console.error('Error saving:', error);
            const msg = error.response?.data?.message || t('sales.common.error_message');
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(config.getOneUrl(id));
            toast.success(t('sales.common.success_message'));
            setView('list');
            fetchList();
        } catch (error) {
            console.error('Error deleting:', error);
            const msg = error.response?.data?.message || t('sales.common.error_message');
            toast.error(msg);
        }
    };

    const handleDeleteAttachment = async (transactionId, updatedAttachments) => {
        try {
            await api.patch(config.getOneUrl(transactionId), { attachments: updatedAttachments });
            toast.success(t('sales.common.success_message'));
            const res = await api.get(config.getOneUrl(transactionId));
            setSelected(res.data);
        } catch (error) {
            console.error('Error deleting attachment:', error);
            const msg = error.response?.data?.message || t('sales.common.error_message');
            toast.error(msg);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 overflow-hidden" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            {view === 'list' && (
                <InvoiceList
                    invoices={items}
                    loading={loading}
                    onAddClick={handleAddClick}
                    onRefresh={() => fetchList()}
                    onInvoiceClick={handleItemClick}
                    i18n={i18n}
                    noItemsKey={config.noItemsKey}
                    startKey={config.startKey}
                    clientLabelKey={config.clientLabelKey}
                    isSupplier={configKey?.includes('purchases')}
                />
            )}

            {(view === 'add' || view === 'edit') && (
                <InvoiceForm
                    invoice={selected}
                    onClose={() => setView('list')}
                    onSave={handleSave}
                    onDeleteAttachment={handleDeleteAttachment}
                    i18n={i18n}
                    contactType={config.contactType}
                    addTitleKey={config.addTitleKey}
                    editTitleKey={config.editTitleKey}
                    numberPlaceholderKey={config.numberPlaceholderKey}
                    clientLabelKey={config.clientLabelKey}
                    defaultCurrency="EGP"
                />
            )}

            {view === 'details' && (
                <InvoiceDetails
                    invoice={selected}
                    onClose={() => setView('list')}
                    onEdit={handleEditClick}
                    onDelete={handleDelete}
                    onSave={handleSave}
                    onRefreshInvoice={async () => {
                        if (selected?._id) {
                            try {
                                const res = await api.get(config.getOneUrl(selected._id));
                                setSelected(res.data);
                            } catch (e) {
                                console.error('Error refreshing invoice:', e);
                            }
                        }
                    }}
                    loading={loading}
                    i18n={i18n}
                    viewTitleKey={config.viewTitleKey}
                    filenamePrefix={config.filenamePrefix}
                    paymentsModule={configKey?.includes('sales') ? 'sales' : 'purchases'}
                />
            )}
        </div>
    );
};

export default TransactionPage;
