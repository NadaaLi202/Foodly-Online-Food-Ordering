import mongoose from "mongoose";
import { catchAsyncError } from "../../middleware/catchasyncerror.js";
import * as reportsService from "./reports.service.js";
import { generatePDF } from "../../utils/generatepdf.js";

const buildPrintHtml = ({ title, tableHeaders = [], tableRows = [], companyInfo = {}, footer = true }) => {
    const companyName = companyInfo.name || "";
    const commercialReg = companyInfo.commercialReg || companyInfo.commercial_registration || "";
    const taxNumber = companyInfo.taxNumber || companyInfo.tax_number || "";
    const address = companyInfo.address || companyInfo.location || "";

    const esc = (value) => String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800&display=swap" rel="stylesheet" />
  <style>
    * {
      box-sizing: border-box;
      direction: rtl;
      text-align: right;
      font-family: 'Cairo', Arial, sans-serif !important;
    }
    body {
      margin: 0;
      padding: 20px;
      background: #fff;
      color: #000;
      unicode-bidi: embed;
      font-size: 11px;
    }
    .header {
      width: 100%;
      border-bottom: 2px solid #000;
      margin-bottom: 16px;
      padding-bottom: 10px;
    }
    .company-info p {
      margin: 3px 0;
      font-size: 12px;
      line-height: 1.6;
    }
    .report-title {
      font-size: 16px;
      font-weight: 700;
      margin: 12px 0 16px;
      text-align: center;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      direction: rtl;
      font-size: 11px;
    }
    th, td {
      border: 1px solid #333;
      padding: 8px;
      vertical-align: top;
      text-align: right;
      word-break: break-word;
    }
    th {
      background: transparent;
      font-weight: 700;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      font-size: 12px;
    }
    .number {
      direction: ltr;
      unicode-bidi: embed;
      text-align: left;
    }
    @media print {
      img, .logo, [class*="logo"], [class*="brand"] {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <p><strong>اسم الشركة:</strong> ${esc(companyName || "---")}</p>
      <p><strong>السجل التجاري:</strong> ${esc(commercialReg || "---")}</p>
      <p><strong>الرقم الضريبي:</strong> ${esc(taxNumber || "---")}</p>
      <p><strong>العنوان:</strong> ${esc(address || "---")}</p>
    </div>
  </div>
  <div class="report-title">${esc(title || "")}</div>
  <table>
    <thead><tr>${tableHeaders.map((header) => `<th>${esc(header)}</th>`).join("")}</tr></thead>
    <tbody>
      ${tableRows.map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`).join("")}
    </tbody>
  </table>
  ${footer ? `<div class="footer"><span>المحاسب</span><span>المدير</span></div>` : ""}
</body>
</html>`;
};

export const generateHtmlPdf = catchAsyncError(async (req, res) => {
    const { htmlContent, pdfOptions, filename } = req.body || {};
    if (!htmlContent) {
        return res.status(400).json({ message: "htmlContent is required" });
    }

    const pdf = await generatePDF(htmlContent, pdfOptions || {});
    const pdfBuffer = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf || []);
    if (pdfBuffer.length < 5 || pdfBuffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
        return res.status(500).json({ message: "Generated file is not a valid PDF" });
    }
    const safeFilename = String(filename || "report.pdf").replace(/[^a-zA-Z0-9._-]/g, "_");
    res.status(200);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
    res.setHeader("Content-Length", String(pdfBuffer.length));
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("X-Content-Type-Options", "nosniff");
    return res.end(pdfBuffer);
});

export const getSalesSummary = catchAsyncError(async (req, res) => {
    const { startDate, endDate } = req.query;
    const companyFilter = req.companyFilter || {};
    const result = await reportsService.getSalesSummary(startDate, endDate, companyFilter);
    res.status(200).json({ message: "OK", ...result });
});

export const getSalesDetailed = catchAsyncError(async (req, res) => {
    const { startDate, endDate } = req.query;
    const companyFilter = req.companyFilter || {};
    const data = await reportsService.getSalesDetailed(startDate, endDate, companyFilter);
    res.status(200).json({ message: "OK", data });
});

export const getSalesInvoicesDetailed = catchAsyncError(async (req, res) => {
    const companyFilter = req.companyFilter || {};
    const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        branch: req.query.branch,
        client: req.query.client,
        invoiceType: req.query.invoiceType,
        product: req.query.product,
        paymentStatus: req.query.paymentStatus,
        warehouse: req.query.warehouse,
        salesResponsible: req.query.salesResponsible,
    };
    const result = await reportsService.getSalesInvoicesDetailed(filters, companyFilter);
    res.status(200).json(result);
});

export const getPaymentsSummary = catchAsyncError(async (req, res) => {
    const { startDate, endDate } = req.query;
    const companyFilter = req.companyFilter || {};
    const data = await reportsService.getPaymentsSummary(startDate, endDate, companyFilter);
    res.status(200).json({ message: "OK", data });
});

export const getPaymentsDetailed = catchAsyncError(async (req, res) => {
    const { startDate, endDate } = req.query;
    const companyFilter = req.companyFilter || {};
    const data = await reportsService.getPaymentsDetailed(startDate, endDate, companyFilter);
    res.status(200).json({ message: "OK", data });
});

export const getProfitSummary = catchAsyncError(async (req, res) => {
    const { startDate, endDate } = req.query;
    const companyFilter = req.companyFilter || {};
    const data = await reportsService.getProfitSummary(startDate, endDate, companyFilter);
    res.status(200).json({ message: "OK", data });
});

export const getProfitDetailed = catchAsyncError(async (req, res) => {
    const { startDate, endDate } = req.query;
    const companyFilter = req.companyFilter || {};
    const data = await reportsService.getProfitDetailed(startDate, endDate, companyFilter);
    res.status(200).json({ message: "OK", data });
});

export const getPurchasesSummary = catchAsyncError(async (req, res) => {
    const { startDate, endDate } = req.query;
    const companyFilter = req.companyFilter || {};
    const result = await reportsService.getPurchasesSummary(startDate, endDate, companyFilter);
    res.status(200).json({ message: "OK", ...result });
});

export const getPurchasesInvoicesDetailed = catchAsyncError(async (req, res) => {
    const companyFilter = req.companyFilter || {};
    const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        branch: req.query.branch,
        supplier: req.query.supplier,
        warehouse: req.query.warehouse,
        paymentStatus: req.query.paymentStatus,
        salesResponsible: req.query.salesResponsible,
        product: req.query.product,
    };
    const result = await reportsService.getPurchasesInvoicesDetailed(filters, companyFilter);
    res.status(200).json(result);
});

