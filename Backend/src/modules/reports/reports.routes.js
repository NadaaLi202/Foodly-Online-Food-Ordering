import express from "express";
import { validation } from "../../middleware/validation.js";
import { reportQuerySchema, salesInvoicesDetailedQuerySchema, purchasesInvoicesDetailedQuerySchema, inventorySummaryQuerySchema, inventoryMovementsQuerySchema, accountingReportQuerySchema, balanceSheetQuerySchema, generalLedgerQuerySchema, safeAccountStatementQuerySchema, costCentersQuerySchema } from "./reports.validation.js";
import { protectedRoutes, requirePermission } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applycompanyfilter.js";
import {
    getSalesSummary,
    getSalesDetailed,
    getSalesInvoicesDetailed,
    getPaymentsSummary,
    getPaymentsDetailed,
    getProfitSummary,
    getProfitDetailed,
    getPurchasesSummary,
    getPurchasesInvoicesDetailed,
    getPurchasesPaymentsSummary,
    getPurchasesPaymentsDetailed,
    getInventorySummary,
    getInventoryMovementsDetailed,
    getCustomersSummary,
    getCustomersDetailed,
    getClientGeneralLedger,
    getAgedReceivable,
    getSuppliersSummary,
    getSuppliersDetailed,
    getSupplierGeneralLedger,
    getTrialBalance,
    getBalanceSheet,
    getIncomeStatement,
    getGeneralLedger,
    getTaxSummary,
    getTaxDetailed,
    getSafeAccountStatement,
    getCostCenters,
    generateHtmlPdf,
} from "./reports.controller.js";

const router = express.Router();
router.use(protectedRoutes, applyCompanyFilter);

router.get("/sales/summary", validation(reportQuerySchema), requirePermission("sales_report:view"), getSalesSummary);
router.get("/sales/detailed", validation(reportQuerySchema), requirePermission("sales_report:view"), getSalesDetailed);
router.get("/sales/invoices/detailed", validation(salesInvoicesDetailedQuerySchema), requirePermission("sales_report:view"), getSalesInvoicesDetailed);
router.get("/payments/summary", validation(reportQuerySchema), requirePermission("customer_payments_report:view"), getPaymentsSummary);
router.get("/payments/detailed", validation(reportQuerySchema), requirePermission("customer_payments_report:view"), getPaymentsDetailed);
router.get("/profit/summary", validation(reportQuerySchema), requirePermission("product_profit_report:view"), getProfitSummary);
router.get("/profit/detailed", validation(reportQuerySchema), requirePermission("product_profit_report:view"), getProfitDetailed);

router.get("/purchases/summary", validation(reportQuerySchema), requirePermission("purchase_report:view"), getPurchasesSummary);
router.get("/purchases/invoices/detailed", validation(purchasesInvoicesDetailedQuerySchema), requirePermission("purchase_report:view"), getPurchasesInvoicesDetailed);
router.get("/purchases/payments/summary", validation(reportQuerySchema), requirePermission("supplier_payments_report:view"), getPurchasesPaymentsSummary);
router.get("/purchases/payments/detailed", validation(reportQuerySchema), requirePermission("supplier_payments_report:view"), getPurchasesPaymentsDetailed);

router.get("/inventory/summary", validation(inventorySummaryQuerySchema), requirePermission("inventory_operations:view"), getInventorySummary);
router.get("/inventory/movements/detailed", validation(inventoryMovementsQuerySchema), requirePermission("inventory_operations:view"), getInventoryMovementsDetailed);

router.get("/customers/summary", validation(reportQuerySchema), requirePermission("customers:view"), getCustomersSummary);
router.get("/customers/detailed", validation(reportQuerySchema), requirePermission("customers:view"), getCustomersDetailed);
router.get("/customers/general-ledger", validation(reportQuerySchema), requirePermission("customers:view"), getClientGeneralLedger);
router.get("/customers/aged-receivable", validation(reportQuerySchema), requirePermission("customers:view"), getAgedReceivable);

router.get("/suppliers/summary", validation(reportQuerySchema), requirePermission("suppliers:view"), getSuppliersSummary);
router.get("/suppliers/detailed", validation(reportQuerySchema), requirePermission("suppliers:view"), getSuppliersDetailed);
router.get("/suppliers/general-ledger", validation(reportQuerySchema), requirePermission("suppliers:view"), getSupplierGeneralLedger);

router.get("/accounting/trial-balance", validation(accountingReportQuerySchema), requirePermission("ledger_accounts:view"), getTrialBalance);
router.get("/accounting/balance-sheet", validation(balanceSheetQuerySchema), requirePermission("balance_sheet:view"), getBalanceSheet);
router.get("/accounting/income-statement", validation(accountingReportQuerySchema), requirePermission("income_statement:view"), getIncomeStatement);
router.get("/accounting/general-ledger", validation(generalLedgerQuerySchema), requirePermission("ledger_accounts:view"), getGeneralLedger);
router.get("/accounting/safe-account-statement", validation(safeAccountStatementQuerySchema), requirePermission("finance_operations:view"), getSafeAccountStatement);
router.get("/accounting/journal-analytic-account", validation(costCentersQuerySchema), requirePermission("ledger_accounts:view"), getCostCenters);
router.get("/accounting/tax-summary", validation(reportQuerySchema), requirePermission("finance_operations:view"), getTaxSummary);
router.get("/accounting/tax-detailed", validation(reportQuerySchema), requirePermission("finance_operations:view"), getTaxDetailed);
router.post("/pdf/generate", generateHtmlPdf);

export default router;
