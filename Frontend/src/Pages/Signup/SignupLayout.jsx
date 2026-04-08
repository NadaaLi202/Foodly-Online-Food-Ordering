import React, { createContext, useContext, useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const SignupContext = createContext();

export const useSignup = () => useContext(SignupContext);

const SignupLayout = () => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar' || true; // Force RTL for this UI by default as requested

    // Shared state across the wizard
    const [signupData, setSignupData] = useState({
        adminName: '',
        email: '',
        phone: '',
        password: '',
        name: '', // companyName
        slug: '', // loginSlug
        commercialRegister: '',
        taxNumber: '',
        country: 'المملكة العربية السعودية',
        address: '',
        city: '',
        priceType: 'before_vat', // default
        zatcaEnabled: true // default
    });

    const updateData = (newData) => {
        setSignupData(prev => ({ ...prev, ...newData }));
    };

    return (
        <SignupContext.Provider value={{ signupData, updateData }}>
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans relative" dir={isRTL ? 'rtl' : 'ltr'}>
                <Link to="/" className={`absolute top-6 ${isRTL ? 'left-6' : 'right-6'} flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100`}>
                    <span className={isRTL ? '' : 'rotate-180'}>&rarr;</span>
                    العودة للرئيسية
                </Link>
                {/* Logo Section */}
                <div className="mb-8 flex flex-col items-center">
                    <div className="flex items-center gap-3">
                        <h1 className="text-5xl font-extrabold text-[#4f46e5]">دفاتر المحاسب</h1>
                        <div className="w-16 h-16 bg-[#4f46e5] rounded-full flex items-center justify-center relative">
                            <div className="w-10 h-10 bg-white rounded-full"></div>
                            <div className="w-4 h-4 bg-[#4f46e5] rounded-full absolute"></div>
                        </div>
                    </div>
                </div>

                {/* Form Container */}
                <div className="w-full max-w-3xl">
                    <Outlet />
                </div>
            </div>
        </SignupContext.Provider>
    );
};

export default SignupLayout;