export const getPurchasesPaymentsSummary = catchAsyncError(async (req, res) => {
    const { startDate, endDate } = req.query;
    const companyFilter = req.companyFilter || {};
    const data = await reportsService.getPurchasesPaymentsSummary(startDate, endDate, companyFilter);
    res.status(200).json({ message: "OK", data });
});

export const getPurchasesPaymentsDetailed = catchAsyncError(async (req, res) => {
    const { startDate, endDate } = req.query;
    const companyFilter = req.companyFilter || {};
    const data = await reportsService.getPurchasesPaymentsDetailed(startDate, endDate, companyFilter);
    res.status(200).json({ message: "OK", data });
});

// Inventory
export const getInventorySummary = catchAsyncError(async (req, res) => {
    const companyFilter = req.companyFilter || {};
    const filters = {
        warehouse: req.query.warehouse,
        category: req.query.category,
        productsWithQuantityOnly: req.query.productsWithQuantityOnly,
        method: req.query.method,
    };
    const result = await reportsService.getInventorySummary(filters, companyFilter);
    res.status(200).json(result);
});

export const getInventoryMovementsDetailed = catchAsyncError(async (req, res) => {
    const companyFilter = req.companyFilter || {};
    const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        productId: req.query.productId,
        warehouse: req.query.warehouse,
    };
    const result = await reportsService.getInventoryMovementsDetailed(filters, companyFilter);
    res.status(200).json(result);
});

