import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../services/api';

const PrintHeader = ({ title, rightContent, isRTL }) => {
    const { companySettings } = useAuth();
    const { company_name, logo_path } = companySettings || {};

    const fullLogoUrl = logo_path ? (logo_path.startsWith('http') ? logo_path : `${BASE_URL}${logo_path}`) : null;

    return (
        <div className={`flex justify-between items-start mb-6 border-b border-gray-50 pb-6 print:mb-8 print:pb-8 ${isRTL ? 'flex-row-reverse' : ''}`} dir="auto">
            <div className={isRTL ? 'text-right' : 'text-left'}>
                <div className={`flex flex-col gap-3 ${isRTL ? 'items-end' : 'items-start'}`}>
                    {fullLogoUrl ? (
                        <img src={fullLogoUrl} alt={company_name || 'Company'} className="h-16 w-auto object-contain max-w-[200px] rounded-sm" />
                    ) : null}
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                        {company_name || 'مؤسسة / شركة'}
                    </h1>
                </div>
            </div>
            <div className={isRTL ? 'text-left' : 'text-right'}>
                {title && (
                    <h2 className="text-4xl font-black text-gray-200 uppercase tracking-widest mb-2 print:text-gray-400">{title}</h2>
                )}
                {rightContent}
            </div>
        </div>
    );
};

export default PrintHeader;
