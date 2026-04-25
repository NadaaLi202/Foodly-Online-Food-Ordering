import Invoice from "../invoices/invoices.model.js";
import { returnModel as ReturnDoc } from "../returns/returns.model.js";
import Transaction from "../transaction/transaction.model.js";
import Payment from "../payments/payments.model.js";
import Contact from "../contacts/contacts.model.js";
import { taxesModel } from "../taxes/taxes.model.js";
import { productModel } from "../product/product.model.js";
import { chartOfAccountsModel } from "../chartOfAccounts/chartOfAccounts.model.js";
import { dailyRestrictionModel } from "../dailyRestrictions/dailyRestrictions.model.js";
import { costCenterModel } from "../costCenters/costCenter.model.js";
import FinancialReceipt from "../FinancialTransactions/models/financialReceipt.model.js";
import FinancialDisbursement from "../FinancialTransactions/models/financialDisbursement.model.js";
import FinancialTransfer from "../FinancialTransactions/models/financialTransfer.model.js";
import { stockLogModel } from "../stockLogs/stockLog.model.js";
import mongoose from "mongoose";

/**
 * Parse YYYY-MM-DD to start of day (00:00:00) and end of day (23:59:59.999) in UTC
 */
function getDateRange(startDate, endDate) {
    if (!startDate || isNaN(new Date(startDate).getTime())) {
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    }
    if (!endDate || isNaN(new Date(endDate).getTime())) {
        const now = new Date();
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    }
    const start = new Date(startDate + "T00:00:00.000Z");
    const end = new Date(endDate + "T23:59:59.999Z");
    return { start, end };
}

/**
 * Sales summary: by month — invoices count, clients, products, إجمالي الفواتير, إجمالي المرتجعات, إجمالي خصومات المبيعات, صافي خصومات المبيعات, صافي المبيعات.
 * Uses Transaction model (sales invoices + sales returns).
 */