// Customers
export const getCustomersSummary = catchAsyncError(async (req, res) => {
    const { startDate, endDate, customerId } = req.query;
    const companyFilter = req.companyFilter || {};
    const result = await reportsService.getCustomersSummary(startDate, endDate, companyFilter, customerId);
    res.status(200).json({ message: "OK", ...result });
});

export const getCustomersDetailed = catchAsyncError(async (req, res) => {
    const { startDate, endDate } = req.query;
    const companyFilter = req.companyFilter || {};
    const result = await reportsService.getCustomersDetailed(startDate, endDate, companyFilter);
    res.status(200).json(result);
});

export const getClientGeneralLedger = catchAsyncError(async (req, res) => {
    const companyFilter = req.companyFilter || {};
    const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        clientId: req.query.clientId,
        branch: req.query.branch,
        accountId: req.query.accountId || req.query.journalAccount,
    };
    const result = await reportsService.getClientGeneralLedger(filters, companyFilter);
    res.status(200).json(result);
});

export const getAgedReceivable = catchAsyncError(async (req, res) => {
    const companyFilter = req.companyFilter || {};
    const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        clientId: req.query.clientId,
        branch: req.query.branch,
        interval: req.query.interval,
        method: req.query.method,
    };
    const result = await reportsService.getAgedReceivable(filters, companyFilter);
    res.status(200).json(result);
});

// Suppliers
export const getSuppliersSummary = catchAsyncError(async (req, res) => {
    const { startDate, endDate } = req.query;
    const companyFilter = req.companyFilter || {};
    const data = await reportsService.getSuppliersSummary(startDate, endDate, companyFilter);
    res.status(200).json({ message: "OK", data });
});

export const getSuppliersDetailed = catchAsyncError(async (req, res) => {
    const { startDate, endDate } = req.query;
    const companyFilter = req.companyFilter || {};
    const result = await reportsService.getSuppliersDetailed(startDate, endDate, companyFilter);
    res.status(200).json(result);
});

export const getSupplierGeneralLedger = catchAsyncError(async (req, res) => {
    const companyFilter = req.companyFilter || {};
    const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        supplierId: req.query.supplierId,
        branch: req.query.branch,
        accountId: req.query.accountId || req.query.journalAccount,
    };
    const result = await reportsService.getSupplierGeneralLedger(filters, companyFilter);
    res.status(200).json(result);
});

// Accounting Reports
export const getTrialBalance = catchAsyncError(async (req, res) => {
    const { startDate, endDate, branch, accountCodes } = req.query;
    const companyFilter = req.companyFilter || {};
    const filters = { branch, accountCodes: accountCodes ? (Array.isArray(accountCodes) ? accountCodes : [accountCodes]) : null };
    const result = await reportsService.getTrialBalance(startDate, endDate, companyFilter, filters);
    res.status(200).json(result);
});

export const getBalanceSheet = catchAsyncError(async (req, res) => {
    const { asOfDate, branch } = req.query;
    const companyFilter = req.companyFilter || {};
    const filters = { branch };
    const result = await reportsService.getBalanceSheet(asOfDate, companyFilter, filters);
    res.status(200).json(result);
});

export const getIncomeStatement = catchAsyncError(async (req, res) => {
    const { startDate, endDate, branch } = req.query;
    const companyFilter = req.companyFilter || {};
    const filters = { branch };
    const result = await reportsService.getIncomeStatement(startDate, endDate, companyFilter, filters);
    res.status(200).json(result);
});

