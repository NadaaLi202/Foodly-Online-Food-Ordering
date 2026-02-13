import api from "./api";

/**
 * Normalize frontend date (DD-MM-YYYY or similar) to API format YYYY-MM-DD
 */
function toApiDate(value) {
    if (!value) return undefined;
    const str = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const parts = str.split(/[-/]/);
    if (parts.length === 3) {
        const day = parts[0].padStart(2, "0");
        const month = parts[1].padStart(2, "0");
        const year = parts[2].length === 2 ? "20" + parts[2] : parts[2];
        return `${year}-${month}-${day}`;
    }
    return undefined;
}

function params(startDate, endDate) {
    const start = toApiDate(startDate);
    const end = toApiDate(endDate);
    if (!start || !end) return null;
    return { startDate: start, endDate: end };
}

export async function getSalesSummary(startDate, endDate) {
    const p = params(startDate, endDate);
    if (!p) throw new Error("startDate and endDate are required (YYYY-MM-DD or DD-MM-YYYY)");
    const response = await api.get("/reports/sales/summary", { params: p });
    return response.data;
}

export async function getSalesDetailed(startDate, endDate) {
    const p = params(startDate, endDate);
    if (!p) throw new Error("startDate and endDate are required");
    const response = await api.get("/reports/sales/detailed", { params: p });
    return response.data;
}

/**
 * Sales invoices detailed (GET /api/v1/reports/sales/invoices/detailed).
 * No query params required; API returns all company invoices by default.
 * Optional: fromDate, toDate, branch, client, invoiceType, product, paymentStatus, storehouse, salesperson/user.
 */
export async function getSalesInvoicesDetailed(filterState) {
    const { fromDate, toDate, branch, client, invoiceType, product, paymentStatus, storehouse, user, salesperson } = filterState || {};
    const query = {};
    const p = params(fromDate, toDate);
    if (p) {
        query.startDate = p.startDate;
        query.endDate = p.endDate;
    }
    if (branch) query.branch = branch;
    if (client) query.client = client;
    if (invoiceType) query.invoiceType = invoiceType;
    if (product) query.product = product;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (storehouse) query.warehouse = storehouse;
    if (salesperson) query.salesResponsible = salesperson;
    else if (user) query.salesResponsible = user;
    const response = await api.get("/reports/sales/invoices/detailed", { params: Object.keys(query).length ? query : undefined });
    return response.data;
}

export async function getPaymentsSummary(startDate, endDate) {
    const p = params(startDate, endDate);
    if (!p) throw new Error("startDate and endDate are required");
    const response = await api.get("/reports/payments/summary", { params: p });
    return response.data;
}

export async function getPaymentsDetailed(startDate, endDate) {
    const p = params(startDate, endDate);
    if (!p) throw new Error("startDate and endDate are required");
    const response = await api.get("/reports/payments/detailed", { params: p });
    return response.data;
}

export async function getProfitSummary(startDate, endDate) {
    const p = params(startDate, endDate);
    if (!p) throw new Error("startDate and endDate are required");
    const response = await api.get("/reports/profit/summary", { params: p });
    return response.data;
}

export async function getProfitDetailed(startDate, endDate) {
    const p = params(startDate, endDate);
    if (!p) throw new Error("startDate and endDate are required");
    const response = await api.get("/reports/profit/detailed", { params: p });
    return response.data;
}

export async function getPurchasesSummary(startDate, endDate) {
    const p = params(startDate, endDate);
    if (!p) throw new Error("startDate and endDate are required (YYYY-MM-DD or DD-MM-YYYY)");
    const response = await api.get("/reports/purchases/summary", { params: p });
    return response.data;
}

