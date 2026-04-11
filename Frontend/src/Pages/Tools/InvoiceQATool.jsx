import { useEffect, useMemo, useState } from 'react';
import './InvoiceQATool.css';

const checklistItems = [
  { id: 'bg_full', label: 'Background covers full page' },
  { id: 'start_6cm', label: 'Content starts at 6cm' },
  { id: 'seller_visible', label: 'Seller info visible' },
  { id: 'buyer_visible', label: 'Buyer info visible' },
  { id: 'invoice_number', label: 'Invoice number generated' },
  { id: 'qr_visible', label: 'QR code visible' },
  { id: 'tax_correct', label: 'Tax calculation correct' },
  { id: 'grand_total', label: 'Grand total correct' },
  { id: 'no_hardcoded_header', label: 'No hardcoded header' },
  { id: 'print_preview', label: 'Print preview looks correct' }
];

const formatMoney = (value) =>
  new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number.isFinite(value) ? value : 0);

const todayIso = () => new Date().toISOString().slice(0, 10);

function InvoiceQATool() {
  const [form, setForm] = useState({
    sellerName: 'شركة الاختبار التجارية',
    buyerName: 'مؤسسة العميل النموذجية',
    itemDescription: 'خدمة محاسبية شهرية',
    quantity: 1,
    unitPrice: 1000,
    taxRate: 15,
    invoiceDate: todayIso()
  });
  const [backgroundPreview, setBackgroundPreview] = useState('');
  const [checkStates, setCheckStates] = useState(() =>
    Object.fromEntries(checklistItems.map((item) => [item.id, null]))
  );
  const [invoiceNumber] = useState(() => {
    const stamp = Date.now().toString().slice(-6);
    return `INV-${stamp}`;
  });

  const quantity = Number(form.quantity) || 0;
  const unitPrice = Number(form.unitPrice) || 0;
  const taxRate = Number(form.taxRate) || 0;
  const subtotal = quantity * unitPrice;
  const taxAmount = subtotal * (taxRate / 100);
  const grandTotal = subtotal + taxAmount;

  const completedChecks = useMemo(
    () => Object.values(checkStates).filter((value) => value !== null).length,
    [checkStates]
  );
  const passedChecks = useMemo(
    () => Object.values(checkStates).filter((value) => value === true).length,
    [checkStates]
  );
  const allChecked = completedChecks === checklistItems.length;
  const progressPercent = (completedChecks / checklistItems.length) * 100;

  const scoreClass =
    passedChecks >= 8
      ? 'score-green'
      : passedChecks >= 5
      ? 'score-yellow'
      : 'score-red';

  const handleTextOrNumber = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBackgroundUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setBackgroundPreview(url);
  };

  useEffect(() => {
    return () => {
      if (backgroundPreview.startsWith('blob:')) {
        URL.revokeObjectURL(backgroundPreview);
      }
    };
  }, [backgroundPreview]);

  const setCheck = (id, value) => {
    setCheckStates((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <div className="invoice-qa-page" dir="rtl">
      <div className="qa-layout">
        <section className="preview-panel">
          <h2>معاينة الفاتورة المباشرة</h2>
          <div
            className="invoice-wrapper"
            style={{
              backgroundImage: backgroundPreview
                ? `url(${backgroundPreview})`
                : 'none'
            }}
          >
            <div className="invoice-header">
              <span>Customer Background Design Area</span>
            </div>

            <div className="invoice-content">
              <header className="invoice-meta-header">
                <div>
                  <h3>فاتورة ضريبية</h3>
                  <p>رقم الفاتورة: {invoiceNumber}</p>
                  <p>التاريخ: {form.invoiceDate}</p>
                </div>
                <div className="qr-placeholder">QR</div>
              </header>

              <div className="parties-grid">
                <div className="info-box">
                  <h4>بيانات البائع</h4>
                  <p>{form.sellerName || '---'}</p>
                  <p>الرقم الضريبي: 300000000000003</p>
                  <p>الرياض - المملكة العربية السعودية</p>
                </div>

                <div className="info-box">
                  <h4>بيانات المشتري</h4>
                  <p>{form.buyerName || '---'}</p>
                  <p>الرقم الضريبي: 300000000000004</p>
                  <p>جدة - المملكة العربية السعودية</p>
                </div>
              </div>

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
            </div>
          </div>
        </section>

        <section className="checklist-panel">
          <h2>قائمة اختبار الجودة</h2>

          <form className="input-form">
            <label>
              اسم البائع
              <input
                name="sellerName"
                type="text"
                value={form.sellerName}
                onChange={handleTextOrNumber}
              />
            </label>

            <label>
              اسم المشتري
              <input
                name="buyerName"
                type="text"
                value={form.buyerName}
                onChange={handleTextOrNumber}
              />
            </label>

            <label>
              وصف الصنف
              <input
                name="itemDescription"
                type="text"
                value={form.itemDescription}
                onChange={handleTextOrNumber}
              />
            </label>

            <label>
              الكمية
              <input
                name="quantity"
                type="number"
                min="0"
                step="1"
                value={form.quantity}
                onChange={handleTextOrNumber}
              />
            </label>

            <label>
              سعر الوحدة
              <input
                name="unitPrice"
                type="number"
                min="0"
                step="0.01"
                value={form.unitPrice}
                onChange={handleTextOrNumber}
              />
            </label>

            <label>
              نسبة الضريبة (%)
              <input
                name="taxRate"
                type="number"
                min="0"
                step="0.01"
                value={form.taxRate}
                onChange={handleTextOrNumber}
              />
            </label>

            <label>
              تاريخ الفاتورة
              <input
                name="invoiceDate"
                type="date"
                value={form.invoiceDate}
                onChange={handleTextOrNumber}
              />
            </label>

            <label>
              رفع خلفية (PNG/JPG)
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleBackgroundUpload}
              />
            </label>
          </form>

          <div className="progress-wrap">
            <div className="progress-label">
              <span>
                التقدم: {completedChecks}/{checklistItems.length}
              </span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <ul className="checklist">
            {checklistItems.map((item) => (
              <li key={item.id}>
                <span>{item.label}</span>
                <div className="check-actions">
                  <button
                    type="button"
                    className={checkStates[item.id] === true ? 'active-pass' : ''}
                    onClick={() => setCheck(item.id, true)}
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    className={checkStates[item.id] === false ? 'active-fail' : ''}
                    onClick={() => setCheck(item.id, false)}
                  >
                    ✗
                  </button>
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
