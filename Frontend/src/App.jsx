import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import PurchasesPage from './pages/PurchasesPage';
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
        <Route path="/" element={<Layout />}>
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
          <Route path="purchases" element={<PurchasesPage />} />
          <Route path="finance" element={<PlaceholderPage title="Finance" />} />
          <Route path="accounting" element={<PlaceholderPage title="Accounting" />} />
          <Route path="reports" element={<PlaceholderPage title="Reports" />} />
          <Route path="users" element={<PlaceholderPage title="Users" />} />
          <Route path="branches" element={<PlaceholderPage title="Branches" />} />
          <Route path="templates" element={<PlaceholderPage title="Templates" />} />
          <Route path="settings" element={<PlaceholderPage title="Settings" />} />
          <Route path="support" element={<PlaceholderPage title="Technical Support" />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
