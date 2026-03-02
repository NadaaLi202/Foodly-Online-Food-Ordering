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

    const designOptions = [
        'design-1', 'design-2', 'design-3', 'design-4', 'design-5',
        'design-6', 'design-7', 'design-8', 'design-9', 'design-10'
    ];

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
            <text x={x + w / 2} y={y + h / 2 + 2} textAnchor="middle" fontSize="4" fill="#bbb">{t('Logo', 'شعار')}</text>
        </g>
    );
    const Lines = ({ x, y, w, count = 3, gap = 4, color = '#e5e7eb' }) => (
        <g>{Array.from({ length: count }).map((_, i) => <rect key={i} x={x} y={y + i * gap} width={w} height={1.5} fill={color} rx="0.5" />)}</g>
    );
    const TableHeader = ({ y, bg = '#f0f2f5', borders = false }) => (
        <g>
            <rect x={10} y={y} width={100} height={7} fill={bg} stroke={borders ? '#ccc' : 'none'} strokeWidth={borders ? 0.5 : 0} />
            {[10, 32, 55, 78, 98].map((cx, i) => <rect key={i} x={cx} y={y + 1} width={i === 0 ? 20 : i === 4 ? 12 : 18} height={5} fill={bg === '#f0f2f5' ? '#d1d5db' : '#c7d2fe'} rx="0.5" />)}
        </g>
    );
    const TableRows = ({ y, rows = 3, borders = false }) => (
        <g>{Array.from({ length: rows }).map((_, i) => (
            <g key={i}>
                <rect x={10} y={y + i * 6} width={100} height={5} fill={i % 2 === 0 ? 'white' : '#fafafa'} stroke={borders ? '#ccc' : 'none'} strokeWidth={borders ? 0.3 : 0} />
                {[10, 32, 55, 78, 98].map((cx, j) => <rect key={j} x={cx} y={y + i * 6 + 1} width={j === 0 ? 20 : j === 4 ? 12 : 18} height={3} fill="#e5e7eb" rx="0.5" />)}
            </g>
        ))}</g>
    );

    /* ── 10 Design SVGs (matching reference exactly) ──── */

    // D1: Company info + title top-right, Logo dashed top-left, QR bottom-right
    const D1 = ({ borders }) => (
        <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="160" fill="white" />
            <text x="95" y="10" textAnchor="middle" fontSize="4.5" fontWeight="bold" fill="#1a1a1a">{t('Dafater Advertising', 'دفاتر للدعاية والإعلان')}</text>
            <text x="60" y="10" textAnchor="middle" fontSize="4.5" fontWeight="bold" fill="#1a1a1a">{t('Simplified Tax Invoice', 'فاتورة ضريبية مبسطة')}</text>
            <LogoBox x={8} y={4} w={22} h={16} />
            <Lines x={80} y={14} w={30} count={3} gap={3} />
            <Lines x={10} y={14} w={25} count={2} gap={3} />
            <Lines x={10} y={28} w={30} count={2} gap={3} />
            <Lines x={75} y={28} w={35} count={2} gap={3} />
            <Lines x={10} y={40} w={55} count={2} gap={3} />
            <TableHeader y={50} borders={borders} />
            <TableRows y={57} rows={3} borders={borders} />
            <Lines x={60} y={80} w={50} count={4} gap={4} />
            <line x1={10} y1={105} x2={55} y2={105} stroke="#ccc" strokeWidth="0.8" />
            <text x="32" y="110" textAnchor="middle" fontSize="4" fill="#999">{t('Signature', 'التوقيع')}</text>
            <QRBlock x={87} y={96} s={22} />
            <text x="98" y={120} textAnchor="middle" fontSize="3.5" fill="#999">{t('Notes', 'ملاحظات')}</text>
        </svg>
    );

    // D2: Company info top-right, Logo center, QR bottom-right
    const D2 = ({ borders }) => (
        <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="160" fill="white" />
            <text x="95" y="10" textAnchor="middle" fontSize="4.5" fontWeight="bold" fill="#1a1a1a">{t('Dafater Advertising', 'دفاتر للدعاية والإعلان')}</text>
            <text x="60" y="10" textAnchor="middle" fontSize="4.5" fontWeight="bold" fill="#1a1a1a">{t('Simplified Tax Invoice', 'فاتورة ضريبية مبسطة')}</text>
            <LogoBox x={8} y={4} w={22} h={16} />
            <QRBlock x={38} y={4} s={18} />
            <Lines x={80} y={14} w={30} count={3} gap={3} />
            <Lines x={10} y={28} w={30} count={2} gap={3} />
            <Lines x={75} y={28} w={35} count={2} gap={3} />
            <Lines x={10} y={40} w={55} count={2} gap={3} />
            <TableHeader y={50} borders={borders} />
            <TableRows y={57} rows={3} borders={borders} />
            <Lines x={60} y={80} w={50} count={4} gap={4} />
            <line x1={10} y1={105} x2={55} y2={105} stroke="#ccc" strokeWidth="0.8" />
            <text x="32" y="110" textAnchor="middle" fontSize="4" fill="#999">{t('Signature', 'التوقيع')}</text>
            <text x="98" y={110} textAnchor="middle" fontSize="3.5" fill="#999">{t('Notes', 'ملاحظات')}</text>
        </svg>
    );

    // D3: Large QR top-left, title center, logo top-right
    const D3 = ({ borders }) => (
        <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="160" fill="white" />
            <QRBlock x={8} y={4} s={24} />
            <text x="60" y="12" textAnchor="middle" fontSize="4.5" fontWeight="bold" fill="#1a1a1a">{t('Simplified Tax Invoice', 'فاتورة ضريبية مبسطة')}</text>
            <Lines x={42} y={16} w={40} count={2} gap={3} />
            <LogoBox x={90} y={4} w={22} h={18} />
            <rect x={10} y={32} width={47} height={18} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="13" y="38" fontSize="4" fill="#555">{t('From:', 'من:')}</text>
            <Lines x={13} y={40} w={40} count={3} gap={3} />
            <rect x={63} y={32} width={47} height={18} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="66" y="38" fontSize="4" fill="#555">{t('To:', 'إلى:')}</text>
            <Lines x={66} y={40} w={40} count={3} gap={3} />
            <TableHeader y={54} borders={borders} />
            <TableRows y={61} rows={3} borders={borders} />
            <Lines x={60} y={84} w={50} count={4} gap={4} />
            <line x1={10} y1={109} x2={55} y2={109} stroke="#ccc" strokeWidth="0.8" />
            <text x="32" y="114" textAnchor="middle" fontSize="4" fill="#999">{t('Signature', 'التوقيع')}</text>
            <text x="98" y="114" textAnchor="middle" fontSize="3.5" fill="#999">{t('Notes', 'ملاحظات')}</text>
        </svg>
    );

    // D4: Invoice info top-left, Logo top-right, QR top-center
    const D4 = ({ borders }) => (
        <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="160" fill="white" />
            <text x="60" y="10" textAnchor="middle" fontSize="4.5" fontWeight="bold" fill="#1a1a1a">{t('Simplified Tax Invoice', 'فاتورة ضريبية مبسطة')}</text>
            <Lines x={10} y={14} w={35} count={2} gap={3} />
            <QRBlock x={47} y={4} s={24} />
            <LogoBox x={90} y={4} w={22} h={18} />
            <Lines x={10} y={28} w={30} count={2} gap={3} />
            <Lines x={75} y={28} w={35} count={2} gap={3} />
            <rect x={10} y={38} width={47} height={18} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="13" y="44" fontSize="4" fill="#555">{t('From:', 'من:')}</text>
            <Lines x={13} y={46} w={40} count={2} gap={3} />
            <rect x={63} y={38} width={47} height={18} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="66" y="44" fontSize="4" fill="#555">{t('To:', 'إلى:')}</text>
            <Lines x={66} y={46} w={40} count={2} gap={3} />
            <TableHeader y={60} borders={borders} />
            <TableRows y={67} rows={3} borders={borders} />
            <Lines x={60} y={90} w={50} count={4} gap={4} />
            <line x1={10} y1={115} x2={55} y2={115} stroke="#ccc" strokeWidth="0.8" />
            <text x="32" y="120" textAnchor="middle" fontSize="4" fill="#999">{t('Signature', 'التوقيع')}</text>
            <text x="98" y="120" textAnchor="middle" fontSize="3.5" fill="#999">{t('Notes', 'ملاحظات')}</text>
        </svg>
    );

    // D5: Logo center-top, company info sides, QR below header
    const D5 = ({ borders }) => (
        <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="160" fill="white" />
            <LogoBox x={47} y={4} w={26} h={20} />
            <text x="60" y="30" textAnchor="middle" fontSize="4.5" fontWeight="bold" fill="#1a1a1a">{t('Simplified Tax Invoice', 'فاتورة ضريبية مبسطة')}</text>
            <Lines x={10} y={8} w={35} count={3} gap={3} />
            <Lines x={80} y={8} w={30} count={3} gap={3} />
            <Lines x={10} y={35} w={30} count={2} gap={3} />
            <Lines x={75} y={35} w={35} count={2} gap={3} />
            <Lines x={10} y={47} w={55} count={2} gap={3} />
            <TableHeader y={56} borders={borders} />
            <TableRows y={63} rows={3} borders={borders} />
            <Lines x={60} y={86} w={50} count={4} gap={4} />
            <line x1={10} y1={111} x2={55} y2={111} stroke="#ccc" strokeWidth="0.8" />
            <text x="32" y="116" textAnchor="middle" fontSize="4" fill="#999">{t('Signature', 'التوقيع')}</text>
            <text x="98" y="116" textAnchor="middle" fontSize="3.5" fill="#999">{t('Notes', 'ملاحظات')}</text>
        </svg>
    );

    // D6: Company name bold top, details columns, logo center, invoice title below
    const D6 = ({ borders }) => (
        <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="160" fill="white" />
            <text x="95" y="10" textAnchor="middle" fontSize="4.5" fontWeight="bold" fill="#1a1a1a">{t('Dafater Advertising', 'دفاتر للدعاية والإعلان')}</text>
            <Lines x={10} y={14} w={45} count={3} gap={3} />
            <LogoBox x={47} y={4} w={26} h={18} />
            <Lines x={80} y={14} w={30} count={3} gap={3} />
            <text x="60" y="30" textAnchor="middle" fontSize="4.5" fontWeight="bold" fill="#1a1a1a">{t('Simplified Tax Invoice', 'فاتورة ضريبية مبسطة')}</text>
            <Lines x={25} y={33} w={30} count={2} gap={3} />
            <Lines x={65} y={33} w={30} count={2} gap={3} />
            <Lines x={10} y={44} w={55} count={3} gap={3} />
            <TableHeader y={56} borders={borders} />
            <TableRows y={63} rows={3} borders={borders} />
            <Lines x={60} y={86} w={50} count={4} gap={4} />
            <line x1={10} y1={111} x2={55} y2={111} stroke="#ccc" strokeWidth="0.8" />
            <text x="32" y="116" textAnchor="middle" fontSize="4" fill="#999">{t('Signature', 'التوقيع')}</text>
            <QRBlock x={87} y={96} s={22} />
            <text x="98" y={120} textAnchor="middle" fontSize="3.5" fill="#999">{t('Notes', 'ملاحظات')}</text>
        </svg>
    );

    // D7: Large QR center-top, title+details below, logo top-right
    const D7 = ({ borders }) => (
        <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="160" fill="white" />
            <Lines x={10} y={8} w={35} count={3} gap={3} />
            <QRBlock x={47} y={4} s={26} />
            <LogoBox x={90} y={4} w={22} h={18} />
            <text x="60" y="36" textAnchor="middle" fontSize="4.5" fontWeight="bold" fill="#1a1a1a">{t('Simplified Tax Invoice', 'فاتورة ضريبية مبسطة')}</text>
            <Lines x={10} y={39} w={30} count={2} gap={3} />
            <Lines x={75} y={39} w={35} count={2} gap={3} />
            <rect x={10} y={48} width={47} height={16} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="13" y="54" fontSize="4" fill="#555">{t('From:', 'من:')}</text>
            <Lines x={13} y={56} w={40} count={2} gap={3} />
            <rect x={63} y={48} width={47} height={16} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="66" y="54" fontSize="4" fill="#555">{t('To:', 'إلى:')}</text>
            <Lines x={66} y={56} w={40} count={2} gap={3} />
            <TableHeader y={68} borders={borders} />
            <TableRows y={75} rows={3} borders={borders} />
            <Lines x={60} y={98} w={50} count={4} gap={4} />
            <line x1={10} y1={123} x2={55} y2={123} stroke="#ccc" strokeWidth="0.8" />
            <text x="32" y="128" textAnchor="middle" fontSize="4" fill="#999">{t('Signature', 'التوقيع')}</text>
            <text x="98" y="128" textAnchor="middle" fontSize="3.5" fill="#999">{t('Notes', 'ملاحظات')}</text>
        </svg>
    );

    // D8: Logo top-left, Large QR top-center, company info top-right
    const D8 = ({ borders }) => (
        <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="160" fill="white" />
            <LogoBox x={8} y={4} w={22} h={20} />
            <QRBlock x={47} y={4} s={24} />
            <Lines x={80} y={8} w={30} count={4} gap={3} />
            <text x="60" y="34" textAnchor="middle" fontSize="4.5" fontWeight="bold" fill="#1a1a1a">{t('Simplified Tax Invoice', 'فاتورة ضريبية مبسطة')}</text>
            <Lines x={10} y={37} w={30} count={2} gap={3} />
            <Lines x={75} y={37} w={35} count={2} gap={3} />
            <rect x={10} y={46} width={47} height={16} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="13" y="52" fontSize="4" fill="#555">{t('From:', 'من:')}</text>
            <Lines x={13} y={54} w={40} count={2} gap={3} />
            <rect x={63} y={46} width={47} height={16} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="66" y="52" fontSize="4" fill="#555">{t('To:', 'إلى:')}</text>
            <Lines x={66} y={54} w={40} count={2} gap={3} />
            <TableHeader y={66} borders={borders} />
            <TableRows y={73} rows={3} borders={borders} />
            <Lines x={60} y={96} w={50} count={4} gap={4} />
            <line x1={10} y1={121} x2={55} y2={121} stroke="#ccc" strokeWidth="0.8" />
            <text x="32" y="126" textAnchor="middle" fontSize="4" fill="#999">{t('Signature', 'التوقيع')}</text>
            <text x="98" y="126" textAnchor="middle" fontSize="3.5" fill="#999">{t('Notes', 'ملاحظات')}</text>
        </svg>
    );

    // D9: QR top-left, title center, Logo top-right
    const D9 = ({ borders }) => (
        <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="160" fill="white" />
            <QRBlock x={8} y={4} s={22} />
            <text x="60" y="12" textAnchor="middle" fontSize="4.5" fontWeight="bold" fill="#1a1a1a">{t('Simplified Tax Invoice', 'فاتورة ضريبية مبسطة')}</text>
            <Lines x={38} y={16} w={35} count={2} gap={3} />
            <LogoBox x={90} y={4} w={22} h={18} />
            <Lines x={10} y={30} w={30} count={2} gap={3} />
            <Lines x={75} y={30} w={35} count={3} gap={3} />
            <rect x={10} y={42} width={47} height={16} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="13" y="48" fontSize="4" fill="#555">{t('From:', 'من:')}</text>
            <Lines x={13} y={50} w={40} count={2} gap={3} />
            <rect x={63} y={42} width={47} height={16} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="66" y="48" fontSize="4" fill="#555">{t('To:', 'إلى:')}</text>
            <Lines x={66} y={50} w={40} count={2} gap={3} />
            <TableHeader y={62} borders={borders} />
            <TableRows y={69} rows={3} borders={borders} />
            <Lines x={60} y={92} w={50} count={4} gap={4} />
            <line x1={10} y1={117} x2={55} y2={117} stroke="#ccc" strokeWidth="0.8" />
            <text x="32" y="122" textAnchor="middle" fontSize="4" fill="#999">{t('Signature', 'التوقيع')}</text>
            <text x="98" y="122" textAnchor="middle" fontSize="3.5" fill="#999">{t('Notes', 'ملاحظات')}</text>
        </svg>
    );

    // D10: Logo top-left, Very large QR top-center, company info top-right
    const D10 = ({ borders }) => (
        <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="160" fill="white" />
            <LogoBox x={6} y={4} w={20} h={22} />
            <text x="60" y="10" textAnchor="middle" fontSize="4.5" fontWeight="bold" fill="#1a1a1a">{t('Simplified Tax Invoice', 'فاتورة ضريبية مبسطة')}</text>
            <Lines x={80} y={8} w={30} count={4} gap={3} />
            <Lines x={10} y={30} w={30} count={2} gap={3} />
            <Lines x={75} y={30} w={35} count={2} gap={3} />
            <Lines x={10} y={42} w={55} count={2} gap={3} />
            <TableHeader y={52} borders={borders} />
            <TableRows y={59} rows={3} borders={borders} />
            <Lines x={60} y={82} w={50} count={4} gap={4} />
            <line x1={10} y1={107} x2={55} y2={107} stroke="#ccc" strokeWidth="0.8" />
            <text x="32" y="112" textAnchor="middle" fontSize="4" fill="#999">{t('Signature', 'التوقيع')}</text>
            <QRBlock x={85} y={94} s={24} />
            <text x="98" y={120} textAnchor="middle" fontSize="3.5" fill="#999">{t('Notes', 'ملاحظات')}</text>
        </svg>
    );

    const ThermalDesign = ({ borders }) => (
        <svg viewBox="0 0 80 160" xmlns="http://www.w3.org/2000/svg">
            <rect width="80" height="160" fill="white" />
            <LogoBox x={29} y={4} w={22} h={16} />
            <text x="40" y="28" textAnchor="middle" fontSize="4.5" fontWeight="bold" fill="#1a1a1a">{t('Simplified Tax Invoice', 'فاتورة ضريبية مبسطة')}</text>
            <Lines x={15} y={32} w={50} count={3} gap={3} />
            <line x1={5} y1={44} x2={75} y2={44} stroke="#ccc" strokeDasharray="2,2" strokeWidth="0.8" />
            <Lines x={5} y={48} w={70} count={2} gap={3} />
            <line x1={5} y1={56} x2={75} y2={56} stroke="#ccc" strokeDasharray="2,2" strokeWidth="0.8" />
            <TableHeader y={58} bg="white" borders={false} />
            <TableRows y={65} rows={4} borders={false} />
            <line x1={5} y1={92} x2={75} y2={92} stroke="#ccc" strokeDasharray="2,2" strokeWidth="0.8" />
            <Lines x={40} y={96} w={35} count={4} gap={4} />
            <line x1={5} y1={115} x2={75} y2={115} stroke="#ccc" strokeDasharray="2,2" strokeWidth="0.8" />
            <text x="40" y="122" textAnchor="middle" fontSize="3.5" fill="#999">{t('Notes', 'ملاحظات')}</text>
            <Lines x={15} y={125} w={50} count={2} gap={3} />
            <QRBlock x={29} y={135} s={22} />
        </svg>
    );

    const designComponents = [D1, D2, D3, D4, D5, D6, D7, D8, D9, D10];

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

    /* ── Breadcrumbs ─────────────────────────────────────────── */
    const Breadcrumbs = () => (
        <div className="flex items-center gap-1 mb-4 px-4 pt-4">
            <Link to="/dashboard" className="flex items-center justify-center w-9 h-9 rounded bg-white border border-gray-200 hover:bg-gray-50 shadow-sm">
                <Home size={16} className="text-gray-500" />
            </Link>
            <ChevronLeft size={14} className="text-gray-300 mx-1" />
            <Link to="/dashboard/templates" className="px-3 h-9 flex items-center rounded bg-white border border-gray-200 hover:bg-gray-50 text-sm text-gray-600 shadow-sm">{t('Template Designs', 'تصاميم القوالب')}</Link>
            <ChevronLeft size={14} className="text-gray-300 mx-1" />
            <Link to="/dashboard/templates/invoices" className="px-3 h-9 flex items-center rounded bg-white border border-gray-200 hover:bg-gray-50 text-sm text-gray-600 shadow-sm">{t('Invoice Templates', 'قوالب الفواتير')}</Link>
            <ChevronLeft size={14} className="text-gray-300 mx-1" />
            <span className="px-3 h-9 flex items-center rounded bg-white border border-gray-200 text-sm font-semibold text-gray-800 shadow-sm">{t('Add', 'إضافة')}</span>
        </div>
    );

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
    const StepIndicator = () => (
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
    );

    const Step3DesignComponent = invoiceType === 'thermal' ? ThermalDesign : (designComponents[parseInt(selectedDesign.replace('design-', '')) - 1] || D1);

    return (
        <div className="min-h-screen bg-[#f5f7f9] flex flex-col" dir={isRtl ? 'rtl' : 'ltr'}>
            {/* <Breadcrumbs /> */}
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
                        {/* ── Step 1: Basic Options (inline) ── */}
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

                        {/* ── Step 2: Design Gallery (inline) ── */}
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

                        {/* ── Step 3: Table Settings + Live Preview (inline) ── */}
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
