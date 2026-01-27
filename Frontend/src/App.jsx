import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import PurchasesPage from './pages/PurchasesPage';

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
          <Route path="sales" element={<PlaceholderPage title="Sales" />} />
          <Route path="inventory" element={<PlaceholderPage title="Inventory" />} />
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
