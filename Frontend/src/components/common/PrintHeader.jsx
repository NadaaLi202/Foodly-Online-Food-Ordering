import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../services/api';

const normalizeParts = (parts) => parts
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean);

const pickFirst = (...values) => values.find((value) => typeof value === 'string' && value.trim())?.trim() || '';

const PrintHeader = ({ title, rightContent, isRTL, showLogo = true, companyInfo = {} }) => {
    const { t } = useTranslation();
    const { user, companySettings } = useAuth();

    const resolvedCompany = {
        name: pickFirst(
            companyInfo.name,
            companyInfo.company_name,
            companySettings?.company_name,
            user?.name
        ),
        logo_path: pickFirst(
            companyInfo.logo_path,
            companySettings?.logo_path,
            user?.logo_path
        ),
        tax_number: pickFirst(
            companyInfo.tax_number,
            companyInfo.taxNumber,
            companySettings?.tax_number,
            companySettings?.taxNumber,
            user?.taxNumber
        ),
        commercial_register: pickFirst(
            companyInfo.commercial_register,
            companyInfo.commercialReg,
            companyInfo.commercialRegister,
            companyInfo.commercial_registration,
            companySettings?.commercial_register,
            companySettings?.commercialRegister,
            user?.commercialRegister
        ),
        country: pickFirst(companyInfo.country, companySettings?.country, user?.country),
        region: pickFirst(companyInfo.region, companySettings?.region, user?.region),
        address: pickFirst(companyInfo.address, companySettings?.address, user?.address),
        city: pickFirst(companyInfo.city, companySettings?.city, user?.city),
        location: pickFirst(companyInfo.location, companySettings?.location, user?.location)
    };

    const fullLogoUrl = showLogo && resolvedCompany.logo_path
        ? (resolvedCompany.logo_path.startsWith('http') ? resolvedCompany.logo_path : `${BASE_URL}${resolvedCompany.logo_path}`)
        : null;

    const locationText = normalizeParts([
        resolvedCompany.address,
        resolvedCompany.location,
        resolvedCompany.city,
        resolvedCompany.region,
        resolvedCompany.country
    ]).join(' - ');

    return (
        <div
            className={`print-company-header print-header flex justify-between items-start gap-6 mb-6 border-b-2 border-black pb-5 print:mb-8 print:pb-6 ${isRTL ? 'flex-row-reverse' : ''}`}
            dir={isRTL ? 'rtl' : 'ltr'}
        >
            <style>{`
                @media print {
                    .print-signature-footer {
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        width: 100%;
                        display: flex !important;
                        justify-content: space-between;
                        padding: 10px 40px;
                        background: white;
                        border-top: 1px solid #eee;
                        z-index: 1000;
                    }
                    body {
                        padding-bottom: 60px;
                    }
                }
            `}</style>
            <div className={`min-w-0 flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                <div className="company-info space-y-1 text-xs font-bold text-gray-900 print:text-black leading-6 break-words">
                    <p className="text-sm font-black whitespace-pre-line">
                        <strong>{t('general_settings.company_name')}:</strong> {resolvedCompany.name}
                    </p>
                    <p>
                        <strong>{t('general_settings.commercial_register')}:</strong> {resolvedCompany.commercial_register}
                    </p>
                    {resolvedCompany.tax_number && (
                        <p>
                            <strong>{t('general_settings.tax_number')}:</strong> {resolvedCompany.tax_number}
                        </p>
                    )}
                </div>
            </div>

            <div className={`min-w-0 flex-1 ${isRTL ? 'text-left' : 'text-right'}`}>
                {title ? (
                    <h2 className="text-2xl font-black text-gray-900 uppercase mb-2 print:text-black">
                        {title}
                    </h2>
                ) : null}
                {rightContent}
            </div>
        </div>
    );
};

export const PrintFooter = ({ isRTL }) => {
    return (
        <div className={`hidden print:flex print-signature-footer justify-between items-end w-full mt-12 pb-4 ${isRTL ? 'flex-row-reverse' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="text-center" style={{ width: '200px' }}>
                <div className="font-bold text-sm mb-12">{isRTL ? 'المحاسب' : 'Accountant'}</div>
                <div style={{ borderTop: '1px solid black', width: '100%' }}></div>
            </div>
            <div className="text-center" style={{ width: '200px' }}>
                <div className="font-bold text-sm mb-12">{isRTL ? 'المدير' : 'Manager'}</div>
                <div style={{ borderTop: '1px solid black', width: '100%' }}></div>
            </div>
        </div>
    );
};

export default PrintHeader;
