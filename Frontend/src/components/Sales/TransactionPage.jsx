import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { getTransactionConfig } from '../../config/transactionTypes';
import InvoiceList from './InvoiceList';
import InvoiceForm from './InvoiceForm';
import InvoiceDetails from './InvoiceDetails';
import api from '../../services/api';
import logError from '../../utils/logError';
import { usePermissions } from '../../hooks/usePermissions';

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
    const { hasPermission, loadingPermissions } = usePermissions();

    const permissionModule = configKey?.startsWith('sales_')
        ? 'sales_invoices'
        : configKey?.startsWith('purchases_')
            ? 'purchase_invoices'
            : null;
    const canView = permissionModule ? hasPermission(permissionModule, 'view') : true;
    const canAdd = permissionModule ? hasPermission(permissionModule, 'add') : true;
    const canEdit = permissionModule ? hasPermission(permissionModule, 'edit') : true;
    const canDelete = permissionModule ? hasPermission(permissionModule, 'delete') : true;

    const fetchList = useCallback(async () => {
        if (!canView) {
            setItems([]);
            return;
        }
        setLoading(true);
        try {
            const queryParams = {};
            if (contactId) queryParams.contactId = contactId;
            const response = await api.get(config.listUrl, { params: queryParams });
            const data = response.data;
            setItems(data.data || data.transactions || []);
        } catch (error) {
            logError('Error fetching list:', error);
        } finally {
            setLoading(false);
        }
    }, [config.listUrl, contactId, canView]);

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
                    logError('Could not open invoice:', e);
                } finally {
                    setLoading(false);
                }
            };
            openInvoice();
        }
    }, [openId]);

    const handleAddClick = () => {
        if (!canAdd) {
            toast.error(t('sales.common.error_message'));
            return;
        }
        setSelected(null);
        setView('add');
    };

    const handleItemClick = async (item) => {
        if (!canView) {
            toast.error(t('sales.common.error_message'));
            return;
        }
        setLoading(true);
        try {
            const response = await api.get(config.getOneUrl(item._id));
            const data = response.data;
            setSelected(data);
            setView('details');
        } catch (error) {
            logError('Error fetching details:', error);
            alert(t('sales.common.error_message'));
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = async (item) => {
        if (!canEdit) {
            toast.error(t('sales.common.error_message'));
            return;
        }
        setLoading(true);
        try {
            const response = await api.get(config.getOneUrl(item._id));
            const data = response.data;
            setSelected(data);
            setView('edit');
        } catch (error) {
            logError('Error fetching for edit:', error);
            alert(t('sales.common.error_message'));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (formData, options = {}) => {
        if (selected && !canEdit) {
            toast.error(t('sales.common.error_message'));
            return;
        }
        if (!selected && !canAdd) {
            toast.error(t('sales.common.error_message'));
            return;
        }
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
            if (!selected && configKey === 'sales_invoices') {
                window.dispatchEvent(new CustomEvent('sales-invoice-created'));
            }
            if (!selected && (configKey === 'purchases_invoices' || configKey === 'purchases_returns' || configKey === 'purchases_purchaseOrder')) {
                window.dispatchEvent(new CustomEvent('purchase-document-created'));
            }
        } catch (error) {
            logError('Error saving:', error);
            const msg = error.response?.data?.message || t('sales.common.error_message');
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!canDelete) {
            toast.error(t('sales.common.error_message'));
            return;
        }
        try {
            await api.delete(config.getOneUrl(id));
            toast.success(t('sales.common.success_message'));
            setView('list');
            fetchList();
        } catch (error) {
            logError('Error deleting:', error);
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
            logError('Error deleting attachment:', error);
            const msg = error.response?.data?.message || t('sales.common.error_message');
            toast.error(msg);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 overflow-hidden" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            {!loadingPermissions && !canView && (
                <div className="p-6">
                    <div className="bg-white rounded-xl border border-red-100 p-6 text-red-600 font-bold text-sm">
                        {t('sales.common.error_message')}
                    </div>
                </div>
            )}
            {!loadingPermissions && canView && (
                <>
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
                            canAdd={canAdd}
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
                                        logError('Error refreshing invoice:', e);
                                    }
                                }
                            }}
                            loading={loading}
                            i18n={i18n}
                            viewTitleKey={config.viewTitleKey}
                            filenamePrefix={config.filenamePrefix}
                            paymentsModule={configKey?.includes('sales') ? 'sales' : 'purchases'}
                            canEdit={canEdit}
                            canDelete={canDelete}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default TransactionPage;