export const getGeneralLedger = catchAsyncError(async (req, res) => {
    const { startDate, endDate, branch, accountId, accountCode, journal_account_id } = req.query;
    const companyFilter = req.companyFilter || {};
    
    let targetAccountId = accountId || journal_account_id;

    // Normalize companyFilter
    const mc = { ...companyFilter };
    if (mc.companyId && typeof mc.companyId === 'string') {
        try { mc.companyId = new mongoose.Types.ObjectId(mc.companyId); } catch(e){}
    }

    // STEP 2 — Fix GL query resolution for Bank Accounts
    if (targetAccountId && mongoose.Types.ObjectId.isValid(targetAccountId)) {
        const { bankAccountModel } = await import("../bankaccounts/bankaccount.model.js");
        const bankAccount = await bankAccountModel.findOne({ _id: targetAccountId, companyId: mc.companyId }).lean();
        
        if (bankAccount) {
            console.log(`[GL DEBUG] Resolving BankAccount "${bankAccount.name}" for report`);
            if (bankAccount.journalAccount) {
                const journalAccId = (bankAccount.journalAccount._id || bankAccount.journalAccount).toString();
                
                // User requested log
                console.log(`[GL DEBUG] Using journal account ID: ${journalAccId} for bank account ${bankAccount.name}`);
                
                targetAccountId = journalAccId;
            } else {
                console.warn(`[GL] Bank account "${bankAccount.name}" has no journalAccount linked. Falling back to default code 1221.`);
                const { chartOfAccountsModel } = await import("../chartofaccounts/chartofaccounts.model.js");
                const defaultBankAcc = await chartOfAccountsModel.findOne({ companyId: mc.companyId, code: "1221" }).lean();
                if (defaultBankAcc) {
                    targetAccountId = defaultBankAcc._id.toString();
                    console.log(`[GL DEBUG] Resolved to default chart account ID: ${targetAccountId}`);
                }
            }
        }
    }

    const filters = { branch, accountId: targetAccountId, accountCode };

    try {
        const { dailyRestrictionModel } = await import("../dailyrestrictions/dailyrestrictions.model.js");
        const count = await dailyRestrictionModel.countDocuments({
            ...mc,
            "entries.account": targetAccountId
        });
        console.log(`[GL DEBUG] Daily restriction entries found for this account: ${count}`);
    } catch (err) {
        console.error(`[GL DEBUG] Error fetching entry count:`, err.message);
    }

    const result = await reportsService.getGeneralLedger(startDate, endDate, companyFilter, filters);
    res.status(200).json(result);
});

export const getTaxSummary = catchAsyncError(async (req, res) => {
    const { startDate, endDate, branch, taxId, taxPercent } = req.query;
    const companyFilter = req.companyFilter || {};
    const filters = { branch, taxId, taxPercent };
    const data = await reportsService.getTaxSummary(startDate, endDate, companyFilter, filters);
    res.status(200).json({ message: "OK", data });
});

export const getTaxDetailed = catchAsyncError(async (req, res) => {
    const { startDate, endDate, branch, taxId, taxPercent, groupBy } = req.query;
    const companyFilter = req.companyFilter || {};
    const filters = { branch, taxId, taxPercent, groupBy };
    const data = await reportsService.getTaxDetailed(startDate, endDate, companyFilter, filters);
    res.status(200).json({ message: "OK", data });
});

export const getSafeAccountStatement = catchAsyncError(async (req, res) => {
    const { startDate, endDate, safeId } = req.query;
    const companyFilter = req.companyFilter || {};
    const filters = { startDate, endDate, safeId };
    const result = await reportsService.getSafeAccountStatement(filters, companyFilter);
    res.status(200).json(result);
});

export const getCostCenters = catchAsyncError(async (req, res) => {
    const { startDate, endDate, branch, costCenterId } = req.query;
    const companyFilter = req.companyFilter || {};
    const filters = { startDate, endDate, branch, costCenterId };
    const result = await reportsService.getCostCenters(filters, companyFilter);
    res.status(200).json(result);
});
