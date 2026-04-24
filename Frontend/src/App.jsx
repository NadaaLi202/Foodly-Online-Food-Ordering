import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useParams, useNavigate } from 'react-router-dom';
import api from './services/api';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import PrintTemplateProvider from './components/common/PrintTemplateProvider';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './Pages/DashboardPage';
import SalesSettings from './Pages/Settings/SalesSettings';
import PurchasesSettings from './Pages/Settings/PurchasesSettings';
import CustomersSettings from './Pages/Settings/CustomersSettings';
import SuppliersSettings from './Pages/Settings/SuppliersSettings';
import AccountingSettings from './Pages/Settings/AccountingSettings';
import GeneralSettings from './Pages/Settings/GeneralSettings';
import ZatcaSettings from './Pages/Settings/ZatcaSettings';
import TaxesSettings from './Pages/Settings/TaxesSettings';
import ImportingSettings from './Pages/Settings/Importingsettings';
import ExportingSettings from './Pages/Settings/ExportingSettings';
import CodingSettings from './Pages/Settings/CodingSettings';
import ApiSettings from './Pages/Settings/ApiSettings';
import BackupSettings from './Pages/Settings/BackupSettings';
import ImportEntityPage from './Pages/Settings/ImportEntityPage';
import PurchasesPage from './Pages/Purchasespage';
import PurchaseInvoices from './Pages/purchases/PurchaseInvoices';
import PurchaseRequests from './Pages/purchases/PurchaseRequests';
import PurchaseOrders from './Pages/purchases/PurchaseOrders';
import PurchaseReturns from './Pages/purchases/PurchaseReturns';
import Suppliers from './Pages/purchases/Suppliers';
import SupplierPayments from './Pages/purchases/SupplierPayments';
import Invoices from './Pages/sales/Invoices';
import Returns from './Pages/sales/returns';
import Quotations from './Pages/sales/Quotations';
import Customers from './Pages/sales/Customers';
import Payments from './Pages/sales/Payments';
import Products from './Pages/inventory/Products';
import Categories from './Pages/inventory/Categories';
import Operations from './Pages/inventory/Operations';
import Permissions from './Pages/inventory/Permissions';
import Warehouses from './Pages/inventory/Warehouses';
import Inventories from './Pages/inventory/Inventories';
import JournalEntries from './Pages/accounting/JournalEntries';
import ChartOfAccounts from './Pages/accounting/ChartOfAccounts';
import CostCenters from './Pages/accounting/CostCenters';
import Branches from './Pages/branches/Branches';
import PartnerLists from './Pages/branches/PartnerLists';
import Activities from './Pages/branches/Activities';
import Expenses from './Pages/finance/Expenses';
import Transactions from './Pages/finance/Transactions';
import PermissionsFinance from './Pages/finance/Permissions';
import Safes from './Pages/finance/Safes';
import BankAccounts from './Pages/finance/BankAccounts';
import Users from './Pages/users/Users';
import Roles from './Pages/users/Roles';
import LandingPage from './Pages/LandingPage';
import Login from './Pages/login';
import InvoiceQATool from './Pages/Tools/InvoiceQATool';

// import CompanyLogin from './Pages/companylogin';
import SalesMainPage from './Pages/sales/Salesmainpage';
import InventoryMainPage from './Pages/inventory/Inventorymainpage';
import PurchasesMainPage from './Pages/purchases/Purchasesmainpage';
import FinanceMainPage from './Pages/finance/Financemainpage';
import AccountingMainPage from './Pages/accounting/Accountingmainpage';
import UsersMainPage from './Pages/users/Usersmainpage';
import BranchesMainPage from './Pages/branches/Branchesmainpage';

// Signup
import SignupLayout from './Pages/signup/Signuplayout';
import SignupForm from './Pages/signup/SignupForm';
import SignupCompanyForm from './Pages/signup/CompanyForm';
import TaxSettings from './Pages/signup/TaxSettings';
import PendingPage from './Pages/signup/Pendingpage';

// Templates
import TemplatesMainPage from './Pages/Templates/TemplatesMainPage';
import GeneralTemplates from './Pages/Templates/generaltemplates';
import GeneralTemplateAdd from './Pages/Templates/generaltemplates/GeneralTemplateAdd';
import GeneralTemplateEdit from './Pages/Templates/generaltemplates/GeneralTemplateEdit';
import InvoiceTemplates from './Pages/Templates/invoicetemplates';
import InvoiceTemplateAdd from './Pages/Templates/invoicetemplates/InvoiceTemplateAdd';
import InvoiceTemplateEdit from './Pages/Templates/invoicetemplates/InvoiceTemplateEdit';
import ProductLabels from './Pages/Templates/productlabels';
import ProductLabelAdd from './Pages/Templates/productlabels/ProductLabelAdd';
import ProductLabelEdit from './Pages/Templates/productlabels/ProductLabelEdit';
// SuperAdmin
import SuperAdminDashboard from './Pages/superadmin/Dashboard';
import CompanyList from './Pages/superadmin/CompanyList';
import CompanyForm from './Pages/superadmin/CompanyForm';
import UserManagement from './Pages/superadmin/UserManagement';

