import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/authcontext";

const BYPASS_ROLES = new Set(["superAdmin", "company"]);
const BYPASS_SYSTEM_ROLES = new Set(["superAdmin"]);

export const usePermissions = () => {
    const { user } = useAuth();
    const [permissions, setPermissions] = useState([]);
    const [loadingPermissions, setLoadingPermissions] = useState(false);

    const hasBypass = useMemo(() => {
        const role = user?.role;
        const systemRole = user?.systemRole;
        return BYPASS_ROLES.has(role) || BYPASS_SYSTEM_ROLES.has(systemRole);
    }, [user?.role, user?.systemRole]);

    useEffect(() => {
        let mounted = true;

        const loadPermissions = async () => {
            if (!user) {
                if (mounted) setPermissions([]);
                return;
            }
            if (hasBypass) {
                if (mounted) setPermissions(["*"]);
                return;
            }

            const roleId = user?.roleId;
            if (!roleId) {
                if (mounted) setPermissions([]);
                return;
            }

            const cacheKey = `role_permissions_${roleId}_${user?.companyId || ""}`;
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed)) {
                        if (mounted) setPermissions(parsed);
                        return;
                    }
                } catch {
                    sessionStorage.removeItem(cacheKey);
                }
            }

            setLoadingPermissions(true);
            try {
                const res = await api.get(`/roles/${roleId}`);
                const perms = Array.isArray(res?.data?.role?.permissions) ? res.data.role.permissions : [];
                if (mounted) setPermissions(perms);
                sessionStorage.setItem(cacheKey, JSON.stringify(perms));
            } catch (error) {
                if (mounted) setPermissions([]);
            } finally {
                if (mounted) setLoadingPermissions(false);
            }
        };

        loadPermissions();
        return () => {
            mounted = false;
        };
    }, [user?._id, user?.roleId, user?.companyId, hasBypass]);

    const permissionsSet = useMemo(() => new Set(permissions), [permissions]);

    const hasPermission = useCallback(
        (moduleName, action) => {
            if (hasBypass) return true;
            if (!moduleName || !action) return false;
            return permissionsSet.has(`${moduleName}:${action}`);
        },
        [hasBypass, permissionsSet]
    );

    return {
        permissions,
        loadingPermissions,
        hasPermission
    };
};
