import React from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';

const PendingPage = () => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center max-w-md mx-auto">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="text-amber-500 w-10 h-10" />
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">حسابك قيد المراجعة</h2>
            <p className="text-gray-600 mb-8 font-medium leading-relaxed">
                شكراً لتسجيلك في النظام. طلبك الآن قيد المراجعة من قبل الإدارة. سيتم إشعارك عبر البريد الإلكتروني فور الموافقة على حسابك وتفعيله.
            </p>

            <Link
                to="/"
                className="inline-block bg-[#2a3042] hover:bg-[#1a1d29] text-white font-bold py-2.5 px-8 rounded-lg transition-colors"
            >
                العودة للرئيسية
            </Link>
        </div>
    );
};

export default PendingPage;