// Reports Imports
import SalesReportsPage from './Pages/Reports/sales/Salesreportspage';
import PurchasesReportsPage from './Pages/Reports/purchases/Purchasesreportspage';
import DetailedSalesReport from './Pages/Reports/sales/DetailedSalesReport';
import DetailedPaymentsReport from './Pages/Reports/sales/DetailedPaymentsReport';
import DetailedPurchasesReport from './Pages/Reports/purchases/DetailedPurchasesReport';
import DetailedSupplierPaymentsReport from './Pages/Reports/purchases/DetailedSupplierPaymentsReport';
import ClientsReportsPage from './Pages/Reports/clients/ClientsReportsPage';
import ClientGeneralLedger from './Pages/Reports/clients/ClientGeneralLedger';
import SuppliersReportsPage from './Pages/Reports/suppliers/SuppliersReportsPage';
import SupplierGeneralLedger from './Pages/Reports/suppliers/SupplierGeneralLedger';
import InventoryReportsPage from './Pages/Reports/inventory/Inventoryreportspage';
import InventoryValueReport from './Pages/Reports/inventory/InventoryValueReport';
import InventoryValueDetailedReport from './Pages/Reports/inventory/InventoryValueDetailedReport';
import AccountingReportsPage from './Pages/Reports/accounting/Accountingreportspage';
import BalanceSheetReport from './Pages/Reports/accounting/BalanceSheetReport';
import GeneralLedgerReport from './Pages/Reports/accounting/GeneralLedgerReport';
import IncomeStatementReport from './Pages/Reports/accounting/IncomeStatementReport';
import TrialBalanceReport from './Pages/Reports/accounting/TrialBalanceReport';
import SafeAccountStatementReport from './Pages/Reports/accounting/SafeAccountStatementReport';
import JournalAnalyticAccountReport from './Pages/Reports/accounting/JournalAnalyticAccountReport';
import SummaryTaxReport from './Pages/Reports/accounting/SummaryTaxReport';
import DetailedTaxReport from './Pages/Reports/accounting/DetailedTaxReport';
import TaxReturnReport from './Pages/Reports/accounting/TaxReturnReport';
import ReportsMainPage from './Pages/Reports/Reportsmainpage';

const ReportsLayout = ({ title }) => (
  <div className="flex flex-col h-full">
    {/* <h1 className="text-2xl font-bold px-6 py-4">{title}</h1> */}
    <Outlet />
  </div>
);

const PlaceholderPage = ({ title }) => (
  <div className="p-8 text-center text-gray-500 bg-white rounded-lg shadow-sm border border-gray-100">
    <h2 className="text-xl font-bold mb-2">{title}</h2>
    <p>Page under construction.</p>
  </div>
);

