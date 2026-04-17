import { useEffect, useMemo, useState } from 'react';
import './InvoiceQATool.css';
import api from '../../services/api';

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
  });

  const [backgroundPreview, setBackgroundPreview] = useState('');
  const [checkStates, setCheckStates] = useState(() =>
    Object.fromEntries(checklistItems.map((item) => [item.id, null]))
  );
  const [invoiceNumber] = useState(() => {
    const stamp = Date.now().toString().slice(-6);
    return `INV-QA-${stamp}`;
  });

  // Fetch seller info from settings
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
      .catch(() => {});
  }, []);

  const quantity = Number(form.quantity) || 0;
  const unitPrice = Number(form.unitPrice) || 0;
  const taxRate = Number(form.taxRate) || 0;
  const subtotal = quantity * unitPrice;
  const taxAmount = subtotal * (taxRate / 100);
  const grandTotal = subtotal + taxAmount;

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
              {/* Adjusted Header: Logo | Text | QR */}
              <header className="invoice-meta-header">
                <div className="side-box">
                  {form.sellerStamp && (
                    <img src={form.sellerStamp} alt="Logo" className="header-logo" />
                  )}
                </div>
                
                <div className="meta-text-center">
                  <h3>فاتورة ضريبية</h3>
                  <p>رقم الفاتورة: {invoiceNumber}</p>
                  <p>التاريخ: {form.invoiceDate}</p>
                </div>

                <div className="side-box qr-placeholder">QR</div>
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
                          maxHeight: '80px',
                          opacity: 0.8
                        }} 
                      />
                    )}
                  </div>
                </div>
                <div className="signature-box">
                  <p>توقيع المشتري</p>
                  <div className="signature-line" style={{ minHeight: '60px' }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ──── Checklist Panel ──── */}
        <section className="checklist-panel">
          <h2>قائمة اختبار الجودة</h2>

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
                ختم الشركة (رابط صورة)
                <input name="sellerStamp" type="text" value={form.sellerStamp} onChange={handleField} placeholder="https://example.com/stamp.png" />
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
