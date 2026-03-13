import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, ChevronLeft } from 'lucide-react';
import api from '../../../services/api.js';
import branchService from '../../../services/branchService.js';
import toast from 'react-hot-toast';

const InvoiceTemplateAdd = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isRtl = i18n.language === 'ar';

    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [language, setLanguage] = useState('ar');
    const [invoiceType, setInvoiceType] = useState('normal');
    const [selectedDesign, setSelectedDesign] = useState('design-1');
    const [isTaxInvoice, setIsTaxInvoice] = useState(false);
    const [showBorders, setShowBorders] = useState(false);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [hoveredDesign, setHoveredDesign] = useState(null);

    const getLanguageOptions = (t) => [
        { id: 'ar', label: t('Arabic', 'العربية'), desc: t('The document will be in Arabic with RTL direction.', 'سيكون المستند باللغة العربية واتجاه rtl.') },
        { id: 'en', label: t('English', 'الإنجليزية'), desc: t('The document will be in English with LTR direction.', 'سيكون المستند باللغة الإنجليزية واتجاه ltr.') },
        { id: 'ar-en', label: t('Arabic and English', 'العربية والإنجليزية'), desc: t('The document will be bilingual with RTL direction.', 'سيكون المستند باللغة العربية والإنجليزية واتجاه rtl.') },
    ];

    const getTypeOptions = (t) => [
        { id: 'normal', label: t('Normal (A4, A5)', 'عادي (A4, A5)'), desc: '' },
        { id: 'thermal', label: t('Thermal', 'حراري'), desc: '' },
    ];

    const designOptions = ['design-1', 'design-2'];

    /* ── SVG building blocks ─────────────────────────────────── */
    const QRBlock = ({ x, y, s = 18 }) => (
        <g>
            <rect x={x} y={y} width={s} height={s} fill="#1a1a1a" />
            <rect x={x + 2} y={y + 2} width={s - 4} height={s - 4} fill="white" />
            <rect x={x + 3} y={y + 3} width={5} height={5} fill="#1a1a1a" />
            <rect x={x + s - 8} y={y + 3} width={5} height={5} fill="#1a1a1a" />
            <rect x={x + 3} y={y + s - 8} width={5} height={5} fill="#1a1a1a" />
            <rect x={x + 8} y={y + 8} width={2} height={2} fill="#1a1a1a" />
            <rect x={x + 11} y={y + 5} width={2} height={2} fill="#1a1a1a" />
            <rect x={x + 5} y={y + 11} width={4} height={2} fill="#1a1a1a" />
            <rect x={x + 10} y={y + 11} width={5} height={2} fill="#1a1a1a" />
        </g>
    );
    const LogoBox = ({ x, y, w = 26, h = 20 }) => (
        <g>
            <rect x={x} y={y} width={w} height={h} fill="none" stroke="#aaa" strokeWidth="0.7" strokeDasharray="3,2" />
            <text x={x + w / 2} y={y + h / 2 - 2} textAnchor="middle" fontSize="3.5" fill="#bbb">ضــع</text>
            <text x={x + w / 2} y={y + h / 2 + 2} textAnchor="middle" fontSize="3.5" fill="#bbb">شعارك</text>
            <text x={x + w / 2} y={y + h / 2 + 6} textAnchor="middle" fontSize="3.5" fill="#bbb">هنــا</text>
        </g>
    );
    const Lines = ({ x, y, w, count = 3, gap = 4, color = '#e5e7eb' }) => (
        <g>{Array.from({ length: count }).map((_, i) => <rect key={i} x={x} y={y + i * gap} width={w} height={1.5} fill={color} rx="0.5" />)}</g>
    );

    /* ── Design 1: Arabic-Only Invoice ──── */
    const D1 = ({ borders }) => (
        <svg viewBox="0 0 120 170" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="170" fill="white" />
            {/* Border */}
            <rect x="3" y="3" width="114" height="164" fill="none" stroke="#e0e0e0" strokeWidth="0.5" />
            {/* Header: QR left, Title center, Logo right */}
            <QRBlock x={8} y={7} s={18} />
            <text x="60" y="12" textAnchor="middle" fontSize="5" fontWeight="bold" fill="#1a1a1a">فاتورة ضريبية</text>
            <text x="60" y="18" textAnchor="middle" fontSize="3.5" fill="#666">الرقم   INV-25-1-000014</text>
            <text x="60" y="22" textAnchor="middle" fontSize="3.5" fill="#666">التاريخ   2025/09/24</text>
            <LogoBox x={88} y={6} w={22} h={20} />
            {/* From / To section */}
            <text x="110" y="34" textAnchor="end" fontSize="3.5" fill="#888">من :</text>
            <text x="110" y="39" textAnchor="end" fontSize="4" fontWeight="bold" fill="#1a1a1a">ضع اسم شركتك</text>
            <text x="110" y="43" textAnchor="end" fontSize="3" fill="#666">العنوان :</text>
            <Lines x={75} y={44} w={35} count={2} gap={3} />
            <text x="60" y="34" textAnchor="end" fontSize="3.5" fill="#888">إلى :</text>
            <Lines x={10} y={36} w={45} count={3} gap={3} />
            {/* Table */}
            <rect x={8} y={54} width={104} height={7} fill="#f3f4f6" stroke={borders ? '#ccc' : 'none'} strokeWidth={borders ? 0.3 : 0} />
            <text x="107" y="59" textAnchor="end" fontSize="3.5" fontWeight="bold" fill="#333">البند</text>
            <text x="78" y="59" textAnchor="middle" fontSize="3.5" fontWeight="bold" fill="#333">الوصف</text>
            <text x="52" y="59" textAnchor="middle" fontSize="3.5" fontWeight="bold" fill="#333">السعر</text>
            <text x="36" y="59" textAnchor="middle" fontSize="3.5" fontWeight="bold" fill="#333">الكمية</text>
            <text x="18" y="59" textAnchor="middle" fontSize="3.5" fontWeight="bold" fill="#333">المجموع</text>
            {/* Table row */}
            <rect x={8} y={61} width={104} height={6} fill="white" stroke={borders ? '#eee' : 'none'} strokeWidth={borders ? 0.3 : 0} />
            <text x="107" y="65" textAnchor="end" fontSize="3" fill="#333">شاشة كمبيوتر حديثة</text>
            <text x="52" y="65" textAnchor="middle" fontSize="3" fill="#333">5,000.00</text>
            <text x="36" y="65" textAnchor="middle" fontSize="3" fill="#333">1</text>
            <text x="18" y="65" textAnchor="middle" fontSize="3" fill="#333">5,000.00</text>
            {/* Totals */}
            <text x="50" y="76" textAnchor="end" fontSize="3.5" fill="#333">المجموع</text>
            <text x="18" y="76" textAnchor="middle" fontSize="3.5" fill="#333">5,000.00</text>
            <line x1={8} y1={78} x2={55} y2={78} stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="50" y="83" textAnchor="end" fontSize="3.5" fill="#333">القيمة المضافة 15%</text>
            <text x="18" y="83" textAnchor="middle" fontSize="3.5" fill="#333">750.00</text>
            <line x1={8} y1={85} x2={55} y2={85} stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="50" y="90" textAnchor="end" fontSize="3.5" fontWeight="bold" fill="#333">الإجمالي ( ﷼ )</text>
            <text x="18" y="90" textAnchor="middle" fontSize="3.5" fontWeight="bold" fill="#333">5,750.00</text>
            <line x1={8} y1={92} x2={55} y2={92} stroke="#333" strokeWidth="0.8" />
            <text x="50" y="97" textAnchor="end" fontSize="3.5" fill="#333">المدفوع</text>
            <text x="18" y="97" textAnchor="middle" fontSize="3.5" fill="#333">5,750.00</text>
            <line x1={8} y1={99} x2={55} y2={99} stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="50" y="104" textAnchor="end" fontSize="3.5" fill="#333">المستحق ( ﷼ )</text>
            <text x="18" y="104" textAnchor="middle" fontSize="3.5" fill="#333">0.00</text>
            {/* Signature */}
            <line x1={8} y1={120} x2={45} y2={120} stroke="#ccc" strokeWidth="0.8" />
            <text x="26" y="125" textAnchor="middle" fontSize="3.5" fill="#999">التوقيع</text>
            {/* Notes */}
            <text x="108" y="135" textAnchor="end" fontSize="4" fontWeight="bold" fill="#333">ملاحظات</text>
        </svg>
    );

    /* ── Design 2: Bilingual Invoice ──── */
    const D2 = ({ borders }) => (
        <svg viewBox="0 0 120 170" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="170" fill="white" />
            {/* Header: Company AR right, Logo center, Company EN left */}
            <text x="112" y="10" textAnchor="end" fontSize="4" fontWeight="bold" fill="#1a1a1a">ضع اسم شركتك</text>
            <Lines x={82} y={12} w={30} count={2} gap={3} />
            <LogoBox x={47} y={5} w={26} h={18} />
            <text x="8" y="10" textAnchor="start" fontSize="3.5" fontWeight="bold" fill="#1a1a1a">Company Name</text>
            <Lines x={8} y={12} w={30} count={2} gap={3} />
            {/* Title */}
            <text x="60" y="30" textAnchor="middle" fontSize="5" fontWeight="bold" fill="#1a1a1a">فاتورة ضريبية</text>
            <text x="60" y="35" textAnchor="middle" fontSize="4" fontWeight="bold" fill="#1a1a1a">TAX INVOICE</text>
            {/* Invoice info left, Client info right */}
            <text x="30" y="42" textAnchor="middle" fontSize="3" fill="#666">الرقم - Number   INV-25-1-000014</text>
            <text x="30" y="46" textAnchor="middle" fontSize="3" fill="#666">التاريخ - Date   2025/09/24</text>
            <Lines x={65} y={40} w={45} count={3} gap={3} />
            {/* Table with bilingual headers */}
            <rect x={8} y={53} width={104} height={8} fill="#f3f4f6" stroke={borders ? '#ccc' : 'none'} strokeWidth={borders ? 0.3 : 0} />
            <text x="105" y="57" textAnchor="end" fontSize="3" fontWeight="bold" fill="#333">البند</text>
            <text x="105" y="60" textAnchor="end" fontSize="2.5" fill="#666">Item</text>
            <text x="75" y="57" textAnchor="middle" fontSize="3" fontWeight="bold" fill="#333">الوصف</text>
            <text x="75" y="60" textAnchor="middle" fontSize="2.5" fill="#666">Description</text>
            <text x="50" y="57" textAnchor="middle" fontSize="3" fontWeight="bold" fill="#333">السعر</text>
            <text x="50" y="60" textAnchor="middle" fontSize="2.5" fill="#666">Price</text>
            <text x="34" y="57" textAnchor="middle" fontSize="3" fontWeight="bold" fill="#333">الكمية</text>
            <text x="34" y="60" textAnchor="middle" fontSize="2.5" fill="#666">Quantity</text>
            <text x="16" y="57" textAnchor="middle" fontSize="3" fontWeight="bold" fill="#333">المجموع</text>
            <text x="16" y="60" textAnchor="middle" fontSize="2.5" fill="#666">Total</text>
            {/* Table row */}
            <rect x={8} y={61} width={104} height={6} fill="white" stroke={borders ? '#eee' : 'none'} strokeWidth={borders ? 0.3 : 0} />
            <text x="105" y="65" textAnchor="end" fontSize="3" fill="#333">شاشة كمبيوتر حديثة</text>
            <text x="50" y="65" textAnchor="middle" fontSize="3" fill="#333">5,000.00</text>
            <text x="34" y="65" textAnchor="middle" fontSize="3" fill="#333">1</text>
            <text x="16" y="65" textAnchor="middle" fontSize="3" fill="#333">5,000.00</text>
            {/* Bilingual Totals */}
            <text x="50" y="76" textAnchor="end" fontSize="3" fill="#333">المجموع</text>
            <text x="50" y="79" textAnchor="end" fontSize="2.5" fill="#666">Subtotal</text>
            <text x="16" y="77" textAnchor="middle" fontSize="3" fill="#333">5,000.00</text>
            <line x1={8} y1={81} x2={55} y2={81} stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="50" y="86" textAnchor="end" fontSize="3" fill="#333">القيمة المضافة 15%</text>
            <text x="16" y="86" textAnchor="middle" fontSize="3" fill="#333">750.00</text>
            <line x1={8} y1={88} x2={55} y2={88} stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="50" y="93" textAnchor="end" fontSize="3" fontWeight="bold" fill="#333">الإجمالي ( ﷼ )</text>
            <text x="50" y="96" textAnchor="end" fontSize="2.5" fill="#666">Total (SAR)</text>
            <text x="16" y="94" textAnchor="middle" fontSize="3" fontWeight="bold" fill="#333">5,750.00</text>
            <line x1={8} y1={98} x2={55} y2={98} stroke="#333" strokeWidth="0.8" />
            <text x="50" y="103" textAnchor="end" fontSize="3" fill="#333">المدفوع</text>
            <text x="50" y="106" textAnchor="end" fontSize="2.5" fill="#666">Paid</text>
            <text x="16" y="104" textAnchor="middle" fontSize="3" fill="#333">5,750.00</text>
            <line x1={8} y1={108} x2={55} y2={108} stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="50" y="113" textAnchor="end" fontSize="3" fill="#333">المستحق ( ﷼ )</text>
            <text x="50" y="116" textAnchor="end" fontSize="2.5" fill="#666">Due (SAR)</text>
            <text x="16" y="114" textAnchor="middle" fontSize="3" fill="#333">0.00</text>
            {/* Signature */}
            <line x1={8} y1={126} x2={45} y2={126} stroke="#ccc" strokeWidth="0.8" />
            <text x="26" y="131" textAnchor="middle" fontSize="3" fill="#999">Signature - التوقيع</text>
            {/* Notes + QR bottom right */}
            <text x="100" y="131" textAnchor="middle" fontSize="3" fill="#999">Notes - ملاحظات</text>
            <QRBlock x={88} y={133} s={18} />
            {/* Bank info bar */}
            <rect x={3} y={157} width={114} height={10} fill="#f3f4f6" />
            <text x="60" y="163" textAnchor="middle" fontSize="2.8" fill="#666">مصرف الراجحي    رقم الحساب : 00000000000000    رقم الايبان : SA0000000000000000000</text>
        </svg>
    );

    /* ── Thermal Design ──── */
    const ThermalDesign = ({ borders }) => (
        <svg viewBox="0 0 80 180" xmlns="http://www.w3.org/2000/svg">
            <rect width="80" height="180" fill="white" />
            {/* Logo */}
            <LogoBox x={22} y={4} w={36} h={28} />
            {/* Company info centered */}
            <text x="40" y="38" textAnchor="middle" fontSize="4.5" fontWeight="bold" fill="#1a1a1a">ضع اسم شركتك</text>
            <text x="40" y="43" textAnchor="middle" fontSize="3" fill="#666">7860 محمد بن عبدالجليل</text>
            <text x="40" y="47" textAnchor="middle" fontSize="3" fill="#666">الرياض</text>
            {/* Title */}
            <text x="40" y="54" textAnchor="middle" fontSize="5" fontWeight="bold" fill="#1a1a1a">فاتورة ضريبية</text>
            <text x="40" y="59" textAnchor="middle" fontSize="3.5" fill="#333">INV-25-1-000012</text>
            <text x="40" y="64" textAnchor="middle" fontSize="3.5" fill="#333">21/09/2025</text>
            {/* Client info centered */}
            <text x="40" y="71" textAnchor="middle" fontSize="3" fill="#333">العميل : مؤسسة النخبة للتجارة العامة</text>
            <text x="40" y="75" textAnchor="middle" fontSize="3" fill="#333">الرقم الضريبي : 302112233400003</text>
            <text x="40" y="79" textAnchor="middle" fontSize="2.5" fill="#333">العنوان : 350 طريق الملك عبدالله, المدينة المنورة</text>
            {/* Table separator */}
            <line x1={5} y1={82} x2={75} y2={82} stroke="#ccc" strokeWidth="0.5" />
            {/* Table header */}
            <text x="72" y="87" textAnchor="end" fontSize="3" fontWeight="bold" fill="#333">البند</text>
            <text x="42" y="87" textAnchor="middle" fontSize="3" fontWeight="bold" fill="#333">السعر</text>
            <text x="28" y="87" textAnchor="middle" fontSize="3" fontWeight="bold" fill="#333">الكمية</text>
            <text x="12" y="87" textAnchor="middle" fontSize="3" fontWeight="bold" fill="#333">المجموع</text>
            <line x1={5} y1={89} x2={75} y2={89} stroke="#ccc" strokeWidth="0.5" />
            {/* Table row */}
            <text x="72" y="94" textAnchor="end" fontSize="3" fill="#333">شاشة كمبيوتر حديثة</text>
            <text x="42" y="94" textAnchor="middle" fontSize="3" fill="#333">5,000.00</text>
            <text x="28" y="94" textAnchor="middle" fontSize="3" fill="#333">1</text>
            <text x="12" y="94" textAnchor="middle" fontSize="3" fill="#333">5,000.00</text>
            {/* Totals */}
            <line x1={5} y1={98} x2={75} y2={98} stroke="#ccc" strokeDasharray="2,2" strokeWidth="0.5" />
            <text x="45" y="104" textAnchor="end" fontSize="3" fill="#333">المجموع</text>
            <text x="12" y="104" textAnchor="middle" fontSize="3" fill="#333">5,000.00</text>
            <line x1={5} y1={106} x2={75} y2={106} stroke="#e5e7eb" strokeDasharray="2,2" strokeWidth="0.5" />
            <text x="45" y="111" textAnchor="end" fontSize="3" fill="#333">القيمة المضافة 15%</text>
            <text x="12" y="111" textAnchor="middle" fontSize="3" fill="#333">750.00</text>
            <line x1={5} y1={113} x2={75} y2={113} stroke="#e5e7eb" strokeDasharray="2,2" strokeWidth="0.5" />
            <text x="45" y="118" textAnchor="end" fontSize="3" fontWeight="bold" fill="#333">الإجمالي ( ﷼ )</text>
            <text x="12" y="118" textAnchor="middle" fontSize="3" fontWeight="bold" fill="#333">5,750.00</text>
            <line x1={5} y1={120} x2={75} y2={120} stroke="#e5e7eb" strokeDasharray="2,2" strokeWidth="0.5" />
            <text x="45" y="125" textAnchor="end" fontSize="3" fill="#333">المدفوع</text>
            <text x="12" y="125" textAnchor="middle" fontSize="3" fill="#333">5,750.00</text>
            <line x1={5} y1={127} x2={75} y2={127} stroke="#e5e7eb" strokeDasharray="2,2" strokeWidth="0.5" />
            <text x="45" y="132" textAnchor="end" fontSize="3" fill="#333">المستحق ( ﷼ )</text>
            <text x="12" y="132" textAnchor="middle" fontSize="3" fill="#333">0.00</text>
            {/* Notes */}
            <text x="40" y="142" textAnchor="middle" fontSize="4" fontWeight="bold" fill="#333">ملاحظات</text>
            {/* QR */}
            <QRBlock x={25} y={148} s={30} />
        </svg>
    );

    const designComponents = [D1, D2];

    /* ── Navigation ──────────────────────────────────────────── */
    const handleNext = () => {
        if (step === 1) {
            const newErrors = {};
            if (!name.trim()) newErrors.name = t('Please enter the name', 'من فضلك أدخل الاسم');
            if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
        }
        setErrors({});
        setStep(s => s + 1);
    };

    const handleBack = () => { setErrors({}); setStep(s => s - 1); };

    const handleStepClick = (s) => {
        if (s < step) { setErrors({}); setStep(s); }
    };

    const handleDesignSelect = (designId) => {
        setSelectedDesign(designId);
        setStep(3);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const direction = language === 'en' ? 'ltr' : 'rtl';

            const headerRows = [
                { text: '{{company.name}}', format: { fontSize: 14, bold: true } },
                { text: `${t('Commercial Register - Register Number', 'السجل التجاري - Register Number')} : {{company.register}}`, format: { fontSize: 11 } },
                { text: `${t('Tax Number', 'الرقم الضريبي - Tax Number')} : {{company.tax_number}}`, format: { fontSize: 11 } },
                { text: '{{branch.city}}', format: { fontSize: 11 } },
                { text: '{{branch.state}}', format: { fontSize: 11 } },
            ];

            const invoiceInfoRows = [
                { text: t('Simplified Tax Invoice', 'فاتورة ضريبية مبسطة'), format: { fontSize: 15, bold: true } },
                { text: 'SIMPLIFIED TAX INVOICE', format: { fontSize: 13, bold: true } },
                { text: `${t('Number', 'الرقم - Number')} : {{invoice.number}}`, format: { fontSize: 11 } },
                { text: `${t('Date', 'التاريخ - Date')} : {{invoice.date}}`, format: { fontSize: 11 } },
            ];

            const partnerClientRows = [
                { text: `${t('Client', 'العميل')} : {{partner.name}}`, format: { fontSize: 12 } },
                { text: `{{partner.address}}`, format: { fontSize: 12 } },
                { text: `{{partner.tax_number}}`, format: { fontSize: 12 } },
            ];

            const partnerSupplierRows = [
                { text: `${t('Supplier', 'المورد')} : {{partner.name}}`, format: { fontSize: 12 } },
                { text: `{{partner.address}}`, format: { fontSize: 12 } },
            ];

            const defaultTitles = {
                saleInvoice: { text: t('Simplified Tax Invoice', 'فاتورة ضريبية مبسطة\nSIMPLIFIED TAX INVOICE'), format: { fontSize: 14, bold: true } },
                saleCreditNote: { text: t('Credit Note', 'فاتورة مرتجعات\nCREDIT NOTE'), format: { fontSize: 14, bold: true } },
                purchaseInvoice: { text: t('Purchase Invoice', 'فاتورة مشتريات\nPURCHASE INVOICE'), format: { fontSize: 14, bold: true } },
                purchaseCreditNote: { text: t('Purchase Credit Note', 'فاتورة مرتجعات مشتريات\nPURCHASE CREDIT NOTE'), format: { fontSize: 14, bold: true } },
                quotation: { text: t('Quotation', 'عرض سعر\nQUOTATION'), format: { fontSize: 14, bold: true } },
                salesOrder: { text: t('Sales Order', 'أمر بيع\nSALES ORDER'), format: { fontSize: 14, bold: true } },
                purchaseRequest: { text: t('Purchase Request', 'طلب شراء\nPURCHASE REQUEST'), format: { fontSize: 14, bold: true } },
                purchaseOrder: { text: t('Purchase Order', 'أمر شراء\nPURCHASE ORDER'), format: { fontSize: 14, bold: true } }
            };

            const { data } = await api.post('/templates', {
                name: name.trim(),
                type: 'invoice',
                page: { direction, pageSize: invoiceType === 'thermal' ? '80mm' : 'A4' },
                logo: { url: '', size: 70, margins: { top: 0, right: 0, bottom: 0, left: 0 } },
                header: { rows: headerRows, invoiceInfoRows, order: 'Logo, Company Info, Invoice Info', titles: defaultTitles },
                partner: { clientRows: partnerClientRows, supplierRows: partnerSupplierRows },
                invoiceType,
                designId: selectedDesign,
                isTaxInvoice,
                showBorders,
            });
            toast.success(t('Invoice template created successfully', 'تم إنشاء قالب الفاتورة بنجاح'));
            navigate(`/dashboard/templates/invoices/${data.template._id}/edit`);
        } catch { toast.error(t('Failed to create template', 'فشل إنشاء القالب')); }
        finally { setSaving(false); }
    };

    /* ── RadioCard ─────────────────────────────────────────── */
    const RadioCard = ({ selected, onClick, label, desc }) => (
        <button onClick={onClick} className={`w-full flex items-center gap-3 p-4 rounded-lg border text-right transition-all ${selected ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selected ? 'border-indigo-500' : 'border-gray-300'}`}>
                {selected && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
            </div>
            <div>
                <span className="text-sm font-bold text-gray-800">{label}</span>
                {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
            </div>
        </button>
    );

    /* ── Step Indicator ────────────────────────────────────── */
    const getStepLabels = (t) => [t('Basic Options', 'الخيارات الأساسية'), t('Choose Design', 'اختيار التصميم'), t('Table Settings', 'إعدادات الجدول')];

    const Step3DesignComponent = invoiceType === 'thermal' ? ThermalDesign : (designComponents[parseInt(selectedDesign.replace('design-', '')) - 1] || D1);

    return (
        <div className="min-h-screen bg-[#f5f7f9] flex flex-col" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="flex-1 flex flex-col mx-4 mb-4">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col flex-1">
                    {/* ── Step Indicator ── */}
                    <div className="flex items-center justify-between px-8 py-4 border-b border-gray-200">
                        {getStepLabels(t).map((label, i) => {
                            const s = i + 1;
                            const isActive = step >= s;
                            const isClickable = s < step;
                            return (
                                <React.Fragment key={s}>
                                    <button
                                        onClick={() => isClickable && handleStepClick(s)}
                                        className={`flex flex-col items-start gap-1 ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                                        disabled={!isClickable}
                                    >
                                        <span className={`text-xs font-bold ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                                            Step {s}
                                        </span>
                                        <span className={`text-sm font-bold ${isActive ? 'text-gray-800' : 'text-gray-400'}`}>
                                            {label}
                                        </span>
                                    </button>
                                    {s < 3 && (
                                        <div className={`flex-1 h-1 mx-4 rounded-full ${step > s ? 'bg-indigo-500' : 'bg-gray-200'}`} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {/* ── Step 1: Basic Options ── */}
                        {step === 1 && (
                            <div className="px-6 py-6 max-w-xl" dir={isRtl ? 'rtl' : 'ltr'}>
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('Name', 'الاسم')} <span className="text-red-500">*</span></label>
                                    <input type="text" value={name} onChange={e => { setName(e.target.value); setErrors(er => ({ ...er, name: undefined })); }}
                                        className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'}`}
                                        placeholder={t('Enter template name', 'أدخل اسم القالب')} />
                                    {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name}</p>}
                                </div>
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('Language', 'اللغة')} <span className="text-red-500">*</span></label>
                                    <div className="space-y-2">
                                        {getLanguageOptions(t).map(opt => <RadioCard key={opt.id} selected={language === opt.id} onClick={() => setLanguage(opt.id)} label={opt.label} desc={opt.desc} />)}
                                    </div>
                                </div>
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('Type', 'النوع')} <span className="text-red-500">*</span></label>
                                    <div className="space-y-2">
                                        {getTypeOptions(t).map(opt => <RadioCard key={opt.id} selected={invoiceType === opt.id} onClick={() => setInvoiceType(opt.id)} label={opt.label} desc={opt.desc} />)}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Step 2: Design Gallery ── */}
                        {step === 2 && (
                            <div className="bg-gray-100 p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {(invoiceType === 'thermal' ? ['design-1'] : designOptions).map((designId) => {
                                        const DesignComponent = invoiceType === 'thermal' ? ThermalDesign : designComponents[parseInt(designId.split('-')[1]) - 1];
                                        const isHovered = hoveredDesign === designId;
                                        return (
                                            <div
                                                key={designId}
                                                className="relative rounded-xl overflow-hidden bg-[#1e1e1e] cursor-pointer transition-transform hover:scale-[1.02]"
                                                style={{ aspectRatio: '3/4' }}
                                                onMouseEnter={() => setHoveredDesign(designId)}
                                                onMouseLeave={() => setHoveredDesign(null)}
                                                onClick={() => handleDesignSelect(designId)}
                                            >
                                                <div className="absolute inset-4 flex items-start justify-center">
                                                    <div className="w-full bg-white rounded shadow-lg overflow-hidden" style={{ maxHeight: '95%' }}>
                                                        <DesignComponent borders={false} />
                                                    </div>
                                                </div>
                                                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                                                    <button
                                                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-xl transition-colors"
                                                        onClick={(e) => { e.stopPropagation(); handleDesignSelect(designId); }}
                                                    >
                                                        Select
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── Step 3: Table Settings + Live Preview ── */}
                        {step === 3 && (
                            <div className="flex flex-col lg:flex-row gap-6 p-6" dir={isRtl ? 'rtl' : 'ltr'}>
                                <div className="lg:w-72 shrink-0 space-y-4">
                                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                                        <h3 className="text-sm font-bold text-gray-800 mb-4">{t('Table Settings', 'إعدادات الجدول')}</h3>
                                        <label className="flex items-center gap-3 cursor-pointer mb-3">
                                            <input type="checkbox" checked={isTaxInvoice} onChange={e => setIsTaxInvoice(e.target.checked)}
                                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                                            <span className="text-sm text-gray-700">{t('Tax Invoice', 'فاتورة ضريبية')}</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="checkbox" checked={showBorders} onChange={e => setShowBorders(e.target.checked)}
                                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                                            <span className="text-sm text-gray-700">{t('Show Borders', 'إظهار الحدود')}</span>
                                        </label>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {t('Selected Design:', 'التصميم المحدد:')} <span className="font-bold text-gray-600">{selectedDesign.replace('design-', t('Invoice Template ', 'قالب فاتورة '))}</span>
                                    </div>
                                </div>
                                <div className="flex-1 flex justify-center">
                                    <div className={`bg-[#1e1e1e] rounded-xl p-1 w-full ${invoiceType === 'thermal' ? 'max-w-[280px]' : 'max-w-lg'}`} style={{ aspectRatio: invoiceType === 'thermal' ? '1/2' : '3/4' }}>
                                        <div className="bg-white rounded shadow-lg overflow-hidden w-full h-full">
                                            <Step3DesignComponent borders={showBorders} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Footer ── */}
                    {(step === 1 || step === 3) && (
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white" dir={isRtl ? 'rtl' : 'ltr'}>
                            {step === 1 && (
                                <>
                                    <Link to="/dashboard/templates/invoices" className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">{t('Cancel', 'إلغاء')}</Link>
                                    <button onClick={handleNext} className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-colors">{t('Next', 'التالي')}</button>
                                </>
                            )}
                            {step === 3 && (
                                <>
                                    <button onClick={handleBack} className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">{t('Previous', 'السابق')}</button>
                                    <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors">
                                        {saving ? t('Saving...', 'جارٍ الحفظ...') : t('Save', 'حفظ')}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InvoiceTemplateAdd;
