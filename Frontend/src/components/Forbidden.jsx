import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';

const Forbidden = () => {
    const navigate = useNavigate();

    return (
        <div
            className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6"
            dir="rtl"
        >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 text-red-400 mb-6">
                <ShieldOff size={40} />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                غير مصرح بالوصول
            </h2>
            <p className="text-gray-500 mb-8 max-w-sm">
                ليس لديك الصلاحيات الكافية لعرض هذه الصفحة. يرجى التواصل مع مدير النظام.
            </p>

            <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
            >
                العودة للرئيسية
            </button>
        </div>
    );
};

export default Forbidden;
