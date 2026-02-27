import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, ChevronLeft } from 'lucide-react';
import api from '../../../services/api.js';
import branchService from '../../../services/branchService.js';
import toast from 'react-hot-toast';

const InvoiceTemplateAdd = () => {
    const { i18n } = useTranslation();
    const navigate = useNavigate();
    const isRtl = i18n.language === 'ar';

    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [language, setLanguage] = useState('ar');
    const [invoiceType, setInvoiceType] = useState('normal');
    const [selectedDesign, setSelectedDesign] = useState('design-1');
    const [branches, setBranches] = useState([]);
    const [selectedBranches, setSelectedBranches] = useState([]);
    const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        branchService.getAllBranches()
            .then(data => setBranches(data.branches || []))
            .catch(() => setBranches([]));
    }, []);

    const languageOptions = [
        { id: 'ar', label: 'العربية', desc: 'سيكون المستند باللغة العربية.' },
        { id: 'en', label: 'الإنجليزية', desc: 'سيكون المستند باللغة الإنجليزية.' },
        { id: 'ar-en', label: 'العربية والإنجليزية', desc: 'سيكون المستند باللغة العربية والإنجليزية.' },
    ];

    const typeOptions = [
        { id: 'normal', label: 'عادي (A4)', desc: 'طباعة عادية على ورق A4.' },
        { id: 'thermal', label: 'حراري', desc: 'طباعة على طابعة حرارية.' },
    ];

    const designOptions = [
        'design-1', 'design-2', 'design-3', 'design-4', 'design-5',
        'design-6', 'design-7', 'design-8', 'design-9', 'design-10'
    ];

    // Common SVG building blocks
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
            <text x={x + w / 2} y={y + h / 2 + 2} textAnchor="middle" fontSize="4" fill="#bbb">شعار</text>
        </g>
    );
    const Lines = ({ x, y, w, count = 3, gap = 4, color = '#e5e7eb' }) => (
        <g>{Array.from({ length: count }).map((_, i) => <rect key={i} x={x} y={y + i * gap} width={w} height={1.5} fill={color} rx="0.5" />)}</g>
    );
    const TableHeader = ({ y, bg = '#f0f2f5' }) => (
        <g>
            <rect x={10} y={y} width={100} height={7} fill={bg} />
            {[10, 32, 55, 78, 98].map((cx, i) => <rect key={i} x={cx} y={y + 1} width={i === 0 ? 20 : i === 4 ? 12 : 18} height={5} fill={bg === '#f0f2f5' ? '#d1d5db' : '#c7d2fe'} rx="0.5" />)}
        </g>
    );
    const TableRows = ({ y, rows = 3 }) => (
        <g>{Array.from({ length: rows }).map((_, i) => (
            <g key={i}>
                <rect x={10} y={y + i * 6} width={100} height={5} fill={i % 2 === 0 ? 'white' : '#fafafa'} />
                {[10, 32, 55, 78, 98].map((cx, j) => <rect key={j} x={cx} y={y + i * 6 + 1} width={j === 0 ? 20 : j === 4 ? 12 : 18} height={3} fill="#e5e7eb" rx="0.5" />)}
            </g>
        ))}</g>
    );

    // D1: Logo-dashed top-right, company info top-left, title center, QR bottom-right
    const D1 = () => (
        <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="160" fill="white" />
            <text x="60" y="14" textAnchor="middle" fontSize="5.5" fontWeight="bold" fill="#1a1a1a">فاتورة ضريبية</text>
            <Lines x={10} y={18} w={40} count={3} gap={3} />
            <LogoBox x={90} y={6} w={22} h={18} />
            <Lines x={10} y={30} w={30} count={2} gap={3} />
            <Lines x={10} y={42} w={30} count={3} gap={3} />
            <TableHeader y={58} />
            <TableRows y={65} rows={3} />
            <Lines x={60} y={90} w={50} count={4} gap={4} />
            <line x1={10} y1={115} x2={55} y2={115} stroke="#ccc" strokeWidth="0.8" />
            <text x="32" y="120" textAnchor="middle" fontSize="4" fill="#999">التوقيع</text>
            <QRBlock x={87} y={94} s={22} />
            <text x="98" y={118} textAnchor="middle" fontSize="3.5" fill="#999">ملاحظات</text>
        </svg>
    );

    // D2: Logo box top-center (smaller dashed), company info rows, QR bottom-right
    const D2 = () => (
        <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="160" fill="white" />
            <text x="60" y="14" textAnchor="middle" fontSize="5.5" fontWeight="bold" fill="#1a1a1a">فاتورة ضريبية</text>
            <Lines x={10} y={18} w={40} count={3} gap={3} />
            <LogoBox x={47} y={6} w={26} h={20} />
            <Lines x={10} y={30} w={30} count={2} gap={3} />
            <Lines x={10} y={42} w={30} count={3} gap={3} />
            <TableHeader y={58} />
            <TableRows y={65} rows={3} />
            <Lines x={60} y={90} w={50} count={4} gap={4} />
            <line x1={10} y1={115} x2={55} y2={115} stroke="#ccc" strokeWidth="0.8" />
            <text x="32" y="120" textAnchor="middle" fontSize="4" fill="#999">التوقيع</text>
            <QRBlock x={87} y={94} s={22} />
            <text x="98" y={118} textAnchor="middle" fontSize="3.5" fill="#999">ملاحظات</text>
        </svg>
    );

    // D3: Large QR top-LEFT, logo box top-right, full-width from/to two columns
    const D3 = () => (
        <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="160" fill="white" />
            <QRBlock x={8} y={6} s={26} />
            <text x="60" y="14" textAnchor="middle" fontSize="5.5" fontWeight="bold" fill="#1a1a1a">فاتورة ضريبية</text>
            <Lines x={42} y={18} w={40} count={2} gap={3} />
            <LogoBox x={90} y={6} w={22} h={18} />
            <rect x={10} y={36} width={47} height={20} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="13" y="42" fontSize="4" fill="#555">من:</text>
            <Lines x={13} y={44} w={40} count={3} gap={3} />
            <rect x={63} y={36} width={47} height={20} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="66" y="42" fontSize="4" fill="#555">إلى:</text>
            <Lines x={66} y={44} w={40} count={3} gap={3} />
            <TableHeader y={60} />
            <TableRows y={67} rows={3} />
            <Lines x={60} y={90} w={50} count={4} gap={4} />
            <line x1={10} y1={115} x2={55} y2={115} stroke="#ccc" strokeWidth="0.8" />
            <text x="32" y="120" textAnchor="middle" fontSize="4" fill="#999">التوقيع</text>
            <text x="98" y={120} textAnchor="middle" fontSize="3.5" fill="#999">ملاحظات</text>
        </svg>
    );

    // D4: QR top-center (large, below title), logo box top-right, two-column from/to
    const D4 = () => (
        <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="160" fill="white" />
            <text x="60" y="10" textAnchor="middle" fontSize="5.5" fontWeight="bold" fill="#1a1a1a">فاتورة ضريبية</text>
            <Lines x={10} y={13} w={40} count={2} gap={3} />
            <QRBlock x={47} y={6} s={26} />
            <LogoBox x={90} y={6} w={22} h={18} />
            <rect x={10} y={36} width={47} height={20} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="13" y="42" fontSize="4" fill="#555">من:</text>
            <Lines x={13} y={44} w={40} count={3} gap={3} />
            <rect x={63} y={36} width={47} height={20} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="66" y="42" fontSize="4" fill="#555">إلى:</text>
            <Lines x={66} y={44} w={40} count={3} gap={3} />
            <TableHeader y={60} />
            <TableRows y={67} rows={3} />
            <Lines x={60} y={90} w={50} count={4} gap={4} />
            <line x1={10} y1={115} x2={55} y2={115} stroke="#ccc" strokeWidth="0.8" />
            <text x="32" y="120" textAnchor="middle" fontSize="4" fill="#999">التوقيع</text>
            <text x="98" y={120} textAnchor="middle" fontSize="3.5" fill="#999">ملاحظات</text>
        </svg>
    );

    // D5: Logo box top-center only (no QR in header), two-column from/to
    const D5 = () => (
        <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="160" fill="white" />
            <text x="60" y="10" textAnchor="middle" fontSize="5.5" fontWeight="bold" fill="#1a1a1a">فاتورة ضريبية</text>
            <Lines x={10} y={13} w={40} count={2} gap={3} />
            <LogoBox x={47} y={6} w={26} h={20} />
            <rect x={10} y={32} width={47} height={20} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="13" y="38" fontSize="4" fill="#555">من:</text>
            <Lines x={13} y={40} w={40} count={3} gap={3} />
            <rect x={63} y={32} width={47} height={20} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="66" y="38" fontSize="4" fill="#555">إلى:</text>
            <Lines x={66} y={40} w={40} count={3} gap={3} />
            <TableHeader y={56} />
            <TableRows y={63} rows={3} />
            <Lines x={60} y={87} w={50} count={4} gap={4} />
            <line x1={10} y1={112} x2={55} y2={112} stroke="#ccc" strokeWidth="0.8" />
            <text x="32" y="117" textAnchor="middle" fontSize="4" fill="#999">التوقيع</text>
            <text x="98" y={117} textAnchor="middle" fontSize="3.5" fill="#999">ملاحظات</text>
        </svg>
    );

    // D6: Company name bold top-center, company details left+right, logo center, invoice title below
    const D6 = () => (
        <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="160" fill="white" />
            <text x="60" y="10" textAnchor="middle" fontSize="5" fontWeight="bold" fill="#1a1a1a">دفاتر للدعاية والإعلان</text>
            <Lines x={10} y={13} w={45} count={3} gap={3} />
            <LogoBox x={47} y={5} w={26} h={18} />
            <Lines x={75} y={13} w={35} count={3} gap={3} />
            <text x="60" y="30" textAnchor="middle" fontSize="5" fontWeight="bold" fill="#1a1a1a">فاتورة ضريبية مبسطة</text>
            <Lines x={25} y={33} w={30} count={2} gap={3} />
            <Lines x={65} y={33} w={30} count={2} gap={3} />
            <Lines x={10} y={44} w={55} count={3} gap={3} />
            <TableHeader y={58} />
            <TableRows y={65} rows={3} />
            <Lines x={60} y={90} w={50} count={4} gap={4} />
            <line x1={10} y1={115} x2={55} y2={115} stroke="#ccc" strokeWidth="0.8" />
            <text x="32" y="120" textAnchor="middle" fontSize="4" fill="#999">التوقيع</text>
            <QRBlock x={87} y={94} s={22} />
            <text x="98" y={118} textAnchor="middle" fontSize="3.5" fill="#999">ملاحظات</text>
        </svg>
    );

    // D7: Large QR center-top with title+number inside, logo box top-right
    const D7 = () => (
        <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="160" fill="white" />
            <QRBlock x={47} y={6} s={26} />
            <text x="60" y="38" textAnchor="middle" fontSize="5.5" fontWeight="bold" fill="#1a1a1a">فاتورة ضريبية</text>
            <Lines x={10} y={42} w={35} count={2} gap={3} />
            <LogoBox x={90} y={6} w={22} h={18} />
            <rect x={10} y={50} width={47} height={18} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="13" y="56" fontSize="4" fill="#555">من:</text>
            <Lines x={13} y={58} w={40} count={2} gap={3} />
            <rect x={63} y={50} width={47} height={18} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="66" y="56" fontSize="4" fill="#555">إلى:</text>
            <Lines x={66} y={58} w={40} count={2} gap={3} />
            <TableHeader y={70} />
            <TableRows y={77} rows={3} />
            <Lines x={60} y={100} w={50} count={4} gap={4} />
            <line x1={10} y1={125} x2={55} y2={125} stroke="#ccc" strokeWidth="0.8" />
            <text x="32" y="130" textAnchor="middle" fontSize="4" fill="#999">التوقيع</text>
            <text x="98" y={130} textAnchor="middle" fontSize="3.5" fill="#999">ملاحظات</text>
        </svg>
    );

    // D8: Logo box top-left, Large QR top-center, company info top-right (3-column header)
    const D8 = () => (
        <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="160" fill="white" />
            <LogoBox x={8} y={6} w={22} h={20} />
            <QRBlock x={47} y={6} s={26} />
            <Lines x={82} y={9} w={30} count={4} gap={3} />
            <text x="60" y="36" textAnchor="middle" fontSize="5" fontWeight="bold" fill="#1a1a1a">فاتورة ضريبية</text>
            <Lines x={10} y={39} w={35} count={2} gap={3} />
            <Lines x={70} y={39} w={40} count={2} gap={3} />
            <rect x={10} y={47} width={47} height={18} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="13" y="53" fontSize="4" fill="#555">من:</text>
            <Lines x={13} y={55} w={40} count={2} gap={3} />
            <rect x={63} y={47} width={47} height={18} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="66" y="53" fontSize="4" fill="#555">إلى:</text>
            <Lines x={66} y={55} w={40} count={2} gap={3} />
            <TableHeader y={68} />
            <TableRows y={75} rows={3} />
            <Lines x={60} y={98} w={50} count={4} gap={4} />
            <line x1={10} y1={123} x2={55} y2={123} stroke="#ccc" strokeWidth="0.8" />
            <text x="32" y="128" textAnchor="middle" fontSize="4" fill="#999">التوقيع</text>
            <text x="98" y={128} textAnchor="middle" fontSize="3.5" fill="#999">ملاحظات</text>
        </svg>
    );

    // D9: Logo box top-left, QR top-right corner, title center
    const D9 = () => (
        <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="160" fill="white" />
            <LogoBox x={8} y={6} w={22} h={20} />
            <text x="60" y="14" textAnchor="middle" fontSize="5.5" fontWeight="bold" fill="#1a1a1a">فاتورة ضريبية</text>
            <Lines x={38} y={17} w={35} count={2} gap={3} />
            <QRBlock x={90} y={6} s={22} />
            <Lines x={10} y={32} w={35} count={2} gap={3} />
            <Lines x={75} y={32} w={35} count={3} gap={3} />
            <rect x={10} y={44} width={47} height={18} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="13" y="50" fontSize="4" fill="#555">من:</text>
            <Lines x={13} y={52} w={40} count={2} gap={3} />
            <rect x={63} y={44} width={47} height={18} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="66" y="50" fontSize="4" fill="#555">إلى:</text>
            <Lines x={66} y={52} w={40} count={2} gap={3} />
            <TableHeader y={65} />
            <TableRows y={72} rows={3} />
            <Lines x={60} y={95} w={50} count={4} gap={4} />
            <line x1={10} y1={120} x2={55} y2={120} stroke="#ccc" strokeWidth="0.8" />
            <text x="32" y="125" textAnchor="middle" fontSize="4" fill="#999">التوقيع</text>
            <text x="98" y={125} textAnchor="middle" fontSize="3.5" fill="#999">ملاحظات</text>
        </svg>
    );

    // D10: Logo top-left (small), Large QR top-center, company info top-right (wider columns)
    const D10 = () => (
        <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="160" fill="white" />
            <LogoBox x={6} y={6} w={20} h={24} />
            <QRBlock x={47} y={5} s={26} />
            <Lines x={80} y={9} w={34} count={5} gap={3} />
            <text x="60" y="40" textAnchor="middle" fontSize="5" fontWeight="bold" fill="#1a1a1a">فاتورة ضريبية</text>
            <Lines x={10} y={43} w={35} count={2} gap={3} />
            <Lines x={70} y={43} w={40} count={2} gap={3} />
            <rect x={10} y={51} width={47} height={18} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="13" y="57" fontSize="4" fill="#555">من:</text>
            <Lines x={13} y={59} w={40} count={2} gap={3} />
            <rect x={63} y={51} width={47} height={18} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="66" y="57" fontSize="4" fill="#555">إلى:</text>
            <Lines x={66} y={59} w={40} count={2} gap={3} />
            <TableHeader y={72} />
            <TableRows y={79} rows={3} />
            <Lines x={60} y={102} w={50} count={4} gap={4} />
            <line x1={10} y1={127} x2={55} y2={127} stroke="#ccc" strokeWidth="0.8" />
            <text x="32" y="132" textAnchor="middle" fontSize="4" fill="#999">التوقيع</text>
            <text x="98" y={132} textAnchor="middle" fontSize="3.5" fill="#999">ملاحظات</text>
        </svg>
    );

    const designComponents = [D1, D2, D3, D4, D5, D6, D7, D8, D9, D10];

    const handleNext = () => {
        if (step === 1) {
            const newErrors = {};
            if (!name.trim()) newErrors.name = 'من فضلك أدخل الاسم';
            if (selectedBranches.length === 0) newErrors.branches = 'من فضلك اختر فرع واحد على الأقل';
            if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
        }
        setErrors({});
        setStep(s => s + 1);
    };

    const handleBack = () => { setErrors({}); setStep(s => s - 1); };

    const handleSave = async () => {
        setSaving(true);
        try {
            const direction = language === 'en' ? 'ltr' : 'rtl';
            const { data } = await api.post('/templates', {
                name: name.trim(),
                type: 'invoice',
                page: { direction },
                invoiceType,
                designId: selectedDesign,
                branches: selectedBranches,
            });
            toast.success('تم إنشاء قالب الفاتورة بنجاح');
            navigate(`/dashboard/templates/invoices/${data.template._id}/edit`);
        } catch { toast.error('فشل إنشاء القالب'); }
        finally { setSaving(false); }
    };

    const toggleBranch = (id) => {
        setSelectedBranches(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
        setErrors(e => ({ ...e, branches: undefined }));
    };

    /* ── Breadcrumbs ─────────────────────────────────────────── */
    const Breadcrumbs = () => (
        <div className="flex items-center gap-1 mb-6 px-4 pt-4">
            <Link to="/dashboard" className="flex items-center justify-center w-9 h-9 rounded bg-white border border-gray-200 hover:bg-gray-50 shadow-sm">
                <Home size={16} className="text-gray-500" />
            </Link>
            <ChevronLeft size={14} className="text-gray-300 mx-1" />
            <Link to="/dashboard/templates" className="px-3 h-9 flex items-center rounded bg-white border border-gray-200 hover:bg-gray-50 text-sm text-gray-600 shadow-sm">تصاميم القوالب</Link>
            <ChevronLeft size={14} className="text-gray-300 mx-1" />
            <Link to="/dashboard/templates/invoices" className="px-3 h-9 flex items-center rounded bg-white border border-gray-200 hover:bg-gray-50 text-sm text-gray-600 shadow-sm">قوالب الفواتير</Link>
            <ChevronLeft size={14} className="text-gray-300 mx-1" />
            <span className="px-3 h-9 flex items-center rounded bg-white border border-gray-200 text-sm font-semibold text-gray-800 shadow-sm">إضافة</span>
        </div>
    );

    /* ── RadioCard helper ─────────────────────────────────────── */
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

    /* ── Step 1: Settings ─────────────────────────────────────── */
    const Step1 = () => (
        <div className="px-6 py-4 max-w-xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            {/* Name */}
            <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">الاسم <span className="text-red-500">*</span></label>
                <input type="text" value={name} onChange={e => { setName(e.target.value); setErrors(er => ({ ...er, name: undefined })); }}
                    className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'}`}
                    placeholder="أدخل اسم القالب" />
                {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name}</p>}
            </div>

            {/* Language */}
            <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">اللغة <span className="text-red-500">*</span></label>
                <div className="space-y-2">
                    {languageOptions.map(opt => <RadioCard key={opt.id} selected={language === opt.id} onClick={() => setLanguage(opt.id)} label={opt.label} desc={opt.desc} />)}
                </div>
            </div>

            {/* Invoice Type */}
            <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">نوع الفاتورة <span className="text-red-500">*</span></label>
                <div className="space-y-2">
                    {typeOptions.map(opt => <RadioCard key={opt.id} selected={invoiceType === opt.id} onClick={() => setInvoiceType(opt.id)} label={opt.label} desc={opt.desc} />)}
                </div>
            </div>

            {/* Branches */}
            <div className="mb-6 relative">
                <label className="block text-sm font-bold text-gray-700 mb-2">الفروع <span className="text-red-500">*</span></label>
                <button type="button" onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                    className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg text-sm text-right transition ${errors.branches ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'}`}>
                    <span className={selectedBranches.length > 0 ? 'text-gray-800' : 'text-gray-400'}>
                        {selectedBranches.length > 0 ? branches.filter(b => selectedBranches.includes(b._id)).map(b => b.name).join(', ') : 'اختر الفروع'}
                    </span>
                    <ChevronLeft size={14} className={`text-gray-400 transition-transform ${branchDropdownOpen ? 'rotate-90' : '-rotate-90'}`} />
                </button>
                {branchDropdownOpen && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {branches.map(branch => (
                            <button key={branch._id} type="button" onClick={() => toggleBranch(branch._id)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-right text-sm text-gray-700 transition-colors">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selectedBranches.includes(branch._id) ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'}`}>
                                    {selectedBranches.includes(branch._id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                {branch.name}
                            </button>
                        ))}
                        {branches.length === 0 && <p className="px-4 py-3 text-sm text-gray-400 text-center">لا توجد فروع</p>}
                    </div>
                )}
                {errors.branches && <p className="text-red-500 text-xs mt-1 font-medium">{errors.branches}</p>}
            </div>
        </div>
    );

    /* ── Step 2: Design Gallery ───────────────────────────────── */
    const Step2 = () => (
        <div className="px-6 py-4 max-w-3xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            <h2 className="text-lg font-bold text-gray-800 mb-5">اختر التصميم</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {designOptions.map((designId, index) => {
                    const DesignComponent = designComponents[index];
                    return (
                        <button key={designId} onClick={() => setSelectedDesign(designId)}
                            className={`rounded-lg border-2 overflow-hidden transition-all ${selectedDesign === designId ? 'border-indigo-500 shadow-lg scale-[1.02]' : 'border-gray-200 hover:border-gray-300'}`}>
                            <div className="aspect-[3/4] relative bg-[#f9fafb] flex items-center justify-center p-2">
                                <div className="w-full h-full border border-gray-200 rounded-md overflow-hidden">
                                    <DesignComponent />
                                </div>
                            </div>
                            <div className="p-2 text-center">
                                <span className="text-xs font-bold text-gray-700">تصميم {index + 1}</span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    /* ── Footer ───────────────────────────────────────────────── */
    const WizardFooter = () => (
        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-200 bg-white" dir={isRtl ? 'rtl' : 'ltr'}>
            {step > 1 ? (
                <button onClick={handleBack} className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">السابق</button>
            ) : (
                <Link to="/dashboard/templates/invoices" className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">إلغاء</Link>
            )}
            {step < 2 ? (
                <button onClick={handleNext} className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-colors">التالي</button>
            ) : (
                <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors">
                    {saving ? 'جارٍ الحفظ...' : 'حفظ'}
                </button>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f5f7f9] flex flex-col" dir={isRtl ? 'rtl' : 'ltr'}>
            <Breadcrumbs />
            <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-center gap-4 py-4">
                    {[1, 2].map(s => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{s}</div>
                            <span className={`text-sm font-medium ${step >= s ? 'text-indigo-600' : 'text-gray-400'}`}>
                                {s === 1 ? 'الإعدادات' : 'اختيار التصميم'}
                            </span>
                            {s < 2 && <div className="w-12 h-0.5 bg-gray-200 mx-2" />}
                        </div>
                    ))}
                </div>
                <div className="flex-1 bg-white mx-4 mb-4 rounded-lg border border-gray-200 shadow-sm flex flex-col">
                    <div className="flex-1 overflow-y-auto">
                        {step === 1 && <Step1 />}
                        {step === 2 && <Step2 />}
                    </div>
                    <WizardFooter />
                </div>
            </div>
        </div>
    );
};

export default InvoiceTemplateAdd;
