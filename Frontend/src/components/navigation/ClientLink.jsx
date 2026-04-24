import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { paths } from '../../utils/navigationhelpers';

/**
 * Clickable client name that navigates to Client Details (Customers page with id).
 * Use in: Invoices, Payments, Transactions, etc.
 */
const ClientLink = ({ client, clientId, children, className = '', isSupplier = false }) => {
    const id = client?._id || clientId;
    const displayName = client?.name ?? children ?? '—';

    if (!id) return <span className={className}>{displayName}</span>;

    const to = isSupplier ? paths.supplierDetails(id) : paths.clientDetails(id);

    return (
        <Link
            to={to}
            className={`text-indigo-600 hover:text-indigo-800 hover:underline font-medium transition-colors ${className}`}
        >
            {displayName}
        </Link>
    );
};

export default ClientLink;
