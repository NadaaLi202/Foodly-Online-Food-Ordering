import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import PurchaseInvoices from './Pages/Purchases/PurchaseInvoices';
import PurchaseCreditNotes from './Pages/Purchases/PurchaseCreditNotes';
import PurchaseRequests from './Pages/Purchases/PurchaseRequests';
import Suppliers from './Pages/Purchases/Suppliers';
import SupplierPayments from './Pages/Purchases/SupplierPayments';
import Invoices from './Pages/Sales/Invoices';
import Returns from './Pages/Sales/returns';
import Quotations from './Pages/Sales/Quotations';
import Customers from './Pages/Sales/Customers';
import Payments from './Pages/Sales/Payments';
import Products from './Pages/Inventory/Products';
import Categories from './Pages/Inventory/Categories';
import Operations from './Pages/Inventory/Operations';
import Permissions from './Pages/Inventory/Permissions';
import Warehouses from './Pages/Inventory/Warehouses';
import Inventories from './Pages/Inventory/Inventories';
import Expenses from './Pages/Finance/Expenses';
import Transactions from './Pages/Finance/Transactions';
import Requisitions from './Pages/Finance/Requisitions';
import Safes from './Pages/Finance/Safes';
import BankAccounts from './Pages/Finance/BankAccounts';
import Contacts from './Pages/Users/Contacts';
import Roles from './Pages/Users/Roles';
import LandingPage from './Pages/LandingPage';
import Login from './Pages/login';
import Register from './Pages/Register';

const PlaceholderPage = ({ title }) => (
  <div className="p-8 text-center text-gray-500 bg-white rounded-lg shadow-sm border border-gray-100">
    <h2 className="text-xl font-bold mb-2">{title}</h2>
    <p>Page under construction.</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<DashboardPage />} />

          <Route path="sales">
            <Route path="invoices" element={<Invoices />} />
            <Route path="returns" element={<Returns />} />
            <Route path="quotations" element={<Quotations />} />
            <Route path="customers" element={<Customers />} />
            <Route path="payments" element={<Payments />} />
          </Route>


          {/* <Route path="inventory" element={<PlaceholderPage title="Inventory" />} /> */}
          <Route path="inventory">
            <Route path="products" element={<Products />} />
            <Route path="categories" element={<Categories />} />
            <Route path="operations" element={<Operations />} />
            <Route path="permissions" element={<Permissions />} />
            <Route path="warehouses" element={<Warehouses />} />
            <Route path="inventories" element={<Inventories />} />
          </Route>
          <Route path="purchases">
            <Route path="invoices" element={<PurchaseInvoices />} />
            <Route path="invoices/add" element={<PurchaseInvoices />} />
            <Route path="credit-notes" element={<PurchaseCreditNotes />} />
            <Route path="credit-notes/add" element={<PurchaseCreditNotes />} />
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
          <Route path="accounting" element={<PlaceholderPage title="Accounting" />} />
          <Route path="reports" element={<PlaceholderPage title="Reports" />} />
          <Route path="users">
            <Route index element={<Contacts />} />
            <Route path="roles" element={<Roles />} />
          </Route>

          <Route path="branches" element={<PlaceholderPage title="Branches" />} />
          <Route path="templates" element={<PlaceholderPage title="Templates" />} />
          <Route path="settings" element={<PlaceholderPage title="Settings" />} />
          <Route path="support" element={<PlaceholderPage title="Technical Support" />} />

        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
