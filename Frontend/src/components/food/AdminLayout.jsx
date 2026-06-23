import { BarChart3, ClipboardList, Package, Users } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const AdminLayout = () => {
  const { t } = useTranslation();

  const links = [
    { to: '/admin/dashboard', label: t('admin.overview'), icon: BarChart3 },
    { to: '/admin/products', label: t('admin.products'), icon: Package },
    { to: '/admin/orders', label: t('admin.orders'), icon: ClipboardList },
    { to: '/admin/users', label: t('admin.users'), icon: Users },
  ];

  const linkClass = ({ isActive }) => (
    `inline-flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-bold transition ${
      isActive
        ? 'bg-orange-600 text-white shadow-sm'
        : 'text-stone-600 hover:bg-white hover:text-stone-950'
    }`
  );

  return (
    <section className="mx-auto grid min-h-[70vh] max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[230px_1fr] lg:px-8">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <nav
          aria-label={t('admin.navigation')}
          className="flex gap-2 overflow-x-auto border-b border-stone-200 pb-3 lg:grid lg:overflow-visible lg:border-b-0 lg:border-e lg:pe-4"
        >
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              <link.icon className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        <Outlet />
      </div>
    </section>
  );
};

export default AdminLayout;
