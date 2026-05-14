import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { QRCodeCanvas } from 'qrcode.react';
import './InvoiceQATool.css';
import api, { BASE_URL } from '../../services/api';

const checklistItems = [
  { id: 'bg_full', label: 'Background covers full page' },
  { id: 'seller_visible', label: 'Seller info visible' },
  { id: 'buyer_visible', label: 'Buyer info visible' },
  { id: 'invoice_number', label: 'Invoice number generated' },
  { id: 'qr_visible', label: 'QR code visible' },
  { id: 'tax_correct', label: 'Tax calculation correct' },
  { id: 'grand_total', label: 'Grand total correct' },
  { id: 'signature_section', label: 'Signature section present' },
  { id: 'no_hardcoded_header', label: 'No hardcoded header' },
  { id: 'print_preview', label: 'Print preview looks correct' },
];

const formatMoney = (value) =>
  new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

const todayIso = () => new Date().toISOString().slice(0, 10);

function InvoiceQATool() {
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get('invoiceId');
  const [loadingRealData, setLoadingRealData] = useState(false);

  const [form, setForm] = useState({
    sellerName: '',
    sellerCR: '',
    sellerTaxID: '',
    sellerAddress: '',
    sellerStamp: '',
    buyerName: '',
    buyerCR: '',
    buyerTaxID: '',
    buyerAddress: '',
    itemDescription: 'خدمة محاسبية شهرية',
    quantity: 1,
    unitPrice: 1000,
    taxRate: 15,
    invoiceDate: todayIso(),
    signatureText: '',
  });

  const [backgroundPreview, setBackgroundPreview] = useState('');
  const [checkStates, setCheckStates] = useState(() => {
    const saved = localStorage.getItem('invoice_qa_checklist');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved checklist', e);
      }
    }
    return Object.fromEntries(checklistItems.map((item) => [item.id, null]));
  });

  const [invoiceNumber, setInvoiceNumber] = useState(() => {
    const stamp = Date.now().toString().slice(-6);
    return `INV-QA-${stamp}`;
  });

  // Fetch real invoice if invoiceId is provided
  useEffect(() => {
    if (!invoiceId) return;

    setLoadingRealData(true);
    api.get(`/transactions/${invoiceId}`)
      .then((res) => {
        const txn = res.data?.data || res.data?.transaction || res.data || {};
        const contact = txn.contactSnapshot || txn.contact || {};
        const company = txn.companySnapshot || {};

        const items = Array.isArray(txn.items) ? txn.items : [];
        const desc = items.length > 0
          ? items.map(i => i.productName || i.description || 'بند غير معروف').join(' + ')
          : 'بدون أصناف';

        setInvoiceNumber(txn.transactionNumber || txn.invoiceNumber || invoiceNumber);

        setForm({
          sellerName: company.name || '',
          sellerCR: company.commercialRegister || '',
          sellerTaxID: company.taxNumber || '',
          sellerAddress: company.address || '',
          sellerStamp: company.logo ? (company.logo.startsWith('http') ? company.logo : `${BASE_URL}${company.logo}`) : '',
          buyerName: contact.name || '',
          buyerCR: contact.commercialRegister || contact.commercialRegNumber || '',
          buyerTaxID: contact.taxNumber || '',
          buyerAddress: contact.address ? (typeof contact.address === 'string' ? contact.address : `${contact.address.address1 || ''} ${contact.address.city || ''}`) : '',
          itemDescription: desc,
          quantity: 1,
          unitPrice: txn.subtotal || 0,
          taxRate: txn.subtotal > 0 ? (txn.totalTax / txn.subtotal) * 100 : 15,
          invoiceDate: txn.issueDate ? txn.issueDate.slice(0, 10) : todayIso(),
          signatureText: '',
        });
      })
      .catch((err) => {
        console.error('Failed to fetch real invoice data:', err);
      })
      .finally(() => {
        setLoadingRealData(false);
      });
  }, [invoiceId]);

  // Save checklist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('invoice_qa_checklist', JSON.stringify(checkStates));
  }, [checkStates]);

  // Fetch seller info from settings (initial load only)
  useEffect(() => {
    api.get('/settings?category=general')
      .then((res) => {
        const d = res.data?.data || res.data || {};
        setForm((prev) => ({
          ...prev,
          sellerName: d.company_name || d.name || prev.sellerName,
          sellerCR: d.commercial_register || d.commercialRegister || prev.sellerCR,
          sellerTaxID: d.tax_number || d.taxNumber || prev.sellerTaxID,
          sellerAddress: d.address || d.city || d.location || prev.sellerAddress,
          sellerStamp: d.logo_path || prev.sellerStamp,
        }));
      })
      .catch(() => { });
  }, []);

  const quantity = Number(form.quantity) || 0;
  const unitPrice = Number(form.unitPrice) || 0;
  const taxRate = Number(form.taxRate) || 0;
  const subtotal = quantity * unitPrice;
  const taxAmount = subtotal * (taxRate / 100);
  const grandTotal = subtotal + taxAmount;

  const qrValue = useMemo(() => JSON.stringify({
    invoiceNumber,
    total: grandTotal,
    company: form.sellerName,
    date: form.invoiceDate,
  }), [invoiceNumber, grandTotal, form.sellerName, form.invoiceDate]);

  const completedChecks = useMemo(
    () => Object.values(checkStates).filter((v) => v !== null).length,
    [checkStates]
  );
  const passedChecks = useMemo(
    () => Object.values(checkStates).filter((v) => v === true).length,
    [checkStates]
  );
  const allChecked = completedChecks === checklistItems.length;
  const progressPercent = (completedChecks / checklistItems.length) * 100;

  const scoreClass =
    passedChecks >= 8 ? 'score-green' : passedChecks >= 5 ? 'score-yellow' : 'score-red';

  const handleField = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleStampUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, sellerStamp: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleBackgroundUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setBackgroundPreview(url);
  };

  useEffect(() => {
    return () => {
      if (backgroundPreview.startsWith('blob:')) URL.revokeObjectURL(backgroundPreview);
    };
  }, [backgroundPreview]);

  const setCheck = (id, value) =>
    setCheckStates((prev) => ({ ...prev, [id]: value }));

  const [saving, setSaving] = useState(false);
  const [printing, setPrinting] = useState(false);

  const handlePrint = async () => {
    const element = document.querySelector('.invoice-wrapper');
    if (!element) return;

    setPrinting(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2, // Better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      const ratio = canvasWidth / canvasHeight;
      let imgWidth = pdfWidth;
      let imgHeight = pdfWidth / ratio;

      // If height is too much, scale down more
      if (imgHeight > pdfHeight) {
        imgHeight = pdfHeight;
        imgWidth = pdfHeight * ratio;
      }

      // Center horizontally
      const xOffset = (pdfWidth - imgWidth) / 2;

      pdf.addImage(imgData, 'JPEG', xOffset, 0, imgWidth, imgHeight);

      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');

      // Revoke after some time
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      console.error('PDF Generation failed:', err);
      alert('حدث خطأ أثناء إنشاء ملف PDF');
    } finally {
      setPrinting(false);
    }
  };

  const resetChecklist = () => {
    if (window.confirm('هل أنت متأكد من إعادة تعيين القائمة؟')) {
      const reset = Object.fromEntries(checklistItems.map((item) => [item.id, null]));
      setCheckStates(reset);
    }
  };

  const saveResult = async () => {
    setSaving(true);
    try {
      // 1. Save seller info back to company general settings
      await api.patch('/settings/general', {
        settings: {
          company_name: form.sellerName,
          commercial_register: form.sellerCR,
          tax_number: form.sellerTaxID,
          address: form.sellerAddress,
        }
      });

      // 2. Save QA score to localStorage
      const result = {
        score: passedChecks,
        total: checklistItems.length,
        date: new Date().toLocaleString(),
        passed: passedChecks >= 8,
        checklist: checkStates,
      };
      localStorage.setItem('invoice_qa_last_result', JSON.stringify(result));

      alert('✅ تم حفظ البيانات والنتيجة بنجاح');
    } catch (err) {
      console.error('Save failed:', err);
      const msg = err?.response?.data?.message || err.message || 'خطأ غير معروف';
      alert(`❌ فشل الحفظ: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="invoice-qa-page" dir="rtl">
      <div className="qa-layout">
        {/* ──── Preview Panel ──── */}
        <section className="preview-panel">
          <h2>معاينة الفاتورة المباشرة</h2>
          <div
            className="invoice-wrapper"
            style={{
              backgroundImage: backgroundPreview ? `url(${backgroundPreview})` : 'none',
            }}
          >
            {/* Background label – no 6cm forced whitespace */}
            {backgroundPreview && (
              <div className="invoice-bg-label">
                <span>خلفية مخصصة</span>
              </div>
            )}

            <div className="invoice-content">
              {/* Adjusted Header: Text only (Logo and QR moved/removed) */}
              <header className="invoice-meta-header" style={{ justifyContent: 'center' }}>
                <div className="meta-text-center">
                  <h3>فاتورة ضريبية</h3>
                  <p>رقم الفاتورة: {invoiceNumber}</p>
                  <p>التاريخ: {form.invoiceDate}</p>
                </div>
              </header>

              {/* Seller & Buyer */}
              <div className="parties-grid">
                <div className="info-box">
                  <h4>بيانات البائع</h4>
                  <p>{form.sellerName || '---'}</p>
                  <p>السجل التجاري: {form.sellerCR || '---'}</p>
                  <p>الرقم الضريبي: {form.sellerTaxID || '---'}</p>
                  <p>العنوان: {form.sellerAddress || '---'}</p>
                </div>
                <div className="info-box">
                  <h4>بيانات المشتري</h4>
                  <p>{form.buyerName || '---'}</p>
                  <p>السجل التجاري: {form.buyerCR || '---'}</p>
                  <p>الرقم الضريبي: {form.buyerTaxID || '---'}</p>
                  <p>العنوان: {form.buyerAddress || '---'}</p>
                </div>
              </div>

              {/* Items table */}
              <table className="items-table">
                <thead>
                  <tr>
                    <th>الوصف</th>
                    <th>الكمية</th>
                    <th>سعر الوحدة</th>
                    <th>الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{form.itemDescription || '---'}</td>
                    <td>{quantity}</td>
                    <td>{formatMoney(unitPrice)}</td>
                    <td>{formatMoney(subtotal)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Totals — directly below table */}
              <div className="totals-box">
                <p>
                  <span>الإجمالي قبل الضريبة</span>
                  <strong>{formatMoney(subtotal)} ر.س</strong>
                </p>
                <p>
                  <span>الضريبة ({taxRate}%)</span>
                  <strong>{formatMoney(taxAmount)} ر.س</strong>
                </p>
                <p className="grand-total">
                  <span>الإجمالي شامل الضريبة</span>
                  <strong>{formatMoney(grandTotal)} ر.س</strong>
                </p>
              </div>

              {/* Signature section */}
              <div className="signature-grid">
                <div className="signature-box">
                  <p>ختم البائع</p>
                  <div className="signature-line" style={{ position: 'relative', minHeight: '60px' }}>
                    {form.sellerStamp && (
                      <img
                        src={form.sellerStamp}
                        alt="Seal"
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          maxHeight: '150px',
                          maxWidth: '150px',
                          objectFit: 'contain',
                          opacity: 0.8,
                          border: 'none',
                          outline: 'none',
                          boxShadow: 'none'
                        }}
                      />
                    )}
                  </div>
                </div>
                <div className="signature-box">
                  <p>توقيع المشتري</p>
                  <div className="signature-line" style={{ minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {form.signatureText}
                  </div>
                </div>
              </div>

              {/* QR Code at bottom left corner, just above the background footer section */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingBottom: '1.4cm' }}>
                <div style={{ border: 'none', background: 'transparent', paddingLeft: '15px' }}>
                  <QRCodeCanvas value={qrValue} size={85} level="M" includeMargin={false} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ──── Checklist Panel ──── */}
        <section className="checklist-panel">
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>قائمة اختبار الجودة</h2>
            <div className="panel-actions" style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={handlePrint} disabled={printing} className="btn-print" style={{ padding: '0.4rem 0.8rem', cursor: printing ? 'wait' : 'pointer', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>{printing ? 'جارٍ التحضير...' : 'طباعة الفاتورة'}</button>
              <button type="button" onClick={saveResult} disabled={saving} className="btn-save" style={{ padding: '0.4rem 0.8rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'جارٍ الحفظ...' : 'حفظ النتيجة'}</button>
              <button type="button" onClick={resetChecklist} className="btn-reset" style={{ padding: '0.4rem 0.8rem', cursor: 'pointer' }}>إعادة تعيين</button>
            </div>
          </div>

          <form className="input-form">
            <fieldset className="form-group">
              <legend>بيانات البائع</legend>
              <label>
                اسم البائع
                <input name="sellerName" type="text" value={form.sellerName} onChange={handleField} />
              </label>
              <label>
                السجل التجاري (البائع)
                <input name="sellerCR" type="text" value={form.sellerCR} onChange={handleField} placeholder="مثال: 1053920133" />
              </label>
              <label>
                الرقم الضريبي (البائع)
                <input name="sellerTaxID" type="text" value={form.sellerTaxID} onChange={handleField} />
              </label>
              <label>
                العنوان (البائع)
                <input name="sellerAddress" type="text" value={form.sellerAddress} onChange={handleField} placeholder="المدينة، الدولة" />
              </label>
              <label>
                رفع الختم (PNG فقط)
                <input type="file" accept="image/png" onChange={handleStampUpload} />
                {form.sellerStamp && (
                  <div className="stamp-preview-mini" style={{ marginTop: '0.5rem' }}>
                    <img src={form.sellerStamp} alt="Stamp Preview" style={{ maxHeight: '150px', maxWidth: '150px', border: '1px dashed #ccc' }} />
                  </div>
                )}
              </label>
            </fieldset>

            <fieldset className="form-group">
              <legend>بيانات المشتري</legend>
              <label>
                اسم المشتري
                <input name="buyerName" type="text" value={form.buyerName} onChange={handleField} />
              </label>
              <label>
                السجل التجاري (المشتري)
                <input name="buyerCR" type="text" value={form.buyerCR} onChange={handleField} placeholder="مثال: 2053920001" />
              </label>
              <label>
                الرقم الضريبي (المشتري)
                <input name="buyerTaxID" type="text" value={form.buyerTaxID} onChange={handleField} />
              </label>
              <label>
                العنوان (المشتري)
                <input name="buyerAddress" type="text" value={form.buyerAddress} onChange={handleField} placeholder="المدينة، الدولة" />
              </label>
            </fieldset>

            <fieldset className="form-group">
              <legend>بند الفاتورة</legend>
              <label>
                وصف الصنف
                <input name="itemDescription" type="text" value={form.itemDescription} onChange={handleField} />
              </label>
              <label>
                الكمية
                <input name="quantity" type="number" min="0" step="1" value={form.quantity} onChange={handleField} />
              </label>
              <label>
                سعر الوحدة
                <input name="unitPrice" type="number" min="0" step="0.01" value={form.unitPrice} onChange={handleField} />
              </label>
              <label>
                نسبة الضريبة (%)
                <input name="taxRate" type="number" min="0" step="0.01" value={form.taxRate} onChange={handleField} />
              </label>
              <label>
                تاريخ الفاتورة
                <input name="invoiceDate" type="date" value={form.invoiceDate} onChange={handleField} />
              </label>
              <label>
                رفع خلفية (PNG/JPG)
                <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleBackgroundUpload} />
              </label>
            </fieldset>

            <fieldset className="form-group">
              <legend>التوقيع</legend>
              <label>
                توقيع (نص)
                <input name="signatureText" type="text" value={form.signatureText} onChange={handleField} placeholder="اسم الموقع هنا..." />
              </label>
            </fieldset>
          </form>

          {/* Progress */}
          <div className="progress-wrap">
            <div className="progress-label">
              <span>التقدم: {completedChecks}/{checklistItems.length}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          {/* Checklist */}
          <ul className="checklist">
            {checklistItems.map((item) => (
              <li key={item.id}>
                <span>{item.label}</span>
                <div className="check-actions">
                  <button
                    type="button"
                    className={checkStates[item.id] === true ? 'active-pass' : ''}
                    onClick={() => setCheck(item.id, true)}
                  >✓</button>
                  <button
                    type="button"
                    className={checkStates[item.id] === false ? 'active-fail' : ''}
                    onClick={() => setCheck(item.id, false)}
                  >✗</button>
                </div>
              </li>
            ))}
          </ul>

          {allChecked && (
            <div className={`score-card ${scoreClass}`}>
              النتيجة النهائية: {passedChecks}/{checklistItems.length}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default InvoiceQATool;