const CompanyAutoLogin = () => {
  const { slug } = useParams();
  const { loginAsCompany } = useAuth();
  const [status, setStatus] = useState('checking');
  const [debugLog, setDebugLog] = useState([]);

  const addLog = (msg) => {
    console.log(`[AutoLogin] ${msg}`);
    setDebugLog(prev => [...prev, msg]);
  };

  useEffect(() => {
    addLog(`Checking slug: ${slug}`);
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    let user = null;
    try {
      user = storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      addLog(`User parse error: ${e.message}`);
    }

    addLog(`Auth check - Token: ${!!token}, Role: ${user?.role}`);

    if (token && user?.role === 'superAdmin' && slug) {
      addLog(`Starting impersonation for slug: ${slug}`);
      api.get(`/companies/slug/${slug}`)
        .then(res => {
          const company = res.data.company;
          addLog(`Company lookup success: ${company?.name} (ID: ${company?._id})`);
          if (!company?._id) throw new Error("ID_NOT_FOUND");
          return api.post('/companies/impersonate', { companyId: company._id });
        })
        .then(res => {
          addLog(`Impersonation response success - Redirecting...`);
          loginAsCompany(res.data.company, res.data.token);
          window.location.href = '/dashboard';
        })
        .catch((err) => {
          const errorMsg = err.response?.data?.message || err.message;
          addLog(`Error: ${errorMsg}`);
          // Wait 2 seconds before fallback if there's an error to show the logs if needed
          setTimeout(() => setStatus('fallback'), 2000);
        });
    } else {
      addLog(`No superAdmin session or slug - falling back`);
      setStatus('fallback');
    }
  }, [slug, loginAsCompany]);

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4 p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="text-gray-600 font-bold text-lg">جاري التحقق من صلاحيات الدخول...</span>
        <div className="mt-8 p-4 bg-gray-100 rounded-lg w-full max-w-lg overflow-auto max-h-64 border border-gray-200">
          <p className="text-xs font-mono text-gray-500 mb-2 uppercase tracking-widest">Debug Info:</p>
          {debugLog.map((log, i) => (
            <div key={i} className="text-xs font-mono text-gray-700 py-1 border-b border-gray-200 last:border-0">
              {`> ${log}`}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <Navigate to={`/login${slug ? `?company=${slug}` : ''}`} replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PrintTemplateProvider>
          <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />


            {/* Signup Flow */}
            <Route path="/signup" element={<SignupLayout />}>
              <Route index element={<SignupForm />} />
              <Route path="company" element={<SignupCompanyForm />} />
              <Route path="tax" element={<TaxSettings />} />
              <Route path="pending" element={<PendingPage />} />
            </Route>

            <Route path="/company-login" element={<CompanyAutoLogin />} />
            <Route path="/company/:slug/login" element={<CompanyAutoLogin />} />

            {/* SuperAdmin Layout Route */}
            <Route
              path="/super-admin"
              element={
                <ProtectedRoute allowedRoles={['superAdmin']}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<SuperAdminDashboard />} />
              <Route path="companies" element={<CompanyList />} />
              <Route path="companies/new" element={<CompanyForm />} />
              <Route path="companies/edit/:id" element={<CompanyForm />} />
              <Route path="companies/:companyId/users" element={<UserManagement />} />
            </Route>

            {/* Dashboard Layout Route - SuperAdmin can access to view all company data */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['superAdmin', 'admin', 'accountant', 'employee', 'company']}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />

              <Route path="sales">
                <Route index element={<SalesMainPage />} />
                <Route path="invoices" element={<Invoices />} />
                <Route path="invoices/new" element={<Invoices />} />
                <Route path="returns" element={<Returns />} />
                <Route path="returns/new" element={<Returns />} />
                <Route path="quotations" element={<Quotations />} />
                <Route path="quotations/new" element={<Quotations />} />
                <Route path="customers" element={<Customers />} />
                <Route path="customers/:id" element={<Customers />} />
                <Route path="payments" element={<Payments />} />
              </Route>

              <Route path="inventory">
                <Route index element={<InventoryMainPage />} />
                <Route path="products" element={<Products />} />
                <Route path="categories" element={<Categories />} />
                <Route path="operations" element={<Operations />} />
                <Route path="permissions" element={<Permissions />} />
                <Route path="warehouses" element={<Warehouses />} />
                <Route path="inventories" element={<Inventories />} />
              </Route>

              <Route path="accounting">
                <Route index element={<AccountingMainPage />} />
                <Route path="journal-entries" element={<JournalEntries />} />
                <Route path="chart-of-accounts" element={<ChartOfAccounts />} />
                <Route path="cost-centers" element={<CostCenters />} />
              </Route>

              <Route path="reports">
                <Route index element={<ReportsMainPage />} />

                <Route path="sales">
                  <Route index element={<SalesReportsPage />} />
                  <Route path="detailed" element={<DetailedSalesReport />} />
                  <Route path="payments-detailed" element={<DetailedPaymentsReport />} />
                </Route>
                <Route path="purchases">
                  <Route index element={<PurchasesReportsPage />} />
                  <Route path="detailed" element={<DetailedPurchasesReport />} />
                  <Route path="payments-detailed" element={<DetailedSupplierPaymentsReport />} />
                </Route>
                <Route path="clients" element={<ReportsLayout title="Clients Reports" />}>
                  <Route index element={<ClientsReportsPage />} />
                  <Route path="general-ledger" element={<ClientGeneralLedger />} />
                </Route>
                <Route path="customers" element={<PlaceholderPage title="Customers Reports" />} />
                <Route path="suppliers" element={<ReportsLayout title="Suppliers Reports" />}>
                  <Route index element={<SuppliersReportsPage />} />
                  <Route path="general-ledger" element={<SupplierGeneralLedger />} />
                </Route>
                <Route path="inventory" element={<ReportsLayout title="Inventory Reports" />}>
                  <Route index element={<InventoryReportsPage />} />
                  <Route path="value" element={<InventoryValueReport />} />
                  <Route path="value-detailed" element={<InventoryValueDetailedReport />} />
                </Route>
                <Route path="accounting">
                  <Route index element={<AccountingReportsPage />} />
                  <Route path="balance-sheet" element={<BalanceSheetReport />} />
                  <Route path="income-statement" element={<IncomeStatementReport />} />
                  <Route path="trial-balance" element={<TrialBalanceReport />} />
                  <Route path="general-ledger" element={<GeneralLedgerReport />} />
                  <Route path="journal-analytic-account" element={<JournalAnalyticAccountReport />} />
                  <Route path="safe-account-statement" element={<SafeAccountStatementReport />} />
                  <Route path="tax-summary" element={<SummaryTaxReport />} />
                  <Route path="tax-detailed" element={<DetailedTaxReport />} />
                  <Route path="tax-return" element={<TaxReturnReport />} />
                </Route>
              </Route>

              <Route path="purchases">
                <Route index element={<PurchasesMainPage />} />
                <Route path="dashboard" element={<PurchasesPage />} />
                <Route path="suppliers/:id" element={<Suppliers />} />
                <Route path="invoices" element={<PurchaseInvoices />} />
                <Route path="invoices/new" element={<PurchaseInvoices />} />
                <Route path="invoices/add" element={<PurchaseInvoices />} />
                <Route path="purchase-orders" element={<PurchaseOrders />} />
                <Route path="purchase-orders/new" element={<PurchaseOrders />} />
                <Route path="returns" element={<PurchaseReturns />} />
                <Route path="returns/new" element={<PurchaseReturns />} />
                <Route path="requests" element={<PurchaseRequests />} />
                <Route path="requests/new" element={<PurchaseRequests />} />
                <Route path="suppliers" element={<Suppliers />} />
                <Route path="payments" element={<SupplierPayments />} />
              </Route>

              <Route path="finance">
                <Route index element={<FinanceMainPage />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="expenses/new" element={<Expenses />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="permissions" element={<PermissionsFinance />} />
                <Route path="requisitions" element={<PermissionsFinance />} />
                <Route path="requisitions/new" element={<PermissionsFinance />} />
                <Route path="safes" element={<Safes />} />
                <Route path="bank-accounts" element={<BankAccounts />} />
              </Route>

              <Route path="users">
                <Route index element={<UsersMainPage />} />
                <Route path="list" element={<Users />} />
                <Route path="roles" element={<Roles />} />
              </Route>

              <Route path="branches">
                <Route index element={<BranchesMainPage />} />
                <Route path="list" element={<Branches />} />
                <Route path="partner-lists" element={<PartnerLists />} />
                <Route path="businesses" element={<Activities />} />
              </Route>

              <Route path="templates">
                <Route index element={<TemplatesMainPage />} />
                <Route path="general" element={<GeneralTemplates />} />
                <Route path="general/add" element={<GeneralTemplateAdd />} />
                <Route path="general/:id/edit" element={<GeneralTemplateEdit />} />
                <Route path="invoices" element={<InvoiceTemplates />} />
                <Route path="invoices/add" element={<InvoiceTemplateAdd />} />
                <Route path="invoices/:id/edit" element={<InvoiceTemplateEdit />} />
                <Route path="product-labels" element={<ProductLabels />} />
                <Route path="product-labels/add" element={<ProductLabelAdd />} />
                <Route path="product-labels/:id/edit" element={<ProductLabelEdit />} />
                <Route path="invoice-qa" element={<InvoiceQATool />} />
              </Route>
            </Route>

            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={['superAdmin', 'admin', 'accountant', 'employee', 'company']}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="general" element={<GeneralSettings />} />
              <Route path="sales" element={<SalesSettings />} />
              <Route path="purchases" element={<PurchasesSettings />} />
              <Route path="customers" element={<CustomersSettings />} />
              <Route path="suppliers" element={<SuppliersSettings />} />
              <Route path="accounting" element={<AccountingSettings />} />
              <Route path="taxes" element={<TaxesSettings />} />
              <Route path="einvoice" element={<ZatcaSettings />} />
              <Route path="import">
                <Route index element={<ImportingSettings />} />
                <Route path=":entity" element={<ImportEntityPage />} />
              </Route>
              <Route path="export" element={<ExportingSettings />} />
              <Route path="coding" element={<CodingSettings />} />
              <Route path="api" element={<ApiSettings />} />
              <Route path="backups" element={<BackupSettings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PrintTemplateProvider>
      </AuthProvider>
    </BrowserRouter >
  );
}

export default App;
