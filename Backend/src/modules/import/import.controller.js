import { productModel } from "../product/product.model.js";
import { salesCustomerModel } from "../customers/customers.model.js";
import Contact from "../contacts/contacts.model.js";
import { AppError } from "../../utils/apperror.js";
import { catchAsyncError } from "../../middleware/catchasyncerror.js";
import * as xlsx from 'xlsx';

/**
 * Helper to parse Excel/CSV buffer into JSON
 */
const parseFile = (buffer) => {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(sheet);
};

// ========== IMPORT PRODUCTS ==========
export const importProducts = catchAsyncError(async (req, res, next) => {
    if (!req.file) return next(new AppError("Please upload a file", 400));

    const data = parseFile(req.file.buffer);
    const companyId = req.user.companyId;
    const createdBy = req.user._id;

    const products = data.map(row => ({
        name: row.Name || row['الاسم'],
        code: row.Code || row['الكود'],
        category: row.Category || row['التصنيف'],
        purchasePrice: Number(row['Purchase Price'] || row['سعر الشراء'] || 0),
        sellingPrice: Number(row['Selling Price'] || row['سعر البيع'] || 0),
        stockQuantity: Number(row.Stock || row['الكمية'] || 0),
        taxable: row.Taxable === 'Yes' || row['خاضع للضريبة'] === 'نعم',
        taxRate: Number(row['Tax Rate'] || row['نسبة الضريبة'] || 14),
        companyId,
        createdBy
    })).filter(p => p.name); // Basic validation

    if (products.length === 0) return next(new AppError("No valid products found in file", 400));

    await productModel.insertMany(products, { ordered: false }).catch(err => {
        // Handle partial success/duplicates if needed
        console.warn("Some products might have failed to insert (likely duplicates)", err.message);
    });

    res.status(201).json({ message: "Products imported successfully", count: products.length });
});

// ========== IMPORT CUSTOMERS ==========
export const importCustomers = catchAsyncError(async (req, res, next) => {
    if (!req.file) return next(new AppError("Please upload a file", 400));

    const data = parseFile(req.file.buffer);
    const companyId = req.user.companyId;
    const createdBy = req.user._id;

    const customers = data.map(row => ({
        name: row.Name || row['الاسم'],
        email: row.Email || row['البريد الإلكتروني'],
        phone: row.Phone || row['الهاتف'],
        address: {
            street: row.Street || row['الشارع'],
            city: row.City || row['المدينة'],
            country: row.Country || row['الدولة']
        },
        companyId,
        createdBy
    })).filter(c => c.name && c.email);

    if (customers.length === 0) return next(new AppError("No valid customers found in file", 400));

    await salesCustomerModel.insertMany(customers, { ordered: false }).catch(err => {
        console.warn("Some customers might have failed to insert", err.message);
    });

    res.status(201).json({ message: "Customers imported successfully", count: customers.length });
});

// ========== IMPORT SUPPLIERS ==========
export const importSuppliers = catchAsyncError(async (req, res, next) => {
    if (!req.file) return next(new AppError("Please upload a file", 400));

    const data = parseFile(req.file.buffer);
    const companyId = req.user.companyId;
    const createdBy = req.user._id;

    const suppliers = data.map(row => ({
        name: row.Name || row['الاسم'],
        email: row.Email || row['البريد الإلكتروني'],
        phone: row.Phone || row['الهاتف'],
        type: (row.Type || row['النوع'] || '').toLowerCase() === 'commercial' ? 'commercial' : 'individual',
        taxNumber: row['Tax Number'] || row['الرقم الضريبي'],
        commercialRegister: row['Commercial Register'] || row['السجل التجاري'],
        module: 'suppliers',
        companyId,
        createdBy
    })).filter(s => s.name);

    if (suppliers.length === 0) return next(new AppError("No valid suppliers found in file", 400));

    await Contact.insertMany(suppliers, { ordered: false }).catch(err => {
        console.warn("Some suppliers might have failed to insert", err.message);
    });

    res.status(201).json({ message: "Suppliers imported successfully", count: suppliers.length });
});
