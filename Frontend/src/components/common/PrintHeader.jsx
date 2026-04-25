import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../services/api';

const normalizeParts = (parts) => parts
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean);

const pickFirst = (...values) => values.find((value) => typeof value === 'string' && value.trim())?.trim() || '';

const PrintHeader = ({ title, rightContent, isRTL, showLogo = true, companyInfo = {} }) => {
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
            className={`print-company-header print-header flex justify-between items-start gap-6 mb-6 border-b border-gray-200 pb-5 print:mb-8 print:pb-6 ${isRTL ? 'flex-row-reverse' : ''}`}
            dir={isRTL ? 'rtl' : 'ltr'}
        >
            <div className={`min-w-0 flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                {fullLogoUrl ? (
                    <div className="print-logo-wrapper inline-flex max-w-[200px]">
                        <img
                            src={fullLogoUrl}
                            alt={resolvedCompany.name || 'Company'}
                            className="logo header-logo h-16 w-auto object-contain max-w-[200px] rounded-sm"
                        />
                    </div>
                ) : null}

                {!showLogo ? (
                    <div className="company-info space-y-1 text-xs font-medium text-gray-700 print:text-black leading-6 break-words">
                        <p className="text-sm font-black text-gray-900 print:text-black whitespace-pre-line">
                            <strong>{'\u0627\u0633\u0645 \u0627\u0644\u0634\u0631\u0643\u0629:'}</strong> {resolvedCompany.name}
                        </p>
                        <p>
                            <strong>{'\u0627\u0644\u0633\u062c\u0644 \u0627\u0644\u062a\u062c\u0627\u0631\u064a:'}</strong> {resolvedCompany.commercial_register}
                        </p>
                        <p>
                            <strong>{'\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0636\u0631\u064a\u0628\u064a:'}</strong> {resolvedCompany.tax_number}
                        </p>
                        <p>
                            <strong>{'\u0627\u0644\u0639\u0646\u0648\u0627\u0646:'}</strong> {locationText}
                        </p>
                    </div>
                ) : (
                    <h1 className="text-xl font-black text-gray-900 tracking-tight print:text-black whitespace-pre-line">
                        {resolvedCompany.name}
                    </h1>
                )}
            </div>

            <div className={`min-w-0 flex-1 ${isRTL ? 'text-left' : 'text-right'}`}>
                {title ? (
                    <h2 className="text-3xl font-black text-gray-500 uppercase tracking-widest mb-2 print:text-black">
                        {title}
                    </h2>
                ) : null}
                {rightContent}
            </div>
        </div>
    );
};

export default PrintHeader;
