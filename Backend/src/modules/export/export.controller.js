import { productModel } from "../product/product.model.js";
import { salesCustomerModel } from "../customers/customers.model.js";
import Contact from "../contacts/contacts.model.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import * as xlsx from 'xlsx';

/**
 * Helper to export data to Excel buffer
 */
const exportToExcel = (data, fileName, res) => {
    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename=${fileName}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
};

// ========== EXPORT PRODUCTS ==========
export const exportProducts = catchAsyncError(async (req, res) => {
    const products = await productModel.find({ companyId: req.user.companyId }).lean();
    const data = products.map(p => ({
        'Name': p.name,
        'Code': p.code || '',
        'Category': p.category || '',
        'Type': p.type,
        'Purchase Price': p.purchasePrice,
        'Selling Price': p.sellingPrice,
        'Stock': p.stockQuantity,
        'Taxable': p.taxable ? 'Yes' : 'No',
        'Tax Rate': p.taxRate
    }));
    exportToExcel(data, 'Products_Export', res);
});

// ========== EXPORT CUSTOMERS ==========
export const exportCustomers = catchAsyncError(async (req, res) => {
    const customers = await salesCustomerModel.find({ companyId: req.user.companyId }).lean();
    const data = customers.map(c => ({
        'Name': c.name,
        'Email': c.email,
        'Phone': c.phone,
        'Street': c.address?.street || '',
        'City': c.address?.city || '',
        'Country': c.address?.country || '',
        'Status': c.status
    }));
    exportToExcel(data, 'Customers_Export', res);
});

// ========== EXPORT SUPPLIERS ==========
export const exportSuppliers = catchAsyncError(async (req, res) => {
    const suppliers = await Contact.find({ companyId: req.user.companyId, module: 'suppliers' }).lean();
    const data = suppliers.map(s => ({
        'Name': s.name,
        'Email': s.email || '',
        'Phone': s.phone || '',
        'Type': s.type,
        'Tax Number': s.taxNumber || '',
        'Commercial Register': s.commercialRegister || ''
    }));
    exportToExcel(data, 'Suppliers_Export', res);
});
