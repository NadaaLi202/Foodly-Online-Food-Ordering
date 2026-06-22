import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import EmptyState from '../../components/food/EmptyState';
import LoadingState from '../../components/food/LoadingState';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';

const AdminUsersPage = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = () => {
    setLoading(true);
    userService.list()
      .then(({ data }) => setUsers(data.users))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const changeRole = async (user, role) => {
    await userService.updateRole(user._id, role);
    toast.success(t('messages.userUpdated'));
    loadUsers();
  };

  const deleteUser = async (user) => {
    if (!window.confirm(t('messages.confirmDelete'))) {
      return;
    }

    await userService.remove(user._id);
    toast.success(t('messages.userDeleted'));
    loadUsers();
  };

  return (
    <section className="mx-auto min-h-[70vh] max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-stone-950">{t('admin.users')}</h1>
        <p className="mt-2 text-stone-500">{t('admin.usersText')}</p>
      </div>

      {loading ? (
        <LoadingState />
      ) : !users.length ? (
        <EmptyState title={t('admin.noUsers')} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
          <div className="grid min-w-[720px] grid-cols-[1.2fr_1.5fr_180px_100px] border-b border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold text-stone-500">
            <span>{t('forms.name')}</span>
            <span>{t('forms.email')}</span>
            <span>{t('forms.role')}</span>
            <span>{t('actions.manage')}</span>
          </div>
          <div className="overflow-x-auto">
            {users.map((user) => (
              <div key={user._id} className="grid min-w-[720px] grid-cols-[1.2fr_1.5fr_180px_100px] items-center border-b border-stone-100 px-4 py-3 last:border-0">
                <span className="font-bold text-stone-950">{user.name}</span>
                <span className="text-sm text-stone-600">{user.email}</span>
                <select
                  value={user.role}
                  disabled={user._id === currentUser?._id}
                  onChange={(event) => changeRole(user, event.target.value)}
                  className="h-10 rounded-lg border border-stone-200 px-3 text-sm font-semibold outline-none focus:border-orange-500 disabled:bg-stone-100"
                >
                  <option value="customer">{t('roles.customer')}</option>
                  <option value="admin">{t('roles.admin')}</option>
                </select>
                <button
                  type="button"
                  disabled={user._id === currentUser?._id}
                  onClick={() => deleteUser(user)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  title={t('actions.delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminUsersPage;
