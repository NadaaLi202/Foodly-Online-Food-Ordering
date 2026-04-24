import React from 'react';
import { Link } from 'react-router-dom';
import { paths } from '../../utils/navigationhelpers';

/**
 * Clickable Operation Type badge that navigates to filtered payments for that client.
 * operationType: 'receive' | 'spend'
 * module: 'sales' | 'purchases'
 */
const OperationTypeLink = ({ operationType, contactId, contact, module = 'sales', label, className = '' }) => {
    const id = contact?._id || contactId;
    const getPath = module === 'purchases' ? paths.supplierPayments : paths.salesPayments;
    const to = getPath({ contactId: id, operationType });

    return (
        <Link
            to={to}
            className={`inline-flex px-2 py-1 text-xs font-bold rounded-full transition-colors ${className} ${
                operationType === 'receive'
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            }`}
        >
            {label}
        </Link>
    );
};

export default OperationTypeLink;