export async function getSalesSummary(startDate, endDate, companyFilter) {
    if (!startDate || !endDate) return [];
    const { start, end } = getDateRange(startDate, endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
    const baseMatch = {
        ...companyFilter,
        module: "sales",
        deletedAt: { $in: [null, undefined] },
        status: { $ne: "draft" },
        issueDate: { $gte: start, $lte: end },
    };

    const invoiceMatch = { ...baseMatch, documentType: "invoice" };
    const returnMatch = { ...baseMatch, documentType: "return" };

    const monthProject = {
        $project: {
            month: { $dateToString: { format: "%m-%Y", date: "$issueDate", timezone: "UTC" } },
        },
    };
    const monthGroup = (extra) => ({
        $group: {
            _id: "$month",
            ...extra,
        },
    });

    const invByMonth = await Transaction.aggregate([
        { $match: invoiceMatch },
        monthProject,
        {
            $group: {
                _id: "$month",
                invoices: { $sum: 1 },
                clients: { $addToSet: "$contact" },
                totalInvoices: { $sum: "$totalAmount" },
                totalPaid: { $sum: "$paidAmount" },
                totalRemaining: { $sum: "$remainingAmount" },
                totalSalesDiscounts: { $sum: "$totalDiscount" },
                itemsList: { $push: "$items" },
            },
        },
    ]);

    const retByMonth = await Transaction.aggregate([
        { $match: returnMatch },
        monthProject,
        monthGroup({
            totalReturns: { $sum: "$totalAmount" },
            totalReturnsDiscounts: { $sum: "$totalDiscount" },
        }),
    ]);

    const returnMap = Object.fromEntries((retByMonth || []).map((r) => [r._id, r]));
    const months = [...new Set([...(invByMonth || []).map((r) => r._id), ...(retByMonth || []).map((r) => r._id)])].sort();

    const data = months.map((month) => {
        const inv = (invByMonth || []).find((r) => r._id === month) || {};
        const ret = returnMap[month] || {};
        const totalInvoices = Number(inv.totalInvoices ?? 0);
        const totalReturns = Number(ret.totalReturns ?? 0);
        const totalSalesDiscounts = Number(inv.totalSalesDiscounts ?? 0);
        const totalReturnsDiscounts = Number(ret.totalReturnsDiscounts ?? 0);
        const netSalesDiscounts = totalSalesDiscounts - totalReturnsDiscounts;
        const netSales = totalInvoices - totalReturns;
        const totalPaid = Number(inv.totalPaid ?? 0);
        const totalRemaining = Number(inv.totalRemaining ?? 0);
        const allItems = (inv.itemsList || []).flat();
        const productIds = allItems.map((i) => i && i.product).filter(Boolean);
        const uniqueProducts = new Set(productIds.map((p) => p.toString())).size;
        const uniqueClients = (inv.clients || []).filter(Boolean).length;
        return {
            month,
            invoices: inv.invoices ?? 0,
            clients: uniqueClients,
            products: uniqueProducts,
            totalInvoices,
            totalReturns,
            totalSalesDiscounts,
            netSalesDiscounts,
            netSales,
            totalPaid,
            totalRemaining,
        };
    });

    const grandTotals = {
        totalInvoices: data.reduce((acc, r) => acc + r.totalInvoices, 0),
        totalReturns: data.reduce((acc, r) => acc + r.totalReturns, 0),
        totalSalesDiscounts: data.reduce((acc, r) => acc + r.totalSalesDiscounts, 0),
        netSalesDiscounts: data.reduce((acc, r) => acc + r.netSalesDiscounts, 0),
        netSales: data.reduce((acc, r) => acc + r.netSales, 0),
        totalPaid: data.reduce((acc, r) => acc + r.totalPaid, 0),
        totalRemaining: data.reduce((acc, r) => acc + r.totalRemaining, 0),
    };

    return { data, grandTotals };
}

/**
 * Purchases summary: by month — invoices, returns, orders counts; suppliers; products; totalInvoices, totalReturns, totalOrders; totalPurchasesDiscounts, totalReturnsDiscounts, netPurchasesDiscounts, netPurchases.
 * Uses Transaction model (module: purchases, documentType: invoice | return | purchaseOrder).
 */
export async function getPurchasesSummary(startDate, endDate, companyFilter) {
    if (!startDate || !endDate) return [];
    const { start, end } = getDateRange(startDate, endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
    const baseMatch = {
        ...companyFilter,
        module: "purchases",
        deletedAt: { $in: [null, undefined] },
        status: { $ne: "draft" },
        issueDate: { $gte: start, $lte: end },
    };
    const monthProject = {
        $project: {
            month: { $dateToString: { format: "%m-%Y", date: "$issueDate", timezone: "UTC" } },
        },
    };

    const invByMonth = await Transaction.aggregate([
        { $match: { ...baseMatch, documentType: "invoice" } },
        monthProject,
        {
            $group: {
                _id: "$month",
                invoices: { $sum: 1 },
                suppliers: { $addToSet: "$contact" },
                totalInvoices: { $sum: "$totalAmount" },
                totalPurchasesDiscounts: { $sum: "$totalDiscount" },
                itemsList: { $push: "$items" },
            },
        },
    ]);

    const retByMonth = await Transaction.aggregate([
        { $match: { ...baseMatch, documentType: "return" } },
        monthProject,
        {
            $group: {
                _id: "$month",
                returns: { $sum: 1 },
                totalReturns: { $sum: "$totalAmount" },
                totalReturnsDiscounts: { $sum: "$totalDiscount" },
            },
        },
    ]);

    const ordByMonth = await Transaction.aggregate([
        { $match: { ...baseMatch, documentType: "purchaseOrder" } },
        monthProject,
        {
            $group: {
                _id: "$month",
                orders: { $sum: 1 },
                totalOrders: { $sum: "$totalAmount" },
                itemsList: { $push: "$items" },
            },
        },
    ]);

    const returnMap = Object.fromEntries((retByMonth || []).map((r) => [r._id, r]));
    const orderMap = Object.fromEntries((ordByMonth || []).map((r) => [r._id, r]));
    const months = [
        ...new Set([
            ...(invByMonth || []).map((r) => r._id),
            ...(retByMonth || []).map((r) => r._id),
            ...(ordByMonth || []).map((r) => r._id),
        ]),
    ].sort();

    const data = months.map((month) => {
        const inv = (invByMonth || []).find((r) => r._id === month) || {};
        const ret = returnMap[month] || {};
        const ord = orderMap[month] || {};
        const totalInvoices = Number(inv.totalInvoices ?? 0);
        const totalReturns = Number(ret.totalReturns ?? 0);
        const totalOrders = Number(ord.totalOrders ?? 0);
        const totalPurchasesDiscounts = Number(inv.totalPurchasesDiscounts ?? 0);
        const totalReturnsDiscounts = Number(ret.totalReturnsDiscounts ?? 0);
        const netPurchasesDiscounts = totalPurchasesDiscounts - totalReturnsDiscounts;
        const netPurchases = totalInvoices - totalReturns;
        const allItems = [...(inv.itemsList || []).flat(), ...(ord.itemsList || []).flat()];
        const productIds = allItems.map((i) => i && i.product).filter(Boolean);
        const uniqueProducts = new Set(productIds.map((p) => p.toString())).size;
        const uniqueSuppliers = (inv.suppliers || []).filter(Boolean).length;
        return {
            month,
            invoices: inv.invoices ?? 0,
            returns: ret.returns ?? 0,
            orders: ord.orders ?? 0,
            suppliers: uniqueSuppliers,
            products: uniqueProducts,
            totalInvoices,
            totalReturns,
            totalOrders,
            totalPurchasesDiscounts,
            totalReturnsDiscounts,
            netPurchasesDiscounts,
            netPurchases,
        };
    });

    const grandTotals = {
        totalInvoices: data.reduce((acc, r) => acc + r.totalInvoices, 0),
        totalReturns: data.reduce((acc, r) => acc + r.totalReturns, 0),
        totalOrders: data.reduce((acc, r) => acc + r.totalOrders, 0),
        totalPurchasesDiscounts: data.reduce((acc, r) => acc + r.totalPurchasesDiscounts, 0),
        netPurchasesDiscounts: data.reduce((acc, r) => acc + r.netPurchasesDiscounts, 0),
        netPurchases: data.reduce((acc, r) => acc + r.netPurchases, 0),
    };

    return { data, grandTotals };
}

/**
 * Purchases detailed: all purchase documents (invoices, returns, purchase orders) with optional filters.
 * Returns list with _id, transactionNumber, documentType, month, supplier, amount, totalWithoutTax, discounts, date.
 */
export async function getPurchasesInvoicesDetailed(filters, companyFilter) {
    const { startDate, endDate, branch, supplier, warehouse, paymentStatus, salesResponsible, product } = filters || {};
    const query = {
        ...companyFilter,
        module: "purchases",
        documentType: { $in: ["invoice", "return", "purchaseOrder"] },
        deletedAt: { $in: [null, undefined] },
    };
    if (startDate && endDate && String(startDate).trim() && String(endDate).trim()) {
        const { start, end } = getDateRange(startDate, endDate);
        query.issueDate = { $gte: start, $lte: end };
    }
    if (warehouse && String(warehouse).trim()) query.warehouse = { $regex: String(warehouse).trim(), $options: "i" };
    if (branch && String(branch).trim()) query.warehouse = { $regex: String(branch).trim(), $options: "i" };
    if (supplier && String(supplier).trim() && supplier !== 'all' && mongoose.Types.ObjectId.isValid(supplier)) {
        query.$or = [
            { "contactSnapshot.name": { $regex: String(supplier).trim(), $options: "i" } },
            { contact: supplier },
        ];
    }
    if (paymentStatus && String(paymentStatus).trim()) query.status = paymentStatus;
    if (salesResponsible && String(salesResponsible).trim()) query.createdBy = salesResponsible;
    if (product && String(product).trim()) query["items.product"] = product;

    const raw = await Transaction.find(query)
        .sort({ issueDate: -1 })
        .populate("contact", "name")
        .select("transactionNumber issueDate documentType contactSnapshot subtotal totalDiscount totalTax totalAmount status warehouse createdBy items")
        .lean();

    const data = raw.map((doc) => {
        const d = doc.issueDate ? new Date(doc.issueDate) : null;
        const month = d ? `${String(d.getUTCMonth() + 1).padStart(2, "0")}-${d.getUTCFullYear()}` : "—";
        const supplierName = doc.contact?.name ?? doc.contactSnapshot?.name ?? "—";
        const totalWithoutTax = doc.subtotal != null ? doc.subtotal : (doc.totalAmount != null && doc.totalTax != null ? doc.totalAmount - doc.totalTax : doc.totalAmount ?? 0);
        const typeLabel = doc.documentType === "invoice" ? "invoice" : doc.documentType === "return" ? "return" : "purchaseOrder";
        return {
            _id: doc._id?.toString(),
            invoiceNumber: doc.transactionNumber,
            documentType: typeLabel,
            month,
            type: typeLabel,
            supplier: supplierName,
            client: supplierName,
            amount: doc.totalAmount ?? 0,
            totalWithoutTax,
            discounts: doc.totalDiscount != null ? doc.totalDiscount : 0,
            status: doc.status,
            date: doc.issueDate,
        };
    });

    const totalAmount = data.reduce((acc, r) => acc + Number(r.amount ?? 0), 0);
    const totalWithoutTax = data.reduce((acc, r) => acc + Number(r.totalWithoutTax ?? 0), 0);
    const totalDiscount = data.reduce((acc, r) => acc + Number(r.discounts ?? 0), 0);
    return {
        success: true,
        results: data.length,
        totals: { totalAmount, totalWithoutTax, totalDiscount },
        data,
    };
}

/**
 * Purchases payments summary: total spent (purchase payments in range), total due (purchase invoices in range: sum(totalAmount - paidAmount)).
 */
export async function getPurchasesPaymentsSummary(startDate, endDate, companyFilter) {
    const { start, end } = getDateRange(startDate, endDate);
    const [spentResult] = await Payment.aggregate([
        {
            $match: {
                ...companyFilter,
                module: "purchases",
                date: { $gte: start, $lte: end },
                status: { $ne: "cancelled" },
            },
        },
        {
            $group: {
                _id: null,
                totalSpent: { $sum: { $cond: [{ $eq: ["$operationType", "spend"] }, "$amount", 0] } },
                totalReceived: { $sum: { $cond: [{ $eq: ["$operationType", "receive"] }, "$amount", 0] } }
            }
        },
    ]);
    const totalSpent = spentResult?.totalSpent ?? 0;
    const totalReceived = spentResult?.totalReceived ?? 0;

    const [dueResult] = await Transaction.aggregate([
        {
            $match: {
                ...companyFilter,
                module: "purchases",
                documentType: "invoice",
                issueDate: { $gte: start, $lte: end },
                status: { $ne: "draft" },
            },
        },
        {
            $group: {
                _id: null,
                totalDue: { $sum: { $subtract: ["$totalAmount", "$paidAmount"] } },
            },
        },
    ]);
    const totalDue = dueResult?.totalDue ?? 0;
    return { totalSpent, totalReceived, totalDue };
}

/**
 * Purchases payments detailed: supplier payment list (reference, supplier, amount, date).
 */
export async function getPurchasesPaymentsDetailed(startDate, endDate, companyFilter) {
    const { start, end } = getDateRange(startDate, endDate);
    const list = await Payment.find({
        ...companyFilter,
        module: "purchases",
        date: { $gte: start, $lte: end },
        status: { $ne: "cancelled" },
    })
        .sort({ date: -1 })
        .populate("invoice", "transactionNumber currency")
        .populate("contact", "name")
        .lean();
    return list.map((doc) => ({
        invoiceNumber: doc.invoice?.transactionNumber ?? doc.referenceNumber ?? "—",
        supplier: doc.contact?.name ?? "—",
        client: doc.contact?.name ?? "—",
        paymentMethod: doc.treasury === "bank" ? "bank" : "cash",
        amount: doc.amount,
        date: doc.date,
        type: doc.operationType, // 'receive' or 'spend'
        currency: doc.invoice?.currency || doc.currency || null
    }));
}

/**
 * Sales detailed: invoice number, month, type, issue date, client, discounts, total without tax, total
 */
export async function getSalesDetailed(startDate, endDate, companyFilter) {
    const { start, end } = getDateRange(startDate, endDate);
    const list = await Invoice.find({
        ...companyFilter,
        issueDate: { $gte: start, $lte: end },
        status: { $ne: "draft" },
    })
        .sort({ issueDate: -1 })
        .select("invoiceNumber clientName total subtotal tax status issueDate invoiceDiscount")
        .lean();
    return list.map((doc) => {
        const d = doc.issueDate ? new Date(doc.issueDate) : null;
        const month = d ? `${String(d.getUTCMonth() + 1).padStart(2, "0")}-${d.getUTCFullYear()}` : "—";
        return {
            invoiceNumber: doc.invoiceNumber,
            month,
            client: doc.clientName,
            amount: doc.total,
            totalWithoutTax: doc.subtotal != null ? doc.subtotal : (doc.total != null && doc.tax != null ? doc.total - doc.tax : doc.total),
            discounts: doc.invoiceDiscount != null ? doc.invoiceDiscount : 0,
            status: doc.status,
            date: doc.issueDate,
        };
    });
}

/**
 * Sales invoices detailed (GET /reports/sales/invoices/detailed).
 * Uses the SAME Transaction model as Sales module (module: sales, documentType: invoice).
 * Filters ONLY by companyId when no query params; date range optional. No status filter that excludes new invoices.
 */
export async function getSalesInvoicesDetailed(filters, companyFilter) {
    const { startDate, endDate, branch, client, invoiceType, product, paymentStatus, warehouse, salesResponsible } = filters || {};

    const query = {
        ...companyFilter,
        module: "sales",
        documentType: "invoice",
        deletedAt: { $in: [null, undefined] },
    };

    if (startDate && endDate && String(startDate).trim() && String(endDate).trim()) {
        const { start, end } = getDateRange(startDate, endDate);
        query.issueDate = { $gte: start, $lte: end };
    }

    if (warehouse && String(warehouse).trim()) query.warehouse = { $regex: String(warehouse).trim(), $options: "i" };
    else if (branch && String(branch).trim()) query.warehouse = { $regex: String(branch).trim(), $options: "i" };
    if (client && String(client).trim() && client !== 'all' && mongoose.Types.ObjectId.isValid(client)) {
        query.$or = [
            { "contactSnapshot.name": { $regex: String(client).trim(), $options: "i" } },
            { contact: client },
        ];
    }
    if (paymentStatus && String(paymentStatus).trim()) query.status = paymentStatus;
    if (salesResponsible && String(salesResponsible).trim()) query.createdBy = salesResponsible;
    if (product && String(product).trim()) query["items.product"] = product;

    const raw = await Transaction.find(query)
        .sort({ issueDate: -1 })
        .populate("contact", "name")
        .select("transactionNumber issueDate contactSnapshot subtotal totalDiscount totalTax totalAmount paidAmount remainingAmount status warehouse createdBy items")
        .lean();

    const data = raw.map((doc) => {
        const d = doc.issueDate ? new Date(doc.issueDate) : null;
        const month = d ? `${String(d.getUTCMonth() + 1).padStart(2, "0")}-${d.getUTCFullYear()}` : "—";
        const clientName = doc.contact?.name ?? doc.contactSnapshot?.name ?? "—";
        const totalWithoutTax = doc.subtotal != null ? doc.subtotal : (doc.totalAmount != null && doc.totalTax != null ? doc.totalAmount - doc.totalTax : doc.totalAmount ?? 0);
        return {
            _id: doc._id?.toString(),
            invoiceNumber: doc.transactionNumber,
            month,
            type: "invoice",
            client: clientName,
            amount: doc.totalAmount ?? 0,
            paidAmount: doc.paidAmount ?? 0,
            remainingAmount: doc.remainingAmount ?? 0,
            totalWithoutTax,
            discounts: doc.totalDiscount != null ? doc.totalDiscount : 0,
            status: doc.status,
            date: doc.issueDate,
        };
    });

    const totalAmount = data.reduce((acc, r) => acc + Number(r.amount ?? 0), 0);
    const totalWithoutTax = data.reduce((acc, r) => acc + Number(r.totalWithoutTax ?? 0), 0);
    const totalDiscount = data.reduce((acc, r) => acc + Number(r.discounts ?? 0), 0);

    console.log("[reports] getSalesInvoicesDetailed companyId:", companyFilter?.companyId ?? "(none)", "total invoices found:", raw.length, "query:", JSON.stringify(query));

    return {
        success: true,
        results: data.length,
        totals: { totalAmount, totalWithoutTax, totalDiscount },
        data,
    };
}

/**
 * Payments summary: total received (sales receive), total spent (purchase spend), total sales due, total purchase due.
 */
export async function getPaymentsSummary(startDate, endDate, companyFilter) {
    const { start, end } = getDateRange(startDate, endDate);

    // 1. Total Received (Sales)
    const [receivedResult] = await Payment.aggregate([
        {
            $match: {
                ...companyFilter,
                module: "sales",
                operationType: "receive",
                date: { $gte: start, $lte: end },
                status: { $ne: "cancelled" },
            },
        },
        { $group: { _id: null, totalReceived: { $sum: "$amount" } } },
    ]);
    const totalReceived = receivedResult?.totalReceived ?? 0;

    // 2. Total Spent (Purchases)
    const [spentResult] = await Payment.aggregate([
        {
            $match: {
                ...companyFilter,
                module: "purchases",
                operationType: "spend",
                date: { $gte: start, $lte: end },
                status: { $ne: "cancelled" },
            },
        },
        { $group: { _id: null, totalSpent: { $sum: "$amount" } } },
    ]);
    const totalSpent = spentResult?.totalSpent ?? 0;

    // 3. Total Sales Due
    const [invoiceDueResult] = await Invoice.aggregate([
        {
            $match: {
                ...companyFilter,
                issueDate: { $gte: start, $lte: end },
                status: { $ne: "draft" },
            },
        },
        {
            $group: {
                _id: null,
                totalDue: { $sum: { $subtract: ["$total", "$paidAmount"] } },
            },
        },
    ]);
    const totalInvoiceDue = invoiceDueResult?.totalDue ?? 0;

    const [transactionSalesDueResult] = await Transaction.aggregate([
        {
            $match: {
                ...companyFilter,
                module: "sales",
                documentType: "invoice",
                issueDate: { $gte: start, $lte: end },
                status: { $ne: "draft" },
                deletedAt: { $in: [null, undefined] },
            },
        },
        {
            $group: {
                _id: null,
                totalDue: { $sum: { $subtract: ["$totalAmount", "$paidAmount"] } },
            },
        },
    ]);
    const totalTransactionSalesDue = transactionSalesDueResult?.totalDue ?? 0;
    const totalSalesDue = totalInvoiceDue + totalTransactionSalesDue;

    const purchasesDueArr = await Transaction.aggregate([
        {
            $match: {
                ...companyFilter,
                module: "purchases",
                documentType: "invoice",
                issueDate: { $gte: start, $lte: end },
                status: { $ne: "draft" },
            },
        },
        {
            $group: {
                _id: null,
                totalDue: { $sum: { $subtract: ["$totalAmount", "$paidAmount"] } },
            },
        },
    ]);
    const totalPurchasesDue = purchasesDueArr[0]?.totalDue ?? 0;

    return { totalReceived, totalSpent, totalSalesDue, totalPurchasesDue };
}

/**
 * Payments detailed: invoice number, client/supplier, type (receive/spend), payment method, amount, date
 */
export async function getPaymentsDetailed(startDate, endDate, companyFilter) {
    const { start, end } = getDateRange(startDate, endDate);
    const list = await Payment.find({
        ...companyFilter,
        date: { $gte: start, $lte: end },
        status: { $ne: "cancelled" },
        operationType: "receive",
    })
        .sort({ date: -1 })
        .populate("invoice", "transactionNumber currency")
        .populate("contact", "name")
        .lean();

    return list.map((doc) => ({
        invoiceNumber: doc.invoice?.transactionNumber ?? doc.referenceNumber ?? "—",
        client: doc.contact?.name ?? "—",
        paymentMethod: doc.treasury === "bank" ? "bank" : "cash",
        amount: doc.amount,
        date: doc.date,
        type: doc.operationType, // 'receive' or 'spend'
        currency: doc.invoice?.currency || doc.currency || null
    }));
}

/**
 * Profit summary: total profit = total sales - total cost (cost from product purchasePrice * quantity per invoice item)
 */
export async function getProfitSummary(startDate, endDate, companyFilter) {
    const { start, end } = getDateRange(startDate, endDate);
    const invoices = await Invoice.find({
        ...companyFilter,
        issueDate: { $gte: start, $lte: end },
        status: { $ne: "draft" },
    })
        .select("total items")
        .lean();
    let totalSales = 0;
    let totalCost = 0;
    const productIds = [...new Set(invoices.flatMap((inv) => inv.items || []).map((i) => i.productId).filter(Boolean))];
    const products = await productModel.find({ _id: { $in: productIds } }).select("purchasePrice").lean();
    const costByProduct = Object.fromEntries(products.map((p) => [p._id.toString(), p.purchasePrice ?? 0]));

    for (const inv of invoices) {
        totalSales += inv.total ?? 0;
        for (const item of inv.items || []) {
            const costPerUnit = item.productId ? costByProduct[item.productId.toString()] ?? 0 : 0;
            totalCost += (item.quantity ?? 0) * costPerUnit;
        }
    }
    const totalProfit = totalSales - totalCost;
    return { totalSales, totalCost, totalProfit };
}

/**
 * Profit detailed: per invoice - sales amount, cost, net profit
 */
export async function getProfitDetailed(startDate, endDate, companyFilter) {
    const { start, end } = getDateRange(startDate, endDate);
    const invoices = await Invoice.find({
        ...companyFilter,
        issueDate: { $gte: start, $lte: end },
        status: { $ne: "draft" },
    })
        .select("invoiceNumber total items")
        .lean();
    const productIds = [...new Set(invoices.flatMap((inv) => inv.items || []).map((i) => i.productId).filter(Boolean))];
    const products = await productModel.find({ _id: { $in: productIds } }).select("purchasePrice").lean();
    const costByProduct = Object.fromEntries(products.map((p) => [p._id.toString(), p.purchasePrice ?? 0]));

    const detailed = [];
    for (const inv of invoices) {
        let cost = 0;
        for (const item of inv.items || []) {
            const costPerUnit = item.productId ? costByProduct[item.productId.toString()] ?? 0 : 0;
            cost += (item.quantity ?? 0) * costPerUnit;
        }
        const salesAmount = inv.total ?? 0;
        detailed.push({
            invoiceNumber: inv.invoiceNumber,
            salesAmount,
            cost,
            netProfit: salesAmount - cost,
        });
    }
    return detailed;
}

// ========== CUSTOMERS REPORTS ==========

/**
 * Customers summary: total invoices, total returns, total payments received, total outstanding
 */
export async function getCustomersSummary(startDate, endDate, companyFilter, customerId) {
    const { start, end } = getDateRange(startDate, endDate);

    // Normalize companyFilter to ensure companyId is an ObjectId for aggregation
    const matchCompany = { ...companyFilter };
    if (matchCompany.companyId && typeof matchCompany.companyId === 'string') {
        matchCompany.companyId = new mongoose.Types.ObjectId(matchCompany.companyId);
    }

    const commonMatch = {
        ...matchCompany,
        issueDate: { $gte: start, $lte: end },
        status: { $ne: "draft" },
        deletedAt: { $in: [null, undefined] },
    };

    if (customerId && customerId !== 'all' && customerId !== '' && mongoose.Types.ObjectId.isValid(customerId)) {
        const cid = new mongoose.Types.ObjectId(customerId);

        // 1. Total Invoices
        const txnInvoiceResult = await Transaction.aggregate([
            { $match: { ...commonMatch, module: "sales", documentType: "invoice", contact: cid } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]);
        const accInvoiceResult = await Invoice.aggregate([
            { $match: { ...commonMatch, clientId: cid } },
            { $group: { _id: null, total: { $sum: "$total" } } },
        ]);
        const totalInvoices = (txnInvoiceResult[0]?.total ?? 0) + (accInvoiceResult[0]?.total ?? 0);

        // 2. Total Returns
        const txnReturnResult = await Transaction.aggregate([
            { $match: { ...commonMatch, module: "sales", documentType: "return", contact: cid } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]);
        const accReturnResult = await ReturnDoc.aggregate([
            {
                $match: {
                    ...matchCompany,
                    date: { $gte: start, $lte: end },
                    status: { $nin: ["Rejected", "cancelled"] }
                }
            },
            { $lookup: { from: "invoices", localField: "invoice", foreignField: "_id", as: "inv" } },
            { $unwind: "$inv" },
            { $match: { "inv.clientId": cid } },
            { $group: { _id: null, total: { $sum: "$totalRefundAmount" } } },
        ]);
        const totalReturns = (txnReturnResult[0]?.total ?? 0) + (accReturnResult[0]?.total ?? 0);

        // 3. Total Payments Received
        const pyMatch = {
            ...matchCompany,
            module: "sales",
            operationType: "receive",
            date: { $gte: start, $lte: end },
            status: { $ne: "cancelled" },
            deletedAt: { $in: [null, undefined] },
            contact: cid
        };
        const [paymentsResult] = await Payment.aggregate([
            { $match: pyMatch },
            { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);
        const totalPaid = paymentsResult?.total ?? 0;

        return {
            totalInvoices,
            totalReturns,
            totalPaid,
            outstandingAmount: totalInvoices - totalReturns - totalPaid
        };
    } else {
        // --- ALL CUSTOMERS ---
        const txnInvoiceResult = await Transaction.aggregate([
            { $match: { ...commonMatch, module: "sales", documentType: "invoice" } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]);
        const accInvoiceResult = await Invoice.aggregate([
            { $match: commonMatch },
            { $group: { _id: null, total: { $sum: "$total" } } },
        ]);
        const totalInvoices = (txnInvoiceResult[0]?.total ?? 0) + (accInvoiceResult[0]?.total ?? 0);

        const txnReturnResult = await Transaction.aggregate([
            { $match: { ...commonMatch, module: "sales", documentType: "return" } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]);
        const accReturnResult = await ReturnDoc.aggregate([
            {
                $match: {
                    ...matchCompany,
                    date: { $gte: start, $lte: end },
                    status: { $nin: ["Rejected", "cancelled"] }
                }
            },
            { $group: { _id: null, total: { $sum: "$totalRefundAmount" } } },
        ]);
        const totalReturns = (txnReturnResult[0]?.total ?? 0) + (accReturnResult[0]?.total ?? 0);

        const [paymentsResult] = await Payment.aggregate([
            {
                $match: {
                    ...matchCompany,
                    module: "sales",
                    operationType: "receive",
                    date: { $gte: start, $lte: end },
                    status: { $ne: "cancelled" },
                    deletedAt: { $in: [null, undefined] }
                }
            },
            { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);
        const totalPaid = paymentsResult?.total ?? 0;

        return {
            totalInvoices,
            totalReturns,
            totalPaid,
            outstandingAmount: totalInvoices - totalReturns - totalPaid
        };
    }
}


/**
 * Customers detailed: per customer - total invoices, total returns, total paid, outstanding
 */
export async function getCustomersDetailed(startDate, endDate, companyFilter) {
    const { start, end } = getDateRange(startDate, endDate);

    // Normalize companyFilter
    const matchCompany = { ...companyFilter };
    if (matchCompany.companyId && typeof matchCompany.companyId === 'string') {
        matchCompany.companyId = new mongoose.Types.ObjectId(matchCompany.companyId);
    }

    const commonMatch = {
        ...matchCompany,
        issueDate: { $gte: start, $lte: end },
        status: { $ne: "draft" },
        deletedAt: { $in: [null, undefined] },
    };

    // 1. Total Invoices per Customer (Transaction + Invoice)
    const txnInvoices = await Transaction.aggregate([
        { $match: { ...commonMatch, module: "sales", documentType: "invoice" } },
        { $group: { _id: "$contact", total: { $sum: "$totalAmount" } } },
    ]);

    const accInvoices = await Invoice.aggregate([
        { $match: { ...commonMatch } }, // Invoice uses clientId, but for "all" we don't match clientId yet
        { $group: { _id: "$clientId", total: { $sum: "$total" } } },
    ]);

    // 2. Total Returns per Customer (Transaction + ReturnDoc)
    const txnReturns = await Transaction.aggregate([
        { $match: { ...commonMatch, module: "sales", documentType: "return" } },
        { $group: { _id: "$contact", total: { $sum: "$totalAmount" } } },
    ]);

    const accReturns = await ReturnDoc.aggregate([
        {
            $match: {
                ...matchCompany,
                date: { $gte: start, $lte: end },
                status: { $nin: ["Rejected", "cancelled"] }
            }
        },
        { $lookup: { from: "invoices", localField: "invoice", foreignField: "_id", as: "inv" } },
        { $unwind: "$inv" },
        { $group: { _id: "$inv.clientId", total: { $sum: "$totalRefundAmount" } } },
    ]);

    // 3. Total Payments Received per Customer
    const txnPayments = await Payment.aggregate([
        {
            $match: {
                ...matchCompany,
                module: "sales",
                operationType: "receive",
                date: { $gte: start, $lte: end },
                status: { $ne: "cancelled" },
                deletedAt: { $in: [null, undefined] }
            }
        },
        { $group: { _id: "$contact", total: { $sum: "$amount" } } },
    ]);

    // Build Maps
    const combine = (arr, map = {}) => {
        arr.forEach(r => {
            if (!r._id) return;
            const id = r._id.toString();
            map[id] = (map[id] || 0) + (r.total || r.totalInvoices || r.totalReturns || r.totalPaid || 0);
        });
        return map;
    };

    const invoicesMap = {};
    combine(txnInvoices, invoicesMap);
    combine(accInvoices, invoicesMap);

    const returnsMap = {};
    combine(txnReturns, returnsMap);
    combine(accReturns, returnsMap);

    const paymentsMap = {};
    combine(txnPayments, paymentsMap);

    // Fetch ALL customers
    const customers = await Contact.find({
        ...matchCompany,
        module: "customer",
        deletedAt: { $in: [null, undefined] },
    }).select("name code").sort({ name: 1 }).lean();

    const data = customers.map(customer => {
        const cid = customer._id.toString();
        const totalInvoices = invoicesMap[cid] ?? 0;
        const totalReturns = returnsMap[cid] ?? 0;
        const totalPaid = paymentsMap[cid] ?? 0;

        return {
            customerId: cid,
            customerName: customer.name ?? "—",
            code: customer.code ?? "—",
            totalInvoices,
            totalReturns,
            totalPaid,
            outstanding: totalInvoices - totalReturns - totalPaid,
        };
    });

    return {
        success: true,
        results: data.length,
        data,
    };
}

/**
 * Client General Ledger: All transactions (invoices, returns, payments) for a specific client
 */
export async function getClientGeneralLedger(filters, companyFilter) {
    const { startDate, endDate, clientId, branch, accountId, accountCode, journalAccount } = filters || {};
    const { start, end } = getDateRange(startDate, endDate);

    console.log('[reports] getClientGeneralLedger Inputs:', { startDate, endDate, clientId, branch });

    // Normalize companyFilter
    const mc = { ...companyFilter };
    if (mc.companyId && typeof mc.companyId === 'string') {
        mc.companyId = new mongoose.Types.ObjectId(mc.companyId);
    }

    // 1. Identify Target Clients
    let targetContacts = [];
    if (clientId && clientId !== 'all' && mongoose.Types.ObjectId.isValid(clientId)) {
        const contact = await Contact.findOne({ _id: clientId, ...mc }).lean();
        if (contact) targetContacts.push(contact);
    } else {
        // Fetch all customers for this company
        targetContacts = await Contact.find({ ...mc, module: 'customer' }).lean();
    }

    console.log('[reports] getClientGeneralLedger Processing contacts:', targetContacts.length);

    const results = [];
    let globalTotalDebit = 0;
    let globalTotalCredit = 0;

    for (const contact of targetContacts) {
        const cid = contact._id;
        const cidStr = cid.toString();

        // A. Find all Invoices and Payments for this contact (to link journal entries)
        const contactDocQuery = { ...mc, contact: cid };
        const allInvoices = await Transaction.find({ ...contactDocQuery, module: 'sales', status: { $ne: 'draft' } }).select('_id transactionNumber').lean();
        const allPayments = await Payment.find({ ...contactDocQuery, module: 'sales', status: { $ne: 'cancelled' } }).select('_id referenceNumber invoiceId').lean();

        const contactInvoiceIds = allInvoices.map(i => i._id);
        const contactInvoiceIdStrs = contactInvoiceIds.map(id => id.toString());

        // Also include payments that link to these invoices (though contact query above covers most)
        const paymentIds = allPayments.map(p => p._id);
        const paymentIdStrs = paymentIds.map(id => id.toString());

        // B. Opening Balance
        let openingBalance = 0;

        // From Ledger (Restrictions)
        const ledgerOpeningQuery = {
            ...mc,
            date: { $lt: start },
            $or: [
                { invoiceId: { $in: contactInvoiceIds } },
                { "entries.description": { $regex: contact.name, $options: 'i' } }
            ]
        };
        const pastRestrictions = await dailyRestrictionModel.find(ledgerOpeningQuery).select("entries invoiceId sourceType").lean();

        const processedOpeningInvoices = new Set();
        const processedOpeningPayments = new Set();

        for (const res of pastRestrictions) {
            if (res.invoiceId) {
                if (res.sourceType === 'payment') processedOpeningPayments.add(res.invoiceId.toString());
                else processedOpeningInvoices.add(res.invoiceId.toString());
            }
            // Add up entries belonging to AR accounts for this contact
            for (const entry of res.entries || []) {
                const acc = entry.account;
                // If it's a sub-account matching name OR a generic AR account with an invoiceId link
                const isClientEntry = (res.invoiceId && contactInvoiceIdStrs.includes(res.invoiceId.toString())) ||
                    (entry.description && entry.description.includes(contact.name));

                if (isClientEntry) {
                    openingBalance += (Number(entry.debit || 0) - Number(entry.credit || 0));
                }
            }
        }

        // From Invoices/Payments NOT in ledger (Opening)
        const missingOpeningInvoices = await Transaction.find({
            ...contactDocQuery,
            module: 'sales',
            issueDate: { $lt: start },
            status: { $ne: 'draft' },
            _id: { $nin: Array.from(processedOpeningInvoices).map(id => new mongoose.Types.ObjectId(id)) }
        }).select('totalAmount').lean();
        for (const inv of missingOpeningInvoices) openingBalance += Number(inv.totalAmount || 0);

        const missingOpeningPayments = await Payment.find({
            ...contactDocQuery,
            module: 'sales',
            date: { $lt: start },
            status: { $ne: 'cancelled' },
            _id: { $nin: Array.from(processedOpeningPayments).map(id => new mongoose.Types.ObjectId(id)) }
        }).select('amount').lean();
        for (const pay of missingOpeningPayments) openingBalance -= Number(pay.amount || 0);


        // C. Period Transactions
        const entries = [];
        let accTotalDebit = 0;
        let accTotalCredit = 0;
        const processedPeriodInvoices = new Set();
        const processedPeriodPayments = new Set();

        // 1. From Ledger
        const restrictionQuery = {
            ...mc,
            date: { $gte: start, $lte: end },
            $or: [
                { invoiceId: { $in: contactInvoiceIds } },
                { "entries.description": { $regex: contact.name, $options: 'i' } }
            ]
        };
        if (branch && branch !== 'all') restrictionQuery.branch = branch;

        const restrictions = await dailyRestrictionModel.find(restrictionQuery).sort({ date: 1, createdAt: 1 }).lean();

        for (const res of restrictions) {
            const isContactJournal = res.invoiceId && contactInvoiceIdStrs.includes(res.invoiceId.toString());

            for (const entry of res.entries || []) {
                const entryDesc = entry.description || "";
                if (!isContactJournal && !entryDesc.includes(contact.name)) continue;

                if (res.invoiceId) {
                    if (res.sourceType === 'payment') processedPeriodPayments.add(res.invoiceId.toString());
                    else processedPeriodInvoices.add(res.invoiceId.toString());
                }

                const debit = Number(entry.debit || 0);
                const credit = Number(entry.credit || 0);
                accTotalDebit += debit;
                accTotalCredit += credit;

                entries.push({
                    date: res.date,
                    journalNumber: res.number,
                    description: entry.description || res.description || "",
                    debit,
                    credit,
                    source: res.source || "",
                    sourceType: res.sourceType || "manual"
                });
            }
        }

        // 2. Fallback (Virtual)
        const fallbackQuery = {
            ...contactDocQuery,
            module: 'sales',
            issueDate: { $gte: start, $lte: end },
            status: { $ne: 'draft' }
        };
        if (branch && branch !== 'all') fallbackQuery.warehouse = branch;

        const missingInvoices = await Transaction.find({
            ...fallbackQuery,
            _id: { $nin: Array.from(processedPeriodInvoices).map(id => new mongoose.Types.ObjectId(id)) }
        }).lean();

        const missingPayments = await Payment.find({
            ...contactDocQuery,
            module: 'sales',
            date: { $gte: start, $lte: end },
            status: { $ne: 'cancelled' },
            _id: { $nin: Array.from(processedPeriodPayments).map(id => new mongoose.Types.ObjectId(id)) }
        }).lean();

        // Get journal numbers for missing ones if any (e.g. if they exist but weren't caught in main query)
        const missingDocIds = [...missingInvoices.map(i => i._id), ...missingPayments.map(p => p._id)];
        const fallbackJournals = await dailyRestrictionModel.find({
            companyId: mc.companyId,
            invoiceId: { $in: missingDocIds }
        }).select('number invoiceId').lean();
        const jMap = new Map();
        fallbackJournals.forEach(j => jMap.set(j.invoiceId.toString(), j.number));

        for (const inv of missingInvoices) {
            const debit = Number(inv.totalAmount || 0);
            accTotalDebit += debit;
            entries.push({
                date: inv.issueDate,
                journalNumber: jMap.get(inv._id.toString()) || "—",
                description: `فاتورة مبيعات ${inv.transactionNumber}${jMap.has(inv._id.toString()) ? '' : ' (بدون قيد)'}`,
                debit,
                credit: 0,
                source: inv.transactionNumber,
                sourceType: "invoice"
            });
        }
        for (const pay of missingPayments) {
            const credit = Number(pay.amount || 0);
            accTotalCredit += credit;
            entries.push({
                date: pay.date,
                journalNumber: jMap.get(pay._id.toString()) || "—",
                description: `دفعة محصلة ${pay.referenceNumber || ''}${jMap.has(pay._id.toString()) ? '' : ' (بدون قيد)'}`,
                debit: 0,
                credit,
                source: pay.referenceNumber || 'سداد',
                sourceType: "payment"
            });
        }

        // Only include in results if active or has balance
        if (entries.length > 0 || openingBalance !== 0) {
            entries.sort((a, b) => new Date(a.date) - new Date(b.date));
            let runningBalance = openingBalance;
            for (const e of entries) {
                runningBalance += (e.debit - e.credit);
                e.balance = runningBalance;
            }

            globalTotalDebit += accTotalDebit;
            globalTotalCredit += accTotalCredit;

            results.push({
                accountId: cidStr,
                accountName: contact.name,
                accountCode: contact.code || cidStr.slice(-4),
                openingBalance,
                entries,
                netMovement: accTotalDebit - accTotalCredit,
                closingBalance: runningBalance,
                totalDebit: accTotalDebit,
                totalCredit: accTotalCredit
            });
        }
    }

    const reportResult = {
        success: true,
        data: results.sort((a, b) => a.accountName.localeCompare(b.accountName)),
        totals: {
            totalDebit: globalTotalDebit,
            totalCredit: globalTotalCredit,
            finalBalance: results.reduce((sum, r) => sum + r.closingBalance, 0)
        }
    };

    console.log('[reports] getClientGeneralLedger Overhauled Done, results:', results.length);
    return reportResult;
}

/**
 * Aged Receivable: Group invoices by aging periods
 */
export async function getAgedReceivable(filters, companyFilter) {
    const { startDate, endDate, clientId, branch, interval = 30, method = 'invoices', journalAccount } = filters || {};
    const intervalDays = parseInt(interval) || 30;

    const baseMatch = {
        ...companyFilter,
        module: "sales",
        documentType: method === 'invoices' ? "invoice" : "invoice",
        deletedAt: { $in: [null, undefined] },
        status: { $ne: "draft" },
    };

    if (startDate && endDate && String(startDate).trim() && String(endDate).trim()) {
        const { start, end } = getDateRange(startDate, endDate);
        baseMatch.issueDate = { $gte: start, $lte: end };
    }

    if (clientId && String(clientId).trim() && clientId !== 'unspecified' && clientId !== 'all' && mongoose.Types.ObjectId.isValid(clientId)) {
        baseMatch.contact = clientId;
    }

    if (branch && String(branch).trim() && branch !== 'all') {
        baseMatch.warehouse = { $regex: String(branch).trim(), $options: "i" };
    }

    // 1. Transactions (Sales Invoice)
    const txnInvoices = await Transaction.find(baseMatch)
        .populate("contact", "name code")
        .sort({ issueDate: 1 })
        .lean();

    // 2. Invoices (Invoice Model)
    const invMatch = {
        ...companyFilter,
        issueDate: baseMatch.issueDate,
        status: { $ne: "draft" },
        deletedAt: { $in: [null, undefined] },
    };
    if (clientId && String(clientId).trim() && clientId !== 'unspecified') {
        invMatch.clientId = clientId;
    }
    const accInvoices = await Invoice.find(invMatch)
        .populate("clientId", "name code")
        .sort({ issueDate: 1 })
        .lean();

    const allMatchedInvoices = [
        ...txnInvoices.map(ti => ({
            ...ti,
            _id: ti._id.toString(),
            total: ti.totalAmount,
            paid: ti.paidAmount,
            date: ti.issueDate,
            customer: ti.contact
        })),
        ...accInvoices.map(ai => ({
            ...ai,
            _id: ai._id.toString(),
            total: ai.total,
            paid: ai.paidAmount,
            date: ai.issueDate,
            customer: ai.clientId
        }))
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const agedData = allMatchedInvoices.map(inv => {
        const invoiceDate = new Date(inv.date);
        invoiceDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor((today - invoiceDate) / (1000 * 60 * 60 * 24));

        const outstanding = (inv.total || 0) - (inv.paid || 0);

        let todayAmount = 0;
        let day1_30 = 0;
        let day31_60 = 0;
        let day61_90 = 0;
        let day91Plus = 0;

        if (daysDiff < 0) {
            todayAmount = outstanding;
        } else if (daysDiff === 0) {
            todayAmount = outstanding;
        } else if (daysDiff <= intervalDays) {
            day1_30 = outstanding;
        } else if (daysDiff <= intervalDays * 2) {
            day31_60 = outstanding;
        } else if (daysDiff <= intervalDays * 3) {
            day61_90 = outstanding;
        } else {
            day91Plus = outstanding;
        }

        return {
            customerId: inv.customer?._id?.toString() || inv.customer?.toString(),
            customerName: inv.customer?.name || '—',
            journalAccount: journalAccount && journalAccount !== 'all' ? journalAccount : '—',
            today: todayAmount,
            day1_30,
            day31_60,
            day61_90,
            day91Plus,
            total: outstanding,
        };
    });

    // Group by customer and journal account
    const grouped = {};
    agedData.forEach(item => {
        const key = `${item.customerId}_${item.journalAccount}`;
        if (!grouped[key]) {
            grouped[key] = {
                customerId: item.customerId,
                customerName: item.customerName,
                journalAccount: item.journalAccount,
                today: 0,
                day1_30: 0,
                day31_60: 0,
                day61_90: 0,
                day91Plus: 0,
                total: 0,
            };
        }
        grouped[key].today += item.today;
        grouped[key].day1_30 += item.day1_30;
        grouped[key].day31_60 += item.day31_60;
        grouped[key].day61_90 += item.day61_90;
        grouped[key].day91Plus += item.day91Plus;
        grouped[key].total += item.total;
    });

    const result = Object.values(grouped);

    return {
        success: true,
        results: result.length,
        data: result,
    };
}

// ========== SUPPLIERS REPORTS ==========

/**
 * Supplier General Ledger (Account Statement): Overhauled to be supplier-centric.
 */
export async function getSupplierGeneralLedger(filters, companyFilter) {
    const { startDate, endDate, supplierId, branch, accountId, accountCode, journalAccount } = filters || {};
    const { start, end } = getDateRange(startDate, endDate);

    console.log('[reports] getSupplierGeneralLedger Overhaul Inputs:', { startDate, endDate, supplierId, branch });

    // Normalize companyFilter
    const mc = { ...companyFilter };
    if (mc.companyId && typeof mc.companyId === 'string') {
        mc.companyId = new mongoose.Types.ObjectId(mc.companyId);
    }

    // 1. Identify Target Suppliers
    let targetContacts = [];
    if (supplierId && supplierId !== 'all' && mongoose.Types.ObjectId.isValid(supplierId)) {
        const contact = await Contact.findOne({ _id: supplierId, ...mc }).lean();
        if (contact) targetContacts.push(contact);
    } else {
        // Fetch all suppliers for this company
        targetContacts = await Contact.find({ ...mc, module: 'supplier' }).lean();
    }

    console.log('[reports] getSupplierGeneralLedger Processing contacts:', targetContacts.length);

    const results = [];
    let globalTotalDebit = 0;
    let globalTotalCredit = 0;

    for (const contact of targetContacts) {
        const cid = contact._id;
        const cidStr = cid.toString();

        // A. Find all Purchase Invoices and Payments for this contact
        const contactDocQuery = { ...mc, contact: cid };

        console.log(`[DEBUG] supplier contactId: ${cidStr} (${contact.name})`);

        const invQuery = { ...contactDocQuery, module: 'purchases', status: { $ne: 'draft' } };
        console.log(`[DEBUG] invoice query:`, JSON.stringify(invQuery));
        const allInvoices = await Transaction.find(invQuery).select('_id transactionNumber').lean();
        console.log(`[DEBUG] invoices found: ${allInvoices.length}`);

        const payQuery = { ...contactDocQuery, module: 'purchases', status: { $ne: 'cancelled' } };
        console.log(`[DEBUG] payment query:`, JSON.stringify(payQuery));
        const allPayments = await Payment.find(payQuery).select('_id referenceNumber invoiceId').lean();
        console.log(`[DEBUG] payments found: ${allPayments.length}`);

        const contactInvoiceIds = allInvoices.map(i => i._id);
        const contactInvoiceIdStrs = contactInvoiceIds.map(id => id.toString());

        // B. Opening Balance
        let openingBalance = 0;

        // From Ledger (Restrictions)
        const ledgerOpeningQuery = {
            ...mc,
            date: { $lt: start },
            $or: [
                { invoiceId: { $in: contactInvoiceIds } },
                { "entries.description": { $regex: contact.name, $options: 'i' } }
            ]
        };
        const pastRestrictions = await dailyRestrictionModel.find(ledgerOpeningQuery).select("entries invoiceId sourceType").lean();

        const processedOpeningInvoices = new Set();
        const processedOpeningPayments = new Set();

        for (const res of pastRestrictions) {
            if (res.invoiceId) {
                if (res.sourceType === 'payment' || res.sourceType === 'purchases_payment') processedOpeningPayments.add(res.invoiceId.toString());
                else processedOpeningInvoices.add(res.invoiceId.toString());
            }
            for (const entry of res.entries || []) {
                const isSupplierEntry = (res.invoiceId && contactInvoiceIdStrs.includes(res.invoiceId.toString())) ||
                    (entry.description && entry.description.includes(contact.name));

                if (isSupplierEntry) {
                    openingBalance += (Number(entry.debit || 0) - Number(entry.credit || 0));
                }
            }
        }

        // From Invoices/Payments NOT in ledger (Opening)
        const missingOpeningInvoices = await Transaction.find({
            ...contactDocQuery,
            module: 'purchases',
            issueDate: { $lt: start },
            status: { $ne: 'draft' },
            _id: { $nin: Array.from(processedOpeningInvoices).map(id => new mongoose.Types.ObjectId(id)) }
        }).select('totalAmount').lean();
        for (const inv of missingOpeningInvoices) openingBalance += Number(inv.totalAmount || 0);

        const missingOpeningPayments = await Payment.find({
            ...contactDocQuery,
            module: 'purchases',
            date: { $lt: start },
            status: { $ne: 'cancelled' },
            _id: { $nin: Array.from(processedOpeningPayments).map(id => new mongoose.Types.ObjectId(id)) }
        }).select('amount').lean();
        for (const pay of missingOpeningPayments) openingBalance -= Number(pay.amount || 0);

        // C. Period Transactions
        const entries = [];
        let accTotalDebit = 0;
        let accTotalCredit = 0;
        const processedPeriodInvoices = new Set();
        const processedPeriodPayments = new Set();

        // 1. From Ledger
        const restrictionQuery = {
            ...mc,
            date: { $gte: start, $lte: end },
            $or: [
                { invoiceId: { $in: contactInvoiceIds } },
                { "entries.description": { $regex: contact.name, $options: 'i' } }
            ]
        };
        if (branch && branch !== 'all') restrictionQuery.branch = branch;

        const restrictions = await dailyRestrictionModel.find(restrictionQuery).sort({ date: 1, createdAt: 1 }).lean();

        for (const res of restrictions) {
            const isContactJournal = res.invoiceId && contactInvoiceIdStrs.includes(res.invoiceId.toString());

            for (const entry of res.entries || []) {
                const entryDesc = entry.description || "";
                if (!isContactJournal && !entryDesc.includes(contact.name)) continue;

                if (res.invoiceId) {
                    if (res.sourceType === 'payment' || res.sourceType === 'purchases_payment') processedPeriodPayments.add(res.invoiceId.toString());
                    else processedPeriodInvoices.add(res.invoiceId.toString());
                }

                const debit = Number(entry.debit || 0);
                const credit = Number(entry.credit || 0);
                accTotalDebit += debit;
                accTotalCredit += credit;

                entries.push({
                    date: res.date,
                    journalNumber: res.number,
                    description: entry.description || res.description || "",
                    debit,
                    credit,
                    source: res.source || "",
                    sourceType: res.sourceType || "manual"
                });
            }
        }

        // 2. Fallback (Virtual)
        const fallbackQuery = {
            ...contactDocQuery,
            module: 'purchases',
            issueDate: { $gte: start, $lte: end },
            status: { $ne: 'draft' }
        };
        if (branch && branch !== 'all') fallbackQuery.warehouse = branch;

        const missingInvoices = await Transaction.find({
            ...fallbackQuery,
            _id: { $nin: Array.from(processedPeriodInvoices).map(id => new mongoose.Types.ObjectId(id)) }
        }).lean();

        const missingPayments = await Payment.find({
            ...contactDocQuery,
            module: 'purchases',
            date: { $gte: start, $lte: end },
            status: { $ne: 'cancelled' },
            _id: { $nin: Array.from(processedPeriodPayments).map(id => new mongoose.Types.ObjectId(id)) }
        }).lean();

        // Get journal numbers for missing ones
        const missingDocIds = [...missingInvoices.map(i => i._id), ...missingPayments.map(p => p._id)];
        const fallbackJournals = await dailyRestrictionModel.find({
            companyId: mc.companyId,
            invoiceId: { $in: missingDocIds }
        }).select('number invoiceId').lean();
        const jMap = new Map();
        fallbackJournals.forEach(j => jMap.set(j.invoiceId.toString(), j.number));

        for (const inv of missingInvoices) {
            const debit = Number(inv.totalAmount || 0);
            accTotalDebit += debit;
            entries.push({
                date: inv.issueDate,
                journalNumber: jMap.get(inv._id.toString()) || "—",
                description: `فاتورة مشتريات ${inv.transactionNumber}${jMap.has(inv._id.toString()) ? '' : ' (بدون قيد)'}`,
                debit,
                credit: 0,
                source: inv.transactionNumber,
                sourceType: "purchase_invoice"
            });
        }
        for (const pay of missingPayments) {
            const credit = Number(pay.amount || 0);
            accTotalCredit += credit;
            entries.push({
                date: pay.date,
                journalNumber: jMap.get(pay._id.toString()) || "—",
                description: `دفعة مصروفة ${pay.referenceNumber || ''}${jMap.has(pay._id.toString()) ? '' : ' (بدون قيد)'}`,
                debit: 0,
                credit,
                source: pay.referenceNumber || 'سداد',
                sourceType: "purchase_payment"
            });
        }

        // Only include in results if active or has balance
        if (entries.length > 0 || openingBalance !== 0) {
            entries.sort((a, b) => new Date(a.date) - new Date(b.date));
            let runningBalance = openingBalance;
            for (const e of entries) {
                runningBalance += (e.debit - e.credit);
                e.balance = runningBalance;
            }

            globalTotalDebit += accTotalDebit;
            globalTotalCredit += accTotalCredit;

            results.push({
                accountId: cidStr,
                accountName: contact.name,
                accountCode: contact.code || cidStr.slice(-4),
                openingBalance,
                entries,
                netMovement: accTotalDebit - accTotalCredit,
                closingBalance: runningBalance,
                totalDebit: accTotalDebit,
                totalCredit: accTotalCredit
            });
        }
    }

    const reportResult = {
        success: true,
        data: results.sort((a, b) => a.accountName.localeCompare(b.accountName)),
        totals: {
            totalDebit: globalTotalDebit,
            totalCredit: globalTotalCredit,
            finalBalance: results.reduce((sum, r) => sum + r.closingBalance, 0)
        }
    };

    console.log('[reports] getSupplierGeneralLedger Overhauled Done, results:', results.length);
    return reportResult;
}
export async function getSuppliersSummary(startDate, endDate, companyFilter) {
    const { start, end } = getDateRange(startDate, endDate);

    // Total purchases (purchase invoices)
    const [purchasesResult] = await Transaction.aggregate([
        {
            $match: {
                ...companyFilter,
                module: "purchases",
                documentType: "invoice",
                issueDate: { $gte: start, $lte: end },
                status: { $ne: "draft" },
                deletedAt: { $in: [null, undefined] },
            },
        },
        { $group: { _id: null, totalPurchases: { $sum: "$totalAmount" } } },
    ]);
    const totalPurchases = purchasesResult?.totalPurchases ?? 0;

    // Total returns (purchase returns)
    const [returnsResult] = await Transaction.aggregate([
        {
            $match: {
                ...companyFilter,
                module: "purchases",
                documentType: "return",
                issueDate: { $gte: start, $lte: end },
                status: { $ne: "draft" },
                deletedAt: { $in: [null, undefined] },
            },
        },
        { $group: { _id: null, totalReturns: { $sum: "$totalAmount" } } },
    ]);
    const totalReturns = returnsResult?.totalReturns ?? 0;

    // Total payments spent
    const [paymentsResult] = await Payment.aggregate([
        {
            $match: {
                ...companyFilter,
                module: "purchases",
                operationType: "spend",
                date: { $gte: start, $lte: end },
                status: { $ne: "cancelled" },
            },
        },
        { $group: { _id: null, totalPaymentsSpent: { $sum: "$amount" } } },
    ]);
    const totalPaymentsSpent = paymentsResult?.totalPaymentsSpent ?? 0;

    // Total outstanding = purchases - returns - payments
    const totalOutstanding = totalPurchases - totalReturns - totalPaymentsSpent;

    return { totalPurchases, totalReturns, totalPaymentsSpent, totalOutstanding };
}

/**
 * Suppliers detailed: per supplier - total purchases, total returns, total paid, outstanding
 */
export async function getSuppliersDetailed(startDate, endDate, companyFilter) {
    const { start, end } = getDateRange(startDate, endDate);

    // Aggregate purchases per supplier
    const purchasesBySupplier = await Transaction.aggregate([
        {
            $match: {
                ...companyFilter,
                module: "purchases",
                documentType: "invoice",
                issueDate: { $gte: start, $lte: end },
                status: { $ne: "draft" },
                deletedAt: { $in: [null, undefined] },
            },
        },
        {
            $group: {
                _id: "$contact",
                totalPurchases: { $sum: "$totalAmount" },
            },
        },
    ]);

    // Aggregate returns per supplier
    const returnsBySupplier = await Transaction.aggregate([
        {
            $match: {
                ...companyFilter,
                module: "purchases",
                documentType: "return",
                issueDate: { $gte: start, $lte: end },
                status: { $ne: "draft" },
                deletedAt: { $in: [null, undefined] },
            },
        },
        {
            $group: {
                _id: "$contact",
                totalReturns: { $sum: "$totalAmount" },
            },
        },
    ]);

    // Aggregate payments per supplier
    const paymentsBySupplier = await Payment.aggregate([
        {
            $match: {
                ...companyFilter,
                module: "purchases",
                operationType: "spend",
                date: { $gte: start, $lte: end },
                status: { $ne: "cancelled" },
            },
        },
        {
            $group: {
                _id: "$contact",
                totalPaid: { $sum: "$amount" },
            },
        },
    ]);

    // Build maps for quick lookup (from transactions in date range)
    const purchasesMap = Object.fromEntries(purchasesBySupplier.map(r => [r._id?.toString(), r.totalPurchases ?? 0]));
    const returnsMap = Object.fromEntries(returnsBySupplier.map(r => [r._id?.toString(), r.totalReturns ?? 0]));
    const paymentsMap = Object.fromEntries(paymentsBySupplier.map(r => [r._id?.toString(), r.totalPaid ?? 0]));

    // Fetch ALL suppliers for the company (Contact module is "supplier").
    // New suppliers without any transactions appear with zeros; no date/transaction filter on the list.
    const supplierFilter = {
        ...companyFilter,
        module: "supplier",
        deletedAt: { $in: [null, undefined] },
    };
    const suppliers = await Contact.find(supplierFilter).select("name code").sort({ name: 1 }).lean();

    // Build result: every supplier gets a row (zeros if no transactions in range)
    const data = suppliers.map(supplier => {
        const supplierId = supplier._id.toString();
        const totalPurchases = purchasesMap[supplierId] ?? 0;
        const totalReturns = returnsMap[supplierId] ?? 0;
        const totalPaid = paymentsMap[supplierId] ?? 0;
        const outstanding = totalPurchases - totalReturns - totalPaid;

        return {
            supplierId: supplierId,
            supplierName: supplier.name ?? "—",
            code: supplier.code ?? "—",
            totalPurchases,
            totalReturns,
            totalPaid,
            outstanding,
        };
    });

    return {
        success: true,
        results: data.length,
        data,
    };
}

// ========== INVENTORY REPORTS ==========

/**
 * Inventory summary: product stock levels, values, and availability
 */
export async function getInventorySummary(filters, companyFilter) {
    const { warehouse, category, productsWithQuantityOnly, method } = filters || {};

    const query = {
        ...companyFilter,
        deletedAt: { $in: [null, undefined] },
        type: "tracked" // Only tracked products have inventory
    };

    if (warehouse && warehouse !== "all") {
        query.warehouse = { $regex: String(warehouse).trim(), $options: "i" };
    }
    if (category && category !== "all") {
        query.category = { $regex: String(category).trim(), $options: "i" };
    }
    if (productsWithQuantityOnly === "true" || productsWithQuantityOnly === true) {
        query.stockQuantity = { $gt: 0 };
    }

    const products = await productModel.find(query)
        .select("name code stockQuantity purchasePrice averageCost sellingPrice warehouse category")
        .sort({ name: 1 })
        .lean();

    const data = products.map(product => {
        const quantity = product.stockQuantity ?? 0;

        // Define cost based on selection method
        let unitCost = 0;
        if (method === "purchase_price") {
            unitCost = product.purchasePrice ?? 0;
        } else {
            // Default to average_cost
            unitCost = product.averageCost ?? product.purchasePrice ?? 0;
        }

        const inventoryValue = quantity * unitCost;
        const potentialSalesValue = quantity * (product.sellingPrice ?? 0);
        const potentialProfit = potentialSalesValue - inventoryValue;

        return {
            productId: product._id.toString(),
            productName: product.name ?? "—",
            code: product.code ?? "—",
            quantity,
            unitCost,
            inventoryValue,
            sellingPrice: product.sellingPrice ?? 0,
            potentialSalesValue,
            potentialProfit,
            warehouse: product.warehouse ?? "—",
            category: product.category ?? "—",
        };
    });

    const totals = data.reduce((acc, item) => {
        acc.totalQuantity += item.quantity;
        acc.totalInventoryValue += item.inventoryValue;
        acc.totalSalesValue += item.potentialSalesValue;
        acc.totalProfit += item.potentialProfit;
        return acc;
    }, { totalQuantity: 0, totalInventoryValue: 0, totalSalesValue: 0, totalProfit: 0 });

    return {
        success: true,
        results: data.length,
        totals,
        data,
    };
}

/**
 * Inventory movements detailed: stock in/out movements from StockLog
 */
export async function getInventoryMovementsDetailed(filters, companyFilter) {
    const { startDate, endDate, productId, product, warehouse } = filters || {};

    const query = {
        ...companyFilter,
    };

    if (startDate && endDate && String(startDate).trim() && String(endDate).trim()) {
        const { start, end } = getDateRange(startDate, endDate);
        query.createdAt = { $gte: start, $lte: end };
    }
    const effectiveProductId = productId || product;
    if (effectiveProductId) {
        query.product = effectiveProductId;
    }

    const logs = await stockLogModel.find(query)
        .sort({ createdAt: -1 })
        .populate("product", "name code")
        .populate({
            path: 'permission',
            select: 'transactionNumber number module documentType type warehouse'
        })
        .lean();

    const movements = logs.map(log => {
        // If it's a Transaction, use transactionNumber; if Requisition, use number
        const docNumber = log.permission?.transactionNumber || log.permission?.number || "—";
        const docType = log.permission?.documentType || log.permission?.type || "movement";

        return {
            date: log.createdAt,
            documentNumber: docNumber,
            docType: docType,
            productName: log.product?.name ?? "—",
            productCode: log.product?.code ?? "—",
            type: log.type, // 'in' or 'out'
            quantity: log.quantity,
            previousQuantity: log.previousQuantity,
            newQuantity: log.newQuantity,
            warehouse: log.permission?.warehouse || "—",
        };
    });

    return {
        success: true,
        results: movements.length,
        data: movements,
    };
}

// ========== ACCOUNTING REPORTS ==========

/**
 * Get account balances from journal entries (daily restrictions) for a date range.
 * Returns map: accountCode -> { openingDebit, openingCredit, periodDebit, periodCredit, closingDebit, closingCredit }
 */
async function getAccountBalances(startDate, endDate, companyFilter, accountCodes = null, branch = null) {
    const { start, end } = getDateRange(startDate, endDate);

    // Ensure companyId is handled as ObjectId if present in filter
    const effectiveFilter = { ...companyFilter };
    if (effectiveFilter.companyId && typeof effectiveFilter.companyId === "string") {
        try { effectiveFilter.companyId = new mongoose.Types.ObjectId(effectiveFilter.companyId); } catch (e) { /* ignore */ }
    }

    const query = { ...effectiveFilter, date: { $lte: end } };
    console.log("[reports] getAccountBalances query:", JSON.stringify(query));

    // Fetch accounts to map ID -> Code
    const accounts = await chartOfAccountsModel.find(effectiveFilter).select("_id code").lean();
    const idToCode = {};
    accounts.forEach(a => idToCode[a._id.toString()] = a.code);

    const restrictions = await dailyRestrictionModel.find(query).select("date entries").lean();
    console.log("[reports] getAccountBalances found restrictions:", restrictions.length);

    const balances = {};
    for (const restriction of restrictions) {
        const isBeforePeriod = restriction.date < start;
        for (const entry of restriction.entries || []) {
            const id = String(entry.account || "").trim();
            if (!id) continue;
            const code = idToCode[id] || id; // Fallback to id if not found in CoA

            if (accountCodes && !accountCodes.includes(code)) continue;
            if (!balances[code]) {
                balances[code] = { openingDebit: 0, openingCredit: 0, periodDebit: 0, periodCredit: 0 };
            }
            const debit = Number(entry.debit || 0);
            const credit = Number(entry.credit || 0);
            if (isBeforePeriod) {
                balances[code].openingDebit += debit;
                balances[code].openingCredit += credit;
            } else {
                balances[code].periodDebit += debit;
                balances[code].periodCredit += credit;
            }
        }
    }
    for (const code in balances) {
        const b = balances[code];
        const openingNet = b.openingDebit - b.openingCredit;
        const periodNet = b.periodDebit - b.periodCredit;
        const closingNet = openingNet + periodNet;
        b.closingDebit = closingNet > 0 ? closingNet : 0;
        b.closingCredit = closingNet < 0 ? Math.abs(closingNet) : 0;
    }
    return balances;
}

/**
 * Build hierarchical account tree from chart of accounts.
 */
async function buildAccountTree(companyFilter, accountCodes = null) {
    const query = { ...companyFilter, status: "active" };
    const accounts = await chartOfAccountsModel.find(query).select("_id code name type parentAccount").lean();
    const accountMap = {};
    const roots = [];
    for (const acc of accounts) {
        if (accountCodes && !accountCodes.includes(acc.code)) continue;
        accountMap[acc._id.toString()] = { ...acc, children: [] };
    }
    for (const acc of accounts) {
        if (accountCodes && !accountCodes.includes(acc.code)) continue;
        const node = accountMap[acc._id.toString()];
        if (acc.parentAccount && accountMap[acc.parentAccount.toString()]) {
            accountMap[acc.parentAccount.toString()].children.push(node);
        } else {
            roots.push(node);
        }
    }
    return roots.sort((a, b) => a.code.localeCompare(b.code));
}

/**
 * Shared helper to build hierarchical balanced data.
 */
async function getHierarchicalReportData(startDate, endDate, companyFilter, branch, accountCodes = null) {
    const balances = await getAccountBalances(startDate, endDate, companyFilter, accountCodes, branch);
    const tree = await buildAccountTree(companyFilter, accountCodes);

    const buildNode = (node, level = 0) => {
        const code = node.code;
        const bal = balances[code] || { openingDebit: 0, openingCredit: 0, periodDebit: 0, periodCredit: 0, closingDebit: 0, closingCredit: 0 };

        const children = (node.children || []).map(child => buildNode(child, level + 1));

        let initialDebit = bal.openingDebit || 0;
        let initialCredit = bal.openingCredit || 0;
        let transactionDebit = bal.periodDebit || 0;
        let transactionCredit = bal.periodCredit || 0;

        for (const child of children) {
            initialDebit += child.initialDebit;
            initialCredit += child.initialCredit;
            transactionDebit += child.transactionDebit;
            transactionCredit += child.transactionCredit;
        }

        const openingNet = initialDebit - initialCredit;
        const periodNet = transactionDebit - transactionCredit;
        const closingNet = openingNet + periodNet;

        // Trial Balance usually shows Debit/Credit columns separately
        const endDebit = closingNet > 0 ? closingNet : 0;
        const endCredit = closingNet < 0 ? Math.abs(closingNet) : 0;

        return {
            id: node._id.toString(),
            code,
            name: node.name,
            type: node.type,
            level,
            initialDebit,
            initialCredit,
            transactionDebit,
            transactionCredit,
            endDebit,
            endCredit,
            netBalance: closingNet, // Useful for BS/IS
            children,
        };
    };

    const data = tree.map(root => buildNode(root, 0));

    const totals = data.reduce((acc, root) => {
        acc.initialDebit += root.initialDebit;
        acc.initialCredit += root.initialCredit;
        acc.transactionDebit += root.transactionDebit;
        acc.transactionCredit += root.transactionCredit;
        acc.endDebit += root.endDebit;
        acc.endCredit += root.endCredit;
        return acc;
    }, { initialDebit: 0, initialCredit: 0, transactionDebit: 0, transactionCredit: 0, endDebit: 0, endCredit: 0 });

    return { data, totals };
}

/**
 * Trial Balance: All accounts with opening balance, period movements, closing balance.
 * Parent accounts aggregate all descendant balances bottom-up.
 */
export async function getTrialBalance(startDate, endDate, companyFilter, filters = {}) {
    const { branch, accountCodes } = filters;
    return await getHierarchicalReportData(startDate, endDate, companyFilter, branch, accountCodes);
}

/**
 * Balance Sheet: Assets, Liabilities, Equity as of a specific date.
 */
export async function getBalanceSheet(asOfDate, companyFilter, filters = {}) {
    const { branch } = filters;
    const endDate = asOfDate || new Date().toISOString().split("T")[0];
    const { data } = await getHierarchicalReportData("1970-01-01", endDate, companyFilter, branch);

    const assets = data.filter(n => n.code.startsWith("1"));
    const liabilities = data.filter(n => n.code.startsWith("2"));
    const equity = data.filter(n => n.code.startsWith("3"));

    const sumSection = (nodes) => nodes.reduce((sum, n) => sum + n.netBalance, 0);

    const totalAssets = sumSection(assets);
    const totalLiabilities = Math.abs(sumSection(liabilities));
    const totalEquity = Math.abs(sumSection(equity));

    return {
        assets: { items: assets, total: totalAssets },
        liabilities: { items: liabilities, total: totalLiabilities },
        equity: { items: equity, total: totalEquity },
        totalLiabilitiesAndEquity: totalLiabilities + totalEquity
    };
}

/**
 * Income Statement: Revenue and Expenses for a period.
 */
export async function getIncomeStatement(startDate, endDate, companyFilter, filters = {}) {
    const { branch } = filters;
    const { data } = await getHierarchicalReportData(startDate, endDate, companyFilter, branch);

    const revenue = data.filter(n => n.code.startsWith("4"));
    const expenses = data.filter(n => n.code.startsWith("5"));

    const sumSection = (nodes) => nodes.reduce((sum, n) => {
        // For IS, we usually want absolute or net impacts
        // Revenue is typically Credit balance (negative closingNet as implemented)
        // Expense is typically Debit balance (positive closingNet)
        // We'll return them as they are and let the UI decide, OR normalize here.
        // Let's normalize: Revenue (+ve), Expense (+ve)
        return sum + Math.abs(n.netBalance);
    }, 0);

    const totalRevenue = sumSection(revenue);
    const totalExpenses = sumSection(expenses);
    const netIncome = totalRevenue - totalExpenses;

    return {
        revenue: { items: revenue, total: totalRevenue },
        expenses: { items: expenses, total: totalExpenses },
        netIncome
    };
}

/**
 * General Ledger: Detailed transactions for specific account(s) in a period.
 */
export async function getGeneralLedger(startDate, endDate, companyFilter, filters = {}) {
    const { branch, accountId, accountCode } = filters;
    const { start, end } = getDateRange(startDate, endDate);

    // Normalize companyFilter
    const mc = { ...companyFilter };
    if (mc.companyId && typeof mc.companyId === 'string') {
        try { mc.companyId = new mongoose.Types.ObjectId(mc.companyId); } catch (e) { /* ignore */ }
    }

    // Resolve accounting IDs for the requested target
    let targetAccountIds = null;
    let selectedAccountDoc = null;

    if (accountId && accountId !== 'all') {
        selectedAccountDoc = await chartOfAccountsModel.findOne({ _id: accountId, ...mc }).select("name code").lean();
        if (selectedAccountDoc) {
            targetAccountIds = [selectedAccountDoc._id.toString()];
        }
    } else if (accountCode) {
        selectedAccountDoc = await chartOfAccountsModel.findOne({ code: accountCode, ...mc }).select("name code").lean();
        if (selectedAccountDoc) {
            targetAccountIds = [selectedAccountDoc._id.toString()];
        }
    }

    // 1. Calculate Opening Balance (from beginning of time until 'start')
    let openingBalance = 0;
    if (targetAccountIds) {
        const openingQuery = {
            ...mc,
            date: { $lt: start }
        };
        const pastRestrictions = await dailyRestrictionModel.find(openingQuery).select("entries").lean();
        for (const res of pastRestrictions) {
            for (const entry of res.entries || []) {
                if (targetAccountIds.includes(String(entry.account).trim())) {
                    openingBalance += (Number(entry.debit || 0) - Number(entry.credit || 0));
                }
            }
        }
    }

    // 2. Fetch Transactions in Period
    const query = { ...mc, date: { $gte: start, $lte: end } };
    const restrictions = await dailyRestrictionModel.find(query)
        .sort({ date: 1, createdAt: 1 })
        .populate("entries.account", "name code")
        .lean();

    const entries = [];
    let runningBalance = openingBalance;

    // Add Opening Balance Entry
    entries.push({
        date: null,
        description: "الرصيد السابق",
        isOpening: true,
        debit: 0,
        credit: 0,
        balance: openingBalance,
        accountName: selectedAccountDoc ? `${selectedAccountDoc.name} #${selectedAccountDoc.code}` : ""
    });

    for (const restriction of restrictions) {
        for (const entry of restriction.entries || []) {
            if (!entry.account) continue;

            // Handle both populated and unpopulated account field
            const isPopulated = entry.account && typeof entry.account === 'object' && entry.account._id;
            const entryAccountId = isPopulated ? entry.account._id.toString() : entry.account.toString();

            if (targetAccountIds && !targetAccountIds.includes(entryAccountId)) continue;

            // Optional branch filter
            if (branch && branch !== 'all' && restriction.branch?.toString() !== branch.toString()) continue;

            const debit = Number(entry.debit || 0);
            const credit = Number(entry.credit || 0);
            runningBalance += debit - credit;

            // Prepare account display string (Name + Code)
            let accountDisplayName = "";
            if (isPopulated) {
                accountDisplayName = entry.account.name || "";
                if (entry.account.code) {
                    accountDisplayName += ` #${entry.account.code}`;
                }
            } else {
                accountDisplayName = entry.account.toString(); // Fallback to ID if not found
            }

            entries.push({
                date: restriction.date,
                description: entry.description || restriction.description || "",
                accountCode: isPopulated ? entry.account.code : "",
                accountName: accountDisplayName, // This is what the frontend mainly uses
                debit,
                credit,
                balance: runningBalance,
                restrictionNumber: restriction.number,
                source: restriction.source || "",
                currency: restriction.currency || "EGP",
            });
        }
    }

    return {
        account: selectedAccountDoc ? { name: selectedAccountDoc.name, code: selectedAccountDoc.code } : null,
        openingBalance,
        entries,
        totalEntries: entries.length
    };
}

/**
 * Tax Reports: Summary and detailed tax calculations from transactions.
 */
async function resolveTaxPercent(taxId, taxPercent, companyFilter) {
    if (taxPercent !== undefined && taxPercent !== null && String(taxPercent).trim() !== "") {
        const value = Number(taxPercent);
        return Number.isFinite(value) ? value : null;
    }
    if (taxId) {
        const tax = await taxesModel.findOne({ _id: taxId, ...companyFilter }).select("percentage").lean();
        if (!tax) return null;
        const value = Number(tax.percentage);
        return Number.isFinite(value) ? value : null;
    }
    return null;
}

export async function getTaxSummary(startDate, endDate, companyFilter, filters = {}) {
    const { branch, taxId, taxPercent } = filters;
    const { start, end } = getDateRange(startDate, endDate);

    // Ensure companyId is handled as ObjectId for aggregate match
    const effectiveFilter = { ...companyFilter };
    if (effectiveFilter.companyId && typeof effectiveFilter.companyId === "string") {
        try { effectiveFilter.companyId = new mongoose.Types.ObjectId(effectiveFilter.companyId); } catch (e) { /* ignore */ }
    }

    const baseMatch = {
        ...effectiveFilter,
        $or: [{ module: "sales" }, { module: "purchases" }],
        documentType: { $in: ["invoice", "return"] },
        issueDate: { $gte: start, $lte: end },
        status: { $ne: "draft" },
        deletedAt: { $in: [null, undefined] },
    };
    console.log("[reports] getTaxSummary baseMatch:", JSON.stringify(baseMatch));
    if (branch && branch !== "all") baseMatch.warehouse = branch;

    const resolvedPercent = await resolveTaxPercent(taxId, taxPercent, companyFilter);

    const breakdown = {
        salesInvoices: { taxableAmount: 0, taxAmount: 0 },
        salesReturns: { taxableAmount: 0, taxAmount: 0 },
        purchaseInvoices: { taxableAmount: 0, taxAmount: 0 },
        purchaseReturns: { taxableAmount: 0, taxAmount: 0 },
        journalEntries: { taxableAmount: 0, taxAmount: 0 },
    };

    if (resolvedPercent !== null) {
        const grouped = await Transaction.aggregate([
            { $match: baseMatch },
            { $unwind: "$items" },
            { $match: { "items.taxPercent": resolvedPercent } },
            {
                $group: {
                    _id: { module: "$module", documentType: "$documentType" },
                    taxable: { $sum: "$items.subtotal" },
                    tax: { $sum: "$items.taxAmount" },
                },
            },
        ]);

        for (const row of grouped) {
            const module = row._id?.module;
            const docType = row._id?.documentType;
            const sign = docType === "return" ? -1 : 1;
            const taxable = Number(row.taxable ?? 0) * sign;
            const tax = Number(row.tax ?? 0) * sign;
            if (module === "sales" && docType === "invoice") {
                breakdown.salesInvoices.taxableAmount += taxable;
                breakdown.salesInvoices.taxAmount += tax;
            } else if (module === "sales" && docType === "return") {
                breakdown.salesReturns.taxableAmount += taxable;
                breakdown.salesReturns.taxAmount += tax;
            } else if (module === "purchases" && docType === "invoice") {
                breakdown.purchaseInvoices.taxableAmount += taxable;
                breakdown.purchaseInvoices.taxAmount += tax;
            } else if (module === "purchases" && docType === "return") {
                breakdown.purchaseReturns.taxableAmount += taxable;
                breakdown.purchaseReturns.taxAmount += tax;
            }
        }
    } else {
        const transactions = await Transaction.find(baseMatch)
            .select("module documentType totalTax totalAmount subtotal")
            .lean();

        for (const txn of transactions) {
            const sign = txn.documentType === "return" ? -1 : 1;
            const tax = Number(txn.totalTax || 0) * sign;
            const taxable = (txn.subtotal != null ? Number(txn.subtotal) : Number(txn.totalAmount || 0) - Number(txn.totalTax || 0)) * sign;
            if (txn.module === "sales" && txn.documentType === "invoice") {
                breakdown.salesInvoices.taxableAmount += taxable;
                breakdown.salesInvoices.taxAmount += tax;
            } else if (txn.module === "sales" && txn.documentType === "return") {
                breakdown.salesReturns.taxableAmount += taxable;
                breakdown.salesReturns.taxAmount += tax;
            } else if (txn.module === "purchases" && txn.documentType === "invoice") {
                breakdown.purchaseInvoices.taxableAmount += taxable;
                breakdown.purchaseInvoices.taxAmount += tax;
            } else if (txn.module === "purchases" && txn.documentType === "return") {
                breakdown.purchaseReturns.taxableAmount += taxable;
                breakdown.purchaseReturns.taxAmount += tax;
            }
        }
    }

    const totalSalesTax = breakdown.salesInvoices.taxAmount + breakdown.salesReturns.taxAmount;
    const totalPurchaseTax = breakdown.purchaseInvoices.taxAmount + breakdown.purchaseReturns.taxAmount;
    const totalSalesAmount = breakdown.salesInvoices.taxableAmount + breakdown.salesReturns.taxableAmount;
    const totalPurchaseAmount = breakdown.purchaseInvoices.taxableAmount + breakdown.purchaseReturns.taxableAmount;
    const netTaxPayable = totalSalesTax - totalPurchaseTax;

    return {
        totalSalesTax,
        totalPurchaseTax,
        totalSalesAmount,
        totalPurchaseAmount,
        netTaxPayable,
        breakdown,
        meta: {
            taxId: taxId || null,
            taxPercent: resolvedPercent,
        },
    };
}

/**
 * Tax Detailed: Per-transaction tax breakdown.
 */
export async function getTaxDetailed(startDate, endDate, companyFilter, filters = {}) {
    const { branch, taxId, taxPercent, groupBy } = filters;
    const { start, end } = getDateRange(startDate, endDate);

    // Ensure companyId is handled as ObjectId
    const effectiveFilter = { ...companyFilter };
    if (effectiveFilter.companyId && typeof effectiveFilter.companyId === "string") {
        try { effectiveFilter.companyId = new mongoose.Types.ObjectId(effectiveFilter.companyId); } catch (e) { /* ignore */ }
    }

    const baseMatch = {
        ...effectiveFilter,
        $or: [{ module: "sales" }, { module: "purchases" }],
        documentType: { $in: ["invoice", "return"] },
        issueDate: { $gte: start, $lte: end },
        status: { $ne: "draft" },
        deletedAt: { $in: [null, undefined] },
    };
    if (branch && branch !== "all") baseMatch.warehouse = branch;

    const resolvedPercent = await resolveTaxPercent(taxId, taxPercent, companyFilter);
    const items = [];

    if (resolvedPercent !== null) {
        const transactions = await Transaction.find({ ...baseMatch, "items.taxPercent": resolvedPercent })
            .sort({ issueDate: 1 })
            .populate("contact", "name taxNumber")
            .select("transactionNumber module documentType issueDate contactSnapshot items")
            .lean();

        for (const txn of transactions) {
            const sign = txn.documentType === "return" ? -1 : 1;
            const matchedItems = (txn.items || []).filter((item) => Number(item.taxPercent || 0) === resolvedPercent);
            const taxable = matchedItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0) * sign;
            const tax = matchedItems.reduce((sum, item) => sum + Number(item.taxAmount || 0), 0) * sign;
            const amount = matchedItems.reduce((sum, item) => sum + Number(item.total || 0), 0) * sign;
            items.push({
                date: txn.issueDate,
                documentNumber: txn.transactionNumber,
                type: txn.module === "sales"
                    ? (txn.documentType === "return" ? "sales_return" : "sales_invoice")
                    : (txn.documentType === "return" ? "purchase_return" : "purchase_invoice"),
                contactName: txn.contact?.name || txn.contactSnapshot?.name || "—",
                taxNumber: txn.contact?.taxNumber || "",
                amount,
                tax,
                taxable,
            });
        }
    } else {
        const transactions = await Transaction.find(baseMatch)
            .sort({ issueDate: 1 })
            .populate("contact", "name taxNumber")
            .select("transactionNumber module documentType totalTax totalAmount subtotal issueDate contactSnapshot")
            .lean();

        for (const txn of transactions) {
            const sign = txn.documentType === "return" ? -1 : 1;
            const tax = Number(txn.totalTax || 0) * sign;
            const amount = Number(txn.totalAmount || 0) * sign;
            const taxable = (txn.subtotal != null ? Number(txn.subtotal) : Number(txn.totalAmount || 0) - Number(txn.totalTax || 0)) * sign;
            items.push({
                date: txn.issueDate,
                documentNumber: txn.transactionNumber,
                type: txn.module === "sales"
                    ? (txn.documentType === "return" ? "sales_return" : "sales_invoice")
                    : (txn.documentType === "return" ? "purchase_return" : "purchase_invoice"),
                contactName: txn.contact?.name || txn.contactSnapshot?.name || "—",
                taxNumber: txn.contact?.taxNumber || "",
                amount,
                tax,
                taxable,
            });
        }
    }

    const sectionTotals = {
        sales_invoice: { taxableAmount: 0, taxAmount: 0 },
        sales_return: { taxableAmount: 0, taxAmount: 0 },
        purchase_invoice: { taxableAmount: 0, taxAmount: 0 },
        purchase_return: { taxableAmount: 0, taxAmount: 0 },
        journal_entries: { taxableAmount: 0, taxAmount: 0 },
    };

    for (const item of items) {
        if (!sectionTotals[item.type]) continue;
        sectionTotals[item.type].taxableAmount += Number(item.taxable || 0);
        sectionTotals[item.type].taxAmount += Number(item.tax || 0);
    }

    const invoicesTax = sectionTotals.sales_invoice.taxAmount + sectionTotals.sales_return.taxAmount
        + sectionTotals.purchase_invoice.taxAmount + sectionTotals.purchase_return.taxAmount;
    const totals = {
        invoicesTax,
        journalEntriesTax: 0,
        totalTax: invoicesTax,
    };

    return {
        items,
        sections: sectionTotals,
        totals,
        meta: {
            groupBy: groupBy || "invoice",
            taxId: taxId || null,
            taxPercent: resolvedPercent,
        },
    };
}

/**
 * Safe Account Statement: All journal entries for a specific safe
 * Shows debit/credit transactions affecting the safe balance
 */
export async function getSafeAccountStatement(filters, companyFilter) {
    const { startDate, endDate, safeId } = filters || {};

    const matchCompany = { ...companyFilter };
    if (matchCompany.companyId && typeof matchCompany.companyId === 'string') {
        matchCompany.companyId = new mongoose.Types.ObjectId(matchCompany.companyId);
    }

    const { start, end } = getDateRange(startDate, endDate);

    const [receipts, disbursements, transfersFrom, transfersTo] = await Promise.all([
        FinancialReceipt.find({ ...matchCompany, account: safeId, accountModel: 'Safe', deletedAt: { $in: [null, undefined] }, date: { $gte: start, $lte: end } }).lean(),
        FinancialDisbursement.find({ ...matchCompany, account: safeId, accountModel: 'Safe', deletedAt: { $in: [null, undefined] }, date: { $gte: start, $lte: end } }).lean(),
        FinancialTransfer.find({ ...matchCompany, fromAccount: safeId, fromAccountModel: 'Safe', deletedAt: { $in: [null, undefined] }, date: { $gte: start, $lte: end } }).lean(),
        FinancialTransfer.find({ ...matchCompany, toAccount: safeId, toAccountModel: 'Safe', deletedAt: { $in: [null, undefined] }, date: { $gte: start, $lte: end } }).lean(),
    ]);

    const entries = [];
    let runningBalance = 0;

    for (const receipt of receipts) {
        const amount = Number(receipt.amount || 0);
        runningBalance += amount;
        entries.push({
            date: receipt.date,
            number: receipt.code,
            description: receipt.description || receipt.externalAccount || 'Receipt',
            reference: receipt.externalAccount || receipt.code,
            debit: amount,
            credit: 0,
            balance: runningBalance,
            type: 'receipt'
        });
    }

    for (const transfer of transfersTo) {
        const amount = Number(transfer.amount || 0);
        runningBalance += amount;
        entries.push({
            date: transfer.date,
            number: transfer.code,
            description: transfer.description || `Transfer from ${transfer.fromAccountModel}`,
            reference: transfer.code,
            debit: amount,
            credit: 0,
            balance: runningBalance,
            type: 'transfer_in'
        });
    }

    for (const disbursement of disbursements) {
        const amount = Number(disbursement.amount || 0);
        runningBalance -= amount;
        entries.push({
            date: disbursement.date,
            number: disbursement.code,
            description: disbursement.description || disbursement.externalAccount || 'Disbursement',
            reference: disbursement.externalAccount || disbursement.code,
            debit: 0,
            credit: amount,
            balance: runningBalance,
            type: 'disbursement'
        });
    }

    for (const transfer of transfersFrom) {
        const amount = Number(transfer.amount || 0);
        runningBalance -= amount;
        entries.push({
            date: transfer.date,
            number: transfer.code,
            description: transfer.description || `Transfer to ${transfer.toAccountModel}`,
            reference: transfer.code,
            debit: 0,
            credit: amount,
            balance: runningBalance,
            type: 'transfer_out'
        });
    }

    entries.sort((a, b) => new Date(a.date) - new Date(b.date) || a.number.localeCompare(b.number || ''));

    return {
        safeId,
        entries,
        summary: {
            totalDebit: entries.reduce((sum, entry) => sum + entry.debit, 0),
            totalCredit: entries.reduce((sum, entry) => sum + entry.credit, 0),
            finalBalance: runningBalance
        }
    };
}

export async function getCostCenters(filters, companyFilter) {
    const { startDate, endDate, branch, costCenterId } = filters || {};
    const { start, end } = getDateRange(startDate, endDate);
    const query = { ...companyFilter, date: { $gte: start, $lte: end } };

    const restrictions = await dailyRestrictionModel.find(query).sort({ date: 1, createdAt: 1 }).select("number date description source entries").lean();

    const entries = [];
    let runningBalance = 0;

    for (const restriction of restrictions) {
        for (const entry of restriction.entries || []) {
            // Skip entries without cost center or if filtering by specific cost center
            if (!entry.costCenterId) continue;
            if (costCenterId && entry.costCenterId.toString() !== costCenterId) continue;

            const code = String(entry.account || "").trim();
            if (!code) continue;

            const debit = Number(entry.debit || 0);
            const credit = Number(entry.credit || 0);
            const percentage = entry.percentage ? Number(entry.percentage) : 100;

            runningBalance += debit - credit;

            entries.push({
                date: restriction.date,
                restrictionNumber: restriction.number,
                accountCode: code,
                description: entry.description || restriction.description || "",
                source: restriction.source || "",
                percentage: percentage,
                debit: debit,
                credit: credit,
                balance: runningBalance,
            });
        }
    }

    // Get cost center info if filtering by specific cost center
    let costCenter = null;
    if (costCenterId) {
        costCenter = await costCenterModel.findOne({ _id: costCenterId, ...companyFilter }).select("name").lean();
    }

    return {
        costCenter: costCenter ? { name: costCenter.name } : null,
        entries,
        totalEntries: entries.length,
        totalDebit: entries.reduce((sum, entry) => sum + entry.debit, 0),
        totalCredit: entries.reduce((sum, entry) => sum + entry.credit, 0),
        finalBalance: runningBalance
    };
}
