import { Menu, ShoppingBag, ShoppingCart, UserRound, X, LogOut, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import LanguageSwitcher from './LanguageSwitcher';

const AppLayout = () => {
  const { t } = useTranslation();
  const { user, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const links = [
    { to: '/', label: t('nav.home') },
    { to: '/menu', label: t('nav.menu') },
    ...(user ? [{ to: '/orders', label: t('nav.orders') }] : []),
    ...(isAdmin ? [{ to: '/admin/dashboard', label: t('nav.admin'), adminOnly: true }] : []),
  ];

  const handleLogout = () => {
    logout();
    toast.info(t('messages.loggedOut'));
    navigate('/');
  };

  const navClass = ({ isActive }) => (
    `inline-flex h-10 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-orange-100 text-orange-800' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-950'}`
  );

  const adminNavClass = ({ isActive }) => (
    `inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-bold ring-1 transition ${isActive ? 'bg-orange-600 text-white ring-orange-600' : 'bg-orange-50 text-orange-700 ring-orange-100 hover:bg-orange-100 hover:text-orange-800'}`
  );

  return (
    <div className="min-h-screen bg-stone-50 text-stone-950">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-3 text-xl font-black text-stone-950">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600 text-white">
              <ShoppingBag className="h-5 w-5" />
            </span>
            {t('app.name')}
          </Link>

          <nav className="mx-auto hidden items-center justify-center gap-3 md:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={link.adminOnly ? adminNavClass : navClass}
              >
                {link.adminOnly && <LayoutDashboard className="h-4 w-4" />}
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-3 md:flex">
            <LanguageSwitcher />
            <Link
              to="/cart"
              className="relative inline-flex h-10 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
            >
              <ShoppingCart className="h-4 w-4" />
              {t('nav.cart')}
              {itemCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-xs text-white">
                  {itemCount}
                </span>
              )}
            </Link>
            {user ? (
              <>
                <span className="hidden max-w-32 truncate text-sm font-semibold text-stone-600 lg:inline">{user.name}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-stone-950 px-3 text-sm font-semibold text-white transition hover:bg-stone-800"
                >
                  <LogOut className="h-4 w-4" />
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-stone-950 px-3 text-sm font-semibold text-white transition hover:bg-stone-800"
              >
                <UserRound className="h-4 w-4" />
                {t('nav.login')}
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="border-t border-stone-200 bg-white px-4 py-3 md:hidden">
            <div className="grid gap-2">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={link.adminOnly ? adminNavClass : navClass}
                  onClick={() => setOpen(false)}
                >
                  {link.adminOnly && <LayoutDashboard className="h-4 w-4" />}
                  {link.label}
                </NavLink>
              ))}
              <Link to="/cart" onClick={() => setOpen(false)} className="inline-flex h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-orange-50 hover:text-orange-700">
                <ShoppingCart className="h-4 w-4" />
                {t('nav.cart')} ({itemCount})
              </Link>
              <div className="flex items-center justify-between gap-3 pt-2">
                <LanguageSwitcher />
                {user ? (
                  <button type="button" onClick={handleLogout} className="inline-flex h-10 items-center gap-2 rounded-lg bg-stone-950 px-3 text-sm font-semibold text-white transition hover:bg-stone-800">
                    <LogOut className="h-4 w-4" />
                    {t('nav.logout')}
                  </button>
                ) : (
                  <Link to="/login" onClick={() => setOpen(false)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-stone-950 px-3 text-sm font-semibold text-white transition hover:bg-stone-800">
                    <UserRound className="h-4 w-4" />
                    {t('nav.login')}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-stone-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <span>{t('footer.rights')}</span>
          <span>{t('footer.mockPayment')}</span>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