export async function getPurchasesInvoicesDetailed(filterState) {
    const { fromDate, toDate, branch, supplier, storehouse, paymentStatus, user, salesperson, product } = filterState || {};
    const query = {};
    const p = params(fromDate, toDate);
    if (p) {
        query.startDate = p.startDate;
        query.endDate = p.endDate;
    }
    if (branch) query.branch = branch;
    if (supplier) query.supplier = supplier;
    if (storehouse) query.warehouse = storehouse;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (salesperson) query.salesResponsible = salesperson;
    else if (user) query.salesResponsible = user;
    if (product) query.product = product;
    const response = await api.get("/reports/purchases/invoices/detailed", { params: Object.keys(query).length ? query : undefined });
    return response.data;
}

export async function getPurchasesPaymentsSummary(startDate, endDate) {
    const p = params(startDate, endDate);
    if (!p) throw new Error("startDate and endDate are required");
    const response = await api.get("/reports/purchases/payments/summary", { params: p });
    return response.data;
}

export async function getPurchasesPaymentsDetailed(startDate, endDate) {
    const p = params(startDate, endDate);
    if (!p) throw new Error("startDate and endDate are required");
    const response = await api.get("/reports/purchases/payments/detailed", { params: p });
    return response.data;
}

export async function getInventorySummary(filterState) {
    const { warehouse, category, productsWithQuantityOnly, method } = filterState || {};
    const query = {};
    if (warehouse && warehouse !== "all") query.warehouse = warehouse;
    if (category) query.category = category;
    if (productsWithQuantityOnly) query.productsWithQuantityOnly = productsWithQuantityOnly;
    if (method) query.method = method;
    const response = await api.get("/reports/inventory/summary", { params: Object.keys(query).length ? query : undefined });
    return response.data;
}

export async function getInventoryMovementsDetailed(filterState) {
    const { startDate, endDate, productId, warehouse } = filterState || {};
    const query = {};
    const p = params(startDate, endDate);
    if (p) {
        query.startDate = p.startDate;
        query.endDate = p.endDate;
    }
    if (productId) query.productId = productId;
    if (warehouse && warehouse !== "all") query.warehouse = warehouse;
    const response = await api.get("/reports/inventory/movements/detailed", { params: Object.keys(query).length ? query : undefined });
    return response.data;
}

export async function getCustomersSummary(startDate, endDate) {
    const p = params(startDate, endDate);
    if (!p) throw new Error("startDate and endDate are required");
    const response = await api.get("/reports/customers/summary", { params: p });
    return response.data;
}

export async function getCustomersDetailed(startDate, endDate) {
    const p = params(startDate, endDate);
    if (!p) throw new Error("startDate and endDate are required");
    const response = await api.get("/reports/customers/detailed", { params: p });
    return response.data;
}

export async function getClientGeneralLedger(filterState) {
    const { fromDate, toDate, clientId, branch, journalAccount } = filterState || {};
    const query = {};
    const p = params(fromDate, toDate);
    if (p) {
        query.startDate = p.startDate;
        query.endDate = p.endDate;
    }
    if (clientId && clientId !== 'unspecified') query.clientId = clientId;
    if (branch && branch !== 'all') query.branch = branch;
    if (journalAccount && journalAccount !== 'all') query.journalAccount = journalAccount;
    const response = await api.get("/reports/customers/general-ledger", { params: Object.keys(query).length ? query : undefined });
    return response.data;
}

export async function getAgedReceivable(filterState) {
    const { fromDate, toDate, clientId, branch, interval, method } = filterState || {};
    const query = {};
    const p = params(fromDate, toDate);
    if (p) {
        query.startDate = p.startDate;
        query.endDate = p.endDate;
    }
    if (clientId && clientId !== 'unspecified') query.clientId = clientId;
    if (branch && branch !== 'all') query.branch = branch;
    if (interval) query.interval = interval;
    if (method) query.method = method;
    const response = await api.get("/reports/customers/aged-receivable", { params: Object.keys(query).length ? query : undefined });
    return response.data;
}

