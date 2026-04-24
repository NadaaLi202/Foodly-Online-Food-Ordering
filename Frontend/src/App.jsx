import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useParams, useNavigate } from 'react-router-dom';
import api from './services/api';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout';
import PrintTemplateProvider from './components/common/printtemplateprovider';
import { AuthProvider, useAuth } from './context/authcontext';
import ProtectedRoute from './components/protectedroute';
import DashboardPage from './pages/dashboardpage';
import SalesSettings from './pages/settings/salessettings';
import PurchasesSettings from './pages/settings/purchasessettings';
import CustomersSettings from './pages/settings/customerssettings';
import SuppliersSettings from './pages/settings/supplierssettings';
import AccountingSettings from './pages/settings/accountingsettings';
import GeneralSettings from './pages/settings/generalsettings';
import ZatcaSettings from './pages/settings/zatcasettings';
import TaxesSettings from './pages/settings/taxessettings';
import ImportingSettings from './pages/settings/importingsettings';
import ExportingSettings from './pages/settings/exportingsettings';
import CodingSettings from './pages/settings/codingsettings';
import ApiSettings from './pages/settings/apisettings';
import BackupSettings from './pages/settings/backupsettings';
import ImportEntityPage from './pages/settings/importentitypage';
import PurchasesPage from './pages/purchasespage';
import PurchaseInvoices from './pages/purchases/purchaseinvoices';
import PurchaseRequests from './pages/purchases/purchaserequests';
import PurchaseOrders from './pages/purchases/purchaseorders';
import PurchaseReturns from './pages/purchases/purchasereturns';
import Suppliers from './pages/purchases/suppliers';
import SupplierPayments from './pages/purchases/supplierpayments';
import Invoices from './pages/sales/invoices';
import Returns from './pages/sales/returns';
import Quotations from './pages/sales/quotations';
import Customers from './pages/sales/customers';
import Payments from './pages/sales/payments';
import Products from './pages/inventory/products';
import Categories from './pages/inventory/categories';
import Operations from './pages/inventory/operations';
import Permissions from './pages/inventory/permissions';
import Warehouses from './pages/inventory/warehouses';
import Inventories from './pages/inventory/inventories';
import JournalEntries from './pages/accounting/journalentries';
import ChartOfAccounts from './pages/accounting/chartofaccounts';
import CostCenters from './pages/accounting/costcenters';
import Branches from './pages/branches/branches';
import PartnerLists from './pages/branches/partnerlists';
import Activities from './pages/branches/activities';
import Expenses from './pages/finance/expenses';
import Transactions from './pages/finance/transactions';
import PermissionsFinance from './pages/finance/permissions';
import Safes from './pages/finance/safes';
import BankAccounts from './pages/finance/bankaccounts';
import Users from './pages/users/users';
import Roles from './pages/users/roles';
import LandingPage from './pages/landingpage';
import Login from './pages/login';
import InvoiceQATool from './pages/tools/invoiceqatool';

// import CompanyLogin from './pages/companylogin';
import SalesMainPage from './pages/sales/salesmainpage';
import InventoryMainPage from './pages/inventory/inventorymainpage';
import PurchasesMainPage from './pages/purchases/purchasesmainpage';
import FinanceMainPage from './pages/finance/financemainpage';
import AccountingMainPage from './pages/accounting/accountingmainpage';
import UsersMainPage from './pages/users/usersmainpage';
import BranchesMainPage from './pages/branches/branchesmainpage';

// Signup
import SignupLayout from './pages/signup/signuplayout';
import SignupForm from './pages/signup/signupform';
import SignupCompanyForm from './pages/signup/companyform';
import TaxSettings from './pages/signup/taxsettings';
import PendingPage from './pages/signup/pendingpage';

// Templates
import TemplatesMainPage from './pages/templates/templatesmainpage';
import GeneralTemplates from './pages/templates/generaltemplates';
import GeneralTemplateAdd from './pages/templates/generaltemplates/generaltemplateadd';
import GeneralTemplateEdit from './pages/templates/generaltemplates/generaltemplateedit';
import InvoiceTemplates from './pages/templates/invoicetemplates';
import InvoiceTemplateAdd from './pages/templates/invoicetemplates/invoicetemplateadd';
import InvoiceTemplateEdit from './pages/templates/invoicetemplates/invoicetemplateedit';
import ProductLabels from './pages/templates/productlabels';
import ProductLabelAdd from './pages/templates/productlabels/productlabeladd';
import ProductLabelEdit from './pages/templates/productlabels/productlabeledit';
// SuperAdmin
import SuperAdminDashboard from './pages/superadmin/dashboard';
import CompanyList from './pages/superadmin/companylist';
import CompanyForm from './pages/superadmin/companyform';
import UserManagement from './pages/superadmin/usermanagement';

// Reports Imports
import SalesReportsPage from './pages/reports/sales/salesreportspage';
import PurchasesReportsPage from './pages/reports/purchases/purchasesreportspage';
import DetailedSalesReport from './pages/reports/sales/detailedsalesreport';
import DetailedPaymentsReport from './pages/reports/sales/detailedpaymentsreport';
import DetailedPurchasesReport from './pages/reports/purchases/detailedpurchasesreport';
import DetailedSupplierPaymentsReport from './pages/reports/purchases/detailedsupplierpaymentsreport';
import ClientsReportsPage from './pages/reports/clients/clientsreportspage';
import ClientGeneralLedger from './pages/reports/clients/clientgeneralledger';
import SuppliersReportsPage from './pages/reports/suppliers/suppliersreportspage';
import SupplierGeneralLedger from './pages/reports/suppliers/suppliergeneralledger';
import InventoryReportsPage from './pages/reports/inventory/inventoryreportspage';
import InventoryValueReport from './pages/reports/inventory/inventoryvaluereport';
import InventoryValueDetailedReport from './pages/reports/inventory/inventoryvaluedetailedreport';
import AccountingReportsPage from './pages/reports/accounting/accountingreportspage';
import BalanceSheetReport from './pages/reports/accounting/balancesheetreport';
import GeneralLedgerReport from './pages/reports/accounting/generalledgerreport';
import IncomeStatementReport from './pages/reports/accounting/incomestatementreport';
import TrialBalanceReport from './pages/reports/accounting/trialbalancereport';
import SafeAccountStatementReport from './pages/reports/accounting/safeaccountstatementreport';
import JournalAnalyticAccountReport from './pages/reports/accounting/journalanalyticaccountreport';
import SummaryTaxReport from './pages/reports/accounting/summarytaxreport';
import DetailedTaxReport from './pages/reports/accounting/detailedtaxreport';
import TaxReturnReport from './pages/reports/accounting/taxreturnreport';
import ReportsMainPage from './pages/reports/reportsmainpage';

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
