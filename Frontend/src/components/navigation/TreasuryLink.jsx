import React from 'react';
import { Link } from 'react-router-dom';
import { paths } from '../../utils/navigationhelpers';

/**
 * Clickable Safe/Bank label that navigates to Safe or Bank Details.
 * treasury: 'main' | 'bank'
 */
const TreasuryLink = ({ treasury = 'main', label, className = '', module = 'sales' }) => {
    const to = treasury === 'bank' ? paths.bankDetails() : paths.safeDetails('main');
    const displayLabel = label ?? (treasury === 'main' ? 'Main Treasury' : 'Main Bank Account');

    return (
        <Link
            to={to}
            className={`text-indigo-600 hover:text-indigo-800 hover:underline font-medium transition-colors ${className}`}
        >
            {displayLabel}
        </Link>
    );
};

export default TreasuryLink;
