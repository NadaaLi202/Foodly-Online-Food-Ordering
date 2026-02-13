import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './Pages/DashboardPage';
import PurchasesPage from './Pages/PurchasesPage';
import PurchaseInvoices from './Pages/Purchases/PurchaseInvoices';
import PurchaseCreditNotes from './Pages/Purchases/PurchaseCreditNotes';
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
import Contacts from './Pages/Users/Contacts';
import Roles from './Pages/Users/Roles';
import LandingPage from './Pages/LandingPage';
import Login from './Pages/login';
import Register from './Pages/Register';
import CompanyLogin from './Pages/CompanyLogin';
// SuperAdmin
import SuperAdminDashboard from './Pages/SuperAdmin/Dashboard';
import CompanyList from './Pages/SuperAdmin/CompanyList';
import CompanyForm from './Pages/SuperAdmin/CompanyForm';
import UserManagement from './Pages/SuperAdmin/UserManagement';

// Reports Imports
import SalesReportsPage from './Pages/Reports/Sales/SalesReportsPage';
import PurchasesReportsPage from './Pages/Reports/Purchases/PurchasesReportsPage';
import SummarySalesReport from './Pages/Reports/Sales/SummarySalesReport';
import DetailedSalesReport from './Pages/Reports/Sales/DetailedSalesReport';
import SummaryPaymentsReport from './Pages/Reports/Sales/SummaryPaymentsReport';
import DetailedPaymentsReport from './Pages/Reports/Sales/DetailedPaymentsReport';
import SummaryPurchasesReport from './Pages/Reports/Purchases/SummaryPurchasesReport';
import DetailedPurchasesReport from './Pages/Reports/Purchases/DetailedPurchasesReport';
import SummarySupplierPaymentsReport from './Pages/Reports/Purchases/SummarySupplierPaymentsReport';
import DetailedSupplierPaymentsReport from './Pages/Reports/Purchases/DetailedSupplierPaymentsReport';
import AccountingReportsPage from './Pages/Reports/Accounting/AccountingReportsPage';
import BalanceSheetReport from './Pages/Reports/Accounting/BalanceSheetReport';
import IncomeStatementReport from './Pages/Reports/Accounting/IncomeStatementReport';
import TrialBalanceReport from './Pages/Reports/Accounting/TrialBalanceReport';
import GeneralLedgerReport from './Pages/Reports/Accounting/GeneralLedgerReport';
import SummaryTaxReport from './Pages/Reports/Accounting/SummaryTaxReport';
import DetailedTaxReport from './Pages/Reports/Accounting/DetailedTaxReport';
import TaxReturnReport from './Pages/Reports/Accounting/TaxReturnReport';
import ClientsReportsPage from './Pages/Reports/Clients/ClientsReportsPage';
import ClientGeneralLedger from './Pages/Reports/Clients/ClientGeneralLedger';
import SuppliersReportsPage from './Pages/Reports/Suppliers/SuppliersReportsPage';
import DetailedSuppliersReport from './Pages/Reports/Suppliers/DetailedSuppliersReport';
import InventoryReportsPage from './Pages/Reports/Inventory/InventoryReportsPage';
import InventoryValueReport from './Pages/Reports/Inventory/InventoryValueReport';
import InventoryValueDetailedReport from './Pages/Reports/Inventory/InventoryValueDetailedReport';

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

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/company-login" element={<CompanyLogin />} />
          <Route path="/company/:slug/login" element={<CompanyLogin />} />

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
              <Route path="invoices" element={<Invoices />} />
              <Route path="returns" element={<Returns />} />
              <Route path="quotations" element={<Quotations />} />
              <Route path="customers" element={<Customers />} />
              <Route path="customers/:id" element={<Customers />} />
              <Route path="payments" element={<Payments />} />
            </Route>

            <Route path="inventory">
              <Route path="products" element={<Products />} />
              <Route path="categories" element={<Categories />} />
              <Route path="operations" element={<Operations />} />
              <Route path="permissions" element={<Permissions />} />
              <Route path="warehouses" element={<Warehouses />} />
              <Route path="inventories" element={<Inventories />} />
            </Route>

            <Route path="accounting">
              <Route path="journal-entries" element={<JournalEntries />} />
              <Route path="chart-of-accounts" element={<ChartOfAccounts />} />
              <Route path="cost-centers" element={<CostCenters />} />
            </Route>

            <Route path="reports">
              <Route index element={<PlaceholderPage title="Reports" />} />
              <Route path="sales">
                <Route index element={<SalesReportsPage />} />
                <Route path="summary" element={<SummarySalesReport />} />
                <Route path="detailed" element={<DetailedSalesReport />} />
                <Route path="payments-summary" element={<SummaryPaymentsReport />} />
                <Route path="payments-detailed" element={<DetailedPaymentsReport />} />
              </Route>
              <Route path="purchases">
                <Route index element={<PurchasesReportsPage />} />
                <Route path="summary" element={<SummaryPurchasesReport />} />
                <Route path="detailed" element={<DetailedPurchasesReport />} />
                <Route path="payments-summary" element={<SummarySupplierPaymentsReport />} />
                <Route path="payments-detailed" element={<DetailedSupplierPaymentsReport />} />
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
              <Route path="clients" element={<ReportsLayout title="Clients Reports" />}>
                <Route index element={<ClientsReportsPage />} />
                <Route path="general-ledger" element={<ClientGeneralLedger />} />
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
            </Route>
          </Route>

          <Route path="purchases">
            <Route index element={<PurchasesPage />} />
            <Route path="suppliers/:id" element={<Suppliers />} />
            <Route path="invoices" element={<PurchaseInvoices />} />
            <Route path="invoices/add" element={<PurchaseInvoices />} />
            <Route path="credit-notes" element={<PurchaseCreditNotes />} />
            <Route path="credit-notes/add" element={<PurchaseCreditNotes />} />
            <Route path="purchase-orders" element={<PurchaseOrders />} />
            <Route path="returns" element={<PurchaseReturns />} />
            <Route path="requests" element={<PurchaseRequests />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="payments" element={<SupplierPayments />} />
          </Route>

          <Route path="finance">
            <Route path="expenses" element={<Expenses />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="requisitions" element={<Requisitions />} />
            <Route path="safes" element={<Safes />} />
            <Route path="bank-accounts" element={<BankAccounts />} />
          </Route>

          <Route path="users">
            <Route index element={<Contacts />} />
            <Route path="roles" element={<Roles />} />
          </Route>

          <Route path="branches">
            <Route index element={<Branches />} />
            <Route path="partner-lists" element={<PartnerLists />} />
            <Route path="businesses" element={<Activities />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
