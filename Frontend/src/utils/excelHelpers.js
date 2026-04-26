import * as XLSX from 'xlsx';

/**
 * Adds a professional header to an Excel worksheet data (AOA)
 * @param {Array<Array>} dataRows - The table data rows (including header)
 * @param {Object} options - { title, company, startDate, endDate, branch, t }
 * @returns {Array<Array>} - New AOA with header rows
 */
export function addExcelHeader(dataRows, { title, company = {}, startDate, endDate, branch, t }) {
    const rows = [];
    
    // 1. Company name and CR
    if (company?.name) {
        rows.push([company.name]);
    }
    if (company?.commercialReg) {
        rows.push([`${t ? t('general_settings.commercial_register') || 'السجل التجاري' : 'السجل التجاري'}: ${company.commercialReg}`]);
    }
    if (company?.taxNumber) {
        rows.push([`${t ? t('general_settings.tax_number') || 'الرقم الضريبي' : 'الرقم الضريبي'}: ${company.taxNumber}`]);
    }
    
    // 2. Report Title
    if (title) {
        rows.push([title]);
    }
    
    // 3. Date Range
    if (startDate && endDate) {
        rows.push([`من تاريخ: ${startDate} إلى تاريخ: ${endDate}`]);
    } else if (startDate || endDate) {
        rows.push([`التاريخ: ${startDate || endDate}`]);
    }
    
    // 4. Branch
    if (branch) {
        rows.push([`${t ? t('reports.filters.branch') || 'الفرع' : 'الفرع'}: ${branch}`]);
    }
    
    // Spacer row
    rows.push([]);
    
    return [...rows, ...dataRows];
}

/**
 * Generic Excel exporter
 */
export function exportToExcel(options) {
    const { 
        data, 
        filename, 
        sheetName = 'Report', 
        title, 
        company, 
        dateRange, 
        branch, 
        t 
    } = options;

    const startDate = dateRange?.fromDate || dateRange?.startDate || options.startDate;
    const endDate = dateRange?.toDate || dateRange?.endDate || options.endDate;

    let dataRows = [];
    if (Array.isArray(data)) {
        if (data.length > 0 && !Array.isArray(data[0])) {
            // Convert array of objects to AOA
            const headers = Object.keys(data[0]);
            dataRows = [headers, ...data.map(obj => headers.map(h => obj[h]))];
        } else {
            dataRows = data;
        }
    }

    const finalRows = addExcelHeader(dataRows, { title, company, startDate, endDate, branch, t });
    const ws = XLSX.utils.aoa_to_sheet(finalRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
}