export async function getSuppliersSummary(startDate, endDate) {
    const p = params(startDate, endDate);
    if (!p) throw new Error("startDate and endDate are required");
    const response = await api.get("/reports/suppliers/summary", { params: p });
    return response.data;
}

export async function getSuppliersDetailed(startDate, endDate) {
    const p = params(startDate, endDate);
    if (!p) throw new Error("startDate and endDate are required");
    const response = await api.get("/reports/suppliers/detailed", { params: p });
    return response.data;
}

export async function getSupplierGeneralLedger(filterState) {
    const { fromDate, toDate, supplierId, branch, journalAccount } = filterState || {};
    const p = params(fromDate, toDate);
    const now = new Date();
    const defaultStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const defaultEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, "0")}`;
    const query = {
        startDate: p?.startDate ?? defaultStart,
        endDate: p?.endDate ?? defaultEnd,
    };
    if (supplierId && supplierId !== 'unspecified') query.supplierId = supplierId;
    if (branch && branch !== 'all') query.branch = branch;
    if (journalAccount && journalAccount !== 'all') query.journalAccount = journalAccount;
    const response = await api.get("/reports/suppliers/general-ledger", { params: query });
    return response.data;
}

/** Fetch all suppliers for report filters (contacts/suppliers). Ensures new suppliers appear in dropdowns. */
export async function getSuppliersList() {
    try {
        const response = await api.get("/contacts/suppliers");
        const list = response.data?.contacts ?? response.data?.data ?? response.data ?? [];
        return Array.isArray(list) ? list : [];
    } catch (err) {
        if (import.meta.env?.DEV) {
            console.warn("[getSuppliersList]", err.response?.status ?? "Network Error", err.response?.data?.message ?? err.message);
        }
        throw err;
    }
}

// Accounting Reports
export async function getTrialBalance(startDate, endDate, filterState) {
    const p = params(startDate, endDate);
    if (!p) throw new Error("startDate and endDate are required");
    const query = { ...p, branch: filterState?.branch || undefined };
    const response = await api.get("/reports/accounting/trial-balance", { params: query });
    return response.data;
}

export async function getBalanceSheet(asOfDate, filterState) {
    const asOf = toApiDate(asOfDate);
    if (!asOf) throw new Error("asOfDate is required (YYYY-MM-DD or DD-MM-YYYY)");
    const query = { asOfDate: asOf, branch: filterState?.branch || undefined };
    const response = await api.get("/reports/accounting/balance-sheet", { params: query });
    return response.data;
}

export async function getIncomeStatement(startDate, endDate, filterState) {
    const p = params(startDate, endDate);
    if (!p) throw new Error("startDate and endDate are required");
    const query = { ...p, branch: filterState?.branch || undefined };
    const response = await api.get("/reports/accounting/income-statement", { params: query });
    return response.data;
}

export async function getGeneralLedger(startDate, endDate, filterState) {
    const p = params(startDate, endDate);
    if (!p) throw new Error("startDate and endDate are required");
    const query = { ...p, branch: filterState?.branch || undefined, accountId: filterState?.accountId || undefined, accountCode: filterState?.accountCode || undefined };
    const response = await api.get("/reports/accounting/general-ledger", { params: query });
    return response.data;
}

export async function getTaxSummary(startDate, endDate) {
    const p = params(startDate, endDate);
    if (!p) throw new Error("startDate and endDate are required");
    const response = await api.get("/reports/accounting/tax-summary", { params: p });
    return response.data;
}

export async function getTaxDetailed(startDate, endDate) {
    const p = params(startDate, endDate);
    if (!p) throw new Error("startDate and endDate are required");
    const response = await api.get("/reports/accounting/tax-detailed", { params: p });
    return response.data;
}

export default {
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
    getSuppliersList,
    getTrialBalance,
    getBalanceSheet,
    getIncomeStatement,
    getGeneralLedger,
    getTaxSummary,
    getTaxDetailed,
};
