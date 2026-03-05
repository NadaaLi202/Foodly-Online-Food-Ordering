import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useParams, useNavigate } from 'react-router-dom';
import api from './services/api';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
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
import ImportingSettings from './Pages/Settings/ImportingSettings';
import ExportingSettings from './Pages/Settings/ExportingSettings';
import CodingSettings from './Pages/Settings/CodingSettings';
import ApiSettings from './Pages/Settings/ApiSettings';
import BackupSettings from './Pages/Settings/BackupSettings';
import ImportEntityPage from './Pages/Settings/ImportEntityPage';
import PurchasesPage from './Pages/PurchasesPage';
import PurchaseInvoices from './Pages/Purchases/PurchaseInvoices';
import PurchaseRequests from './Pages/Purchases/PurchaseRequests';
import PurchaseOrders from './Pages/Purchases/PurchaseOrders';
import PurchaseReturns from './Pages/Purchases/PurchaseReturns';
import Suppliers from './Pages/Purchases/Suppliers';
import SupplierPayments from './Pages/Purchases/SupplierPayments';
import Invoices from './Pages/Sales/Invoices';
import Returns from './Pages/Sales/Returns';
import Quotations from './Pages/Sales/Quotations';
import Customers from './Pages/Sales/Customers';
import Payments from './Pages/Sales/Payments';
import Products from './Pages/Inventory/Products';
import Categories from './Pages/Inventory/Categories';
import Operations from './Pages/Inventory/Operations';
import Permissions from './Pages/Inventory/Permissions';
import Warehouses from './Pages/Inventory/Warehouses';
import Inventories from './Pages/Inventory/Inventories';
import JournalEntries from './Pages/Accounting/JournalEntries';
import ChartOfAccounts from './Pages/Accounting/ChartOfAccounts';
import CostCenters from './Pages/Accounting/CostCenters';
import Branches from './Pages/Branches/Branches';
import PartnerLists from './Pages/Branches/PartnerLists';
import Activities from './Pages/Branches/Activities';
import Expenses from './Pages/Finance/Expenses';
import Transactions from './Pages/Finance/Transactions';
import PermissionsFinance from './Pages/Finance/Permissions';
import Safes from './Pages/Finance/Safes';
import BankAccounts from './Pages/Finance/BankAccounts';
import Users from './Pages/Users/Users';
import Roles from './Pages/Users/Roles';
import LandingPage from './Pages/LandingPage';
import Login from './Pages/login';

// import CompanyLogin from './Pages/CompanyLogin';
import SalesMainPage from './Pages/Sales/SalesMainPage';
import InventoryMainPage from './Pages/Inventory/InventoryMainPage';
import PurchasesMainPage from './Pages/Purchases/PurchasesMainPage';
import FinanceMainPage from './Pages/Finance/FinanceMainPage';
import AccountingMainPage from './Pages/Accounting/AccountingMainPage';
import UsersMainPage from './Pages/Users/UsersMainPage';
import BranchesMainPage from './Pages/Branches/BranchesMainPage';

// Signup
import SignupLayout from './Pages/Signup/SignupLayout';
import SignupForm from './Pages/Signup/SignupForm';
import SignupCompanyForm from './Pages/Signup/CompanyForm';
import TaxSettings from './Pages/Signup/TaxSettings';
import PendingPage from './Pages/Signup/PendingPage';

// Templates
import TemplatesMainPage from './Pages/Templates/TemplatesMainPage';
import GeneralTemplates from './Pages/Templates/GeneralTemplates';
import GeneralTemplateAdd from './Pages/Templates/GeneralTemplates/GeneralTemplateAdd';
import GeneralTemplateEdit from './Pages/Templates/GeneralTemplates/GeneralTemplateEdit';
import InvoiceTemplates from './Pages/Templates/InvoiceTemplates';
import InvoiceTemplateAdd from './Pages/Templates/InvoiceTemplates/InvoiceTemplateAdd';
import InvoiceTemplateEdit from './Pages/Templates/InvoiceTemplates/InvoiceTemplateEdit';
import ProductLabels from './Pages/Templates/ProductLabels';
import ProductLabelAdd from './Pages/Templates/ProductLabels/ProductLabelAdd';
import ProductLabelEdit from './Pages/Templates/ProductLabels/ProductLabelEdit';
// SuperAdmin
import SuperAdminDashboard from './Pages/SuperAdmin/Dashboard';
import CompanyList from './Pages/SuperAdmin/CompanyList';
import CompanyForm from './Pages/SuperAdmin/CompanyForm';
import UserManagement from './Pages/SuperAdmin/UserManagement';

// Reports Imports
import SalesReportsPage from './Pages/Reports/Sales/SalesReportsPage';
import PurchasesReportsPage from './Pages/Reports/Purchases/PurchasesReportsPage';
import DetailedSalesReport from './Pages/Reports/Sales/DetailedSalesReport';
import DetailedPaymentsReport from './Pages/Reports/Sales/DetailedPaymentsReport';
import DetailedPurchasesReport from './Pages/Reports/Purchases/DetailedPurchasesReport';
import DetailedSupplierPaymentsReport from './Pages/Reports/Purchases/DetailedSupplierPaymentsReport';
import ClientsReportsPage from './Pages/Reports/Clients/ClientsReportsPage';
import SummaryCustomerReport from './Pages/Reports/Clients/SummaryCustomerReport';
import SuppliersReportsPage from './Pages/Reports/Suppliers/SuppliersReportsPage';
import DetailedSuppliersReport from './Pages/Reports/Suppliers/DetailedSuppliersReport';
import InventoryReportsPage from './Pages/Reports/Inventory/InventoryReportsPage';
import InventoryValueReport from './Pages/Reports/Inventory/InventoryValueReport';
import InventoryValueDetailedReport from './Pages/Reports/Inventory/InventoryValueDetailedReport';
import AccountingReportsPage from './Pages/Reports/Accounting/AccountingReportsPage';
import BalanceSheetReport from './Pages/Reports/Accounting/BalanceSheetReport';
import GeneralLedgerReport from './Pages/Reports/Accounting/GeneralLedgerReport';
import IncomeStatementReport from './Pages/Reports/Accounting/IncomeStatementReport';
import TrialBalanceReport from './Pages/Reports/Accounting/TrialBalanceReport';
import SummaryTaxReport from './Pages/Reports/Accounting/SummaryTaxReport';
import DetailedTaxReport from './Pages/Reports/Accounting/DetailedTaxReport';
import TaxReturnReport from './Pages/Reports/Accounting/TaxReturnReport';
import ReportsMainPage from './Pages/Reports/ReportsMainPage';

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
              <Route path="returns" element={<Returns />} />
              <Route path="quotations" element={<Quotations />} />
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
                <Route path="summary" element={<SummaryCustomerReport />} />
              </Route>
              <Route path="customers" element={<PlaceholderPage title="Customers Reports" />} />
              <Route path="suppliers" element={<ReportsLayout title="Suppliers Reports" />}>
                <Route index element={<SuppliersReportsPage />} />
                <Route path="detailed" element={<DetailedSuppliersReport />} />
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
              <Route path="invoices/add" element={<PurchaseInvoices />} />
              <Route path="purchase-orders" element={<PurchaseOrders />} />
              <Route path="returns" element={<PurchaseReturns />} />
              <Route path="requests" element={<PurchaseRequests />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="payments" element={<SupplierPayments />} />
            </Route>

            <Route path="finance">
              <Route index element={<FinanceMainPage />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="permissions" element={<PermissionsFinance />} />
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
      </AuthProvider>
    </BrowserRouter >
  );
}

export default App;
