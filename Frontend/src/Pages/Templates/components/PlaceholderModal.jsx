import React from 'react';
import toast from 'react-hot-toast';

const PLACEHOLDERS = [
    { label: 'اسم الشركة', tag: '{{company.name}}' },
    { label: 'السجل التجاري', tag: '{{company.register}}' },
    { label: 'الرقم الضريبي', tag: '{{company.tax_number}}' },
    { label: 'هاتف الشركة', tag: '{{company.phone}}' },
    { label: 'عملة الشركة', tag: '{{company.currency.ar}}' },
    { label: 'اسم الفرع', tag: '{{branch.name}}' },
    { label: 'هاتف الفرع', tag: '{{branch.phone}}' },
    { label: 'سجل الفرع التجاري', tag: '{{branch.commercial_register}}' },
    { label: 'العنوان الأول', tag: '{{branch.address_line_1}}' },
    { label: 'العنوان الثاني', tag: '{{branch.address_line_2}}' },
    { label: 'الحي', tag: '{{branch.neighborhood}}' },
    { label: 'المدينة', tag: '{{branch.city}}' },
    { label: 'المنطقة', tag: '{{branch.region}}' },
    { label: 'الرمز البريدي', tag: '{{branch.postal_code}}' },
    { label: 'الدولة', tag: '{{branch.country}}' },
    { label: 'رقم الفاتورة', tag: '{{invoice.number}}' },
    { label: 'تاريخ الفاتورة', tag: '{{invoice.date}}' },
    { label: 'تاريخ الاستحقاق', tag: '{{invoice.due_date}}' },
    { label: 'نوع الفاتورة', tag: '{{invoice.type}}' },
    { label: 'اسم العميل', tag: '{{partner.name}}' },
    { label: 'الرقم الضريبي للعميل', tag: '{{partner.tax_number}}' },
    { label: 'سجل العميل التجاري', tag: '{{partner.register}}' },
    { label: 'عنوان العميل', tag: '{{partner.address}}' },
    { label: 'مدينة العميل', tag: '{{partner.city}}' },
    { label: 'دولة العميل', tag: '{{partner.country}}' },
    { label: 'هاتف العميل', tag: '{{partner.phone}}' },
    { label: 'بريد العميل', tag: '{{partner.email}}' },
    { label: 'اسم المنتج', tag: '{{product.name}}' },
    { label: 'السعر', tag: '{{price}}' },
    { label: 'الكمية', tag: '{{quantity}}' },
    { label: 'صورة الباركود', tag: '{{barcode_image}}' },
    { label: 'نص الباركود', tag: '{{barcode_text}}' },
];

const PlaceholderModal = ({ onClose }) => {
    const handleCopy = (tag) => {
        navigator.clipboard.writeText(tag).then(() => {
            toast.success('تم النسخ');
        }).catch(() => {
            // Fallback for older browsers
            const ta = document.createElement('textarea');
            ta.value = tag;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            toast.success('تم النسخ');
        });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/20" onClick={onClose} />
            <div className="relative bg-white rounded-lg shadow-2xl w-[600px] max-h-[80vh] flex flex-col" dir="rtl">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 left-3 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors z-10"
                >
                    ✕
                </button>

                {/* Table */}
                <div className="overflow-y-auto flex-1 mt-10">
                    <table className="w-full">
                        <tbody>
                            {PLACEHOLDERS.map((p, i) => (
                                <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                    <td className="px-4 py-3 text-sm text-right text-gray-800 font-medium w-1/3">
                                        {p.label}
                                    </td>
                                    <td className="px-4 py-3 text-center w-16">
                                        <button
                                            onClick={() => handleCopy(p.tag)}
                                            className="px-3 py-1 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded font-medium transition-colors"
                                        >
                                            نسخ
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-left text-gray-500 font-mono" dir="ltr">
                                        {p.tag}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PlaceholderModal;
