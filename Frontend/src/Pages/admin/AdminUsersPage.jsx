import { RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import EmptyState from '../../components/food/EmptyState';
import LoadingState from '../../components/food/LoadingState';
import { useAuth } from '../../contexts/AuthContext';
import { getErrorMessage } from '../../services/api';
import { userService } from '../../services/userService';
import { formatDate } from '../../utils/format';

const AdminUsersPage = () => {
  const { t, i18n } = useTranslation();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingUserId, setPendingUserId] = useState('');

  const isCurrentUser = (user) => String(user._id) === String(currentUser?._id);

  const loadUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await userService.list();
      setUsers(data.users || []);
    } catch (err) {
      setError(getErrorMessage(err, t('messages.usersLoadFailed')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const changeRole = async (user, role) => {
    if (isCurrentUser(user) || user.role === role) {
      return;
    }

    setPendingUserId(user._id);

    try {
      const { data } = await userService.updateRole(user._id, role);
      setUsers((currentUsers) => currentUsers.map((item) => (
        item._id === user._id ? { ...item, role: data.user?.role || role } : item
      )));
      toast.success(t('messages.userUpdated'));
    } catch (err) {
      toast.error(getErrorMessage(err, t('messages.userUpdateFailed')));
    } finally {
      setPendingUserId('');
    }
  };

  const deleteUser = async (user) => {
    if (isCurrentUser(user) || !window.confirm(t('messages.confirmDelete'))) {
      return;
    }

    setPendingUserId(user._id);

    try {
      await userService.remove(user._id);
      setUsers((currentUsers) => currentUsers.filter((item) => item._id !== user._id));
      toast.success(t('messages.userDeleted'));
    } catch (err) {
      toast.error(getErrorMessage(err, t('messages.userDeleteFailed')));
    } finally {
      setPendingUserId('');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-stone-950 sm:text-4xl">{t('admin.users')}</h1>
        <p className="mt-2 text-stone-500">{t('admin.usersText')}</p>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-800">
          <p className="font-bold">{t('states.error')}</p>
          <p className="mt-1 text-sm">{error}</p>
          <button
            type="button"
            onClick={loadUsers}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-red-700 px-4 text-sm font-bold text-white hover:bg-red-800"
          >
            <RefreshCw className="h-4 w-4" />
            {t('actions.retry')}
          </button>
        </div>
      ) : !users.length ? (
        <EmptyState title={t('admin.noUsers')} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white shadow-sm">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-stone-500">
              <tr>
                <th className="px-4 py-3 text-start font-bold">{t('forms.name')}</th>
                <th className="px-4 py-3 text-start font-bold">{t('forms.email')}</th>
                <th className="px-4 py-3 text-start font-bold">{t('forms.role')}</th>
                <th className="px-4 py-3 text-start font-bold">{t('orders.date')}</th>
                <th className="px-4 py-3 text-start font-bold">{t('actions.manage')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((user) => {
                const self = isCurrentUser(user);

                return (
                  <tr key={user._id} className="align-middle">
                    <td className="px-4 py-3">
                      <p className="font-bold text-stone-950">{user.name}</p>
                      {self && <p className="mt-1 text-xs font-semibold text-orange-700">{t('admin.selfAccount')}</p>}
                    </td>
                    <td className="px-4 py-3 text-stone-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        disabled={self || pendingUserId === user._id}
                        onChange={(event) => changeRole(user, event.target.value)}
                        className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm font-semibold outline-none focus:border-orange-500 disabled:cursor-not-allowed disabled:bg-stone-100"
                        title={self ? t('admin.selfAccount') : t('forms.role')}
                      >
                        <option value="customer">{t('roles.customer')}</option>
                        <option value="admin">{t('roles.admin')}</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-stone-600">{formatDate(user.createdAt, i18n.language)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={self || pendingUserId === user._id}
                        onClick={() => deleteUser(user)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        title={self ? t('admin.selfAccount') : t('actions.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
