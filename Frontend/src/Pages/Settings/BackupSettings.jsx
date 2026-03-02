import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, RefreshCw, ShieldAlert, Plus, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const formatBytes = (bytes) => {
    if (!bytes || Number.isNaN(Number(bytes))) return "—";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
    const value = bytes / Math.pow(1024, i);
    return `${value.toFixed(i === 0 ? 0 : 2)} ${sizes[i]}`;
};

const parseFilenameFromHeader = (headerValue) => {
    if (!headerValue) return null;
    const match = /filename="([^"]+)"/.exec(headerValue);
    return match?.[1] || null;
};

const BackupSettings = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";
    const { user } = useAuth();
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [restoreModalOpen, setRestoreModalOpen] = useState(false);
    const [restoreTarget, setRestoreTarget] = useState(null);
    const [restoreConfirm, setRestoreConfirm] = useState(false);
    const [restoreWipe, setRestoreWipe] = useState(false);
    const [restoring, setRestoring] = useState(false);

    const isSuperAdmin = user?.role === "superAdmin" || user?.systemRole === "superAdmin";
    const isCompanyOwner = user?.role === "company" || user?.systemRole === "companyOwner";
    const canAccess = isSuperAdmin || isCompanyOwner;

    const fetchBackups = useCallback(async () => {
        if (!canAccess) return;
        setLoading(true);
        try {
            const response = await api.get("/backups");
            const list = response.data?.backups || [];
            const filtered = isSuperAdmin
                ? list
                : list.filter((b) => String(b.backupForCompanyId || "") === String(user?.companyId || ""));
            setBackups(filtered);
        } catch (error) {
            toast.error(t("sales.common.error_message") || "Failed to fetch backups");
        } finally {
            setLoading(false);
        }
    }, [canAccess, isSuperAdmin, t, user?.companyId]);

    useEffect(() => {
        fetchBackups();
    }, [fetchBackups]);

    const handleCreateBackup = async () => {
        setCreating(true);
        try {
            await api.post("/backups/system");
            toast.success(t("sales.common.success_message") || "Backup created");
            fetchBackups();
        } catch (error) {
            toast.error(t("sales.common.error_message") || "Failed to create backup");
        } finally {
            setCreating(false);
        }
    };

    const handleDownload = async (backupId) => {
        try {
            const response = await api.get(`/backups/download/${backupId}`, {
                responseType: "blob",
            });
            const filename =
                parseFilenameFromHeader(response.headers?.["content-disposition"]) ||
                `backup-${backupId}.jsonl`;
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error(t("sales.common.error_message") || "Failed to download backup");
        }
    };

    const openRestoreModal = (backup) => {
        setRestoreTarget(backup);
        setRestoreConfirm(false);
        setRestoreWipe(false);
        setRestoreModalOpen(true);
    };

    const handleRestore = async () => {
        if (!restoreTarget) return;
        if (!restoreConfirm) return;
        setRestoring(true);
        try {
            await api.post(
                `/backups/restore/${restoreTarget._id || restoreTarget.backupId}?confirm=true&wipe=${restoreWipe ? "true" : "false"}`
            );
            toast.success(t("sales.common.success_message") || "Restore completed");
            setRestoreModalOpen(false);
        } catch (error) {
            toast.error(t("sales.common.error_message") || "Restore failed");
        } finally {
            setRestoring(false);
        }
    };

    const rows = useMemo(() => backups || [], [backups]);

    if (!canAccess) {
        return (
            <div className="min-h-screen bg-[#f1f3f5] py-6 px-4 md:px-8" dir={isRTL ? "rtl" : "ltr"}>
                <div className="max-w-4xl mx-auto bg-white border border-red-100 rounded-xl p-6 text-red-600 font-bold text-sm">
                    {t("sales.common.unauthorized", "You are not authorized to access this page")}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f1f3f5] py-4 px-4 md:px-8" dir={isRTL ? "rtl" : "ltr"}>
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 mb-4">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="text-indigo-600" size={18} />
                        <span className="text-sm font-bold text-gray-900">
                            {t("backup_settings.title", "System Backups")}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={fetchBackups}
                            disabled={loading}
                            className="h-8 px-3 rounded border border-gray-200 bg-white text-gray-600 text-xs font-bold hover:bg-gray-50 disabled:opacity-50"
                            title={t("sales.common.refresh", "Refresh")}
                        >
                            <RefreshCw className={loading ? "animate-spin" : ""} size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={handleCreateBackup}
                            disabled={creating}
                            className="h-8 px-3 rounded bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Plus size={14} />
                            {creating ? t("sales.common.saving", "Saving...") : t("backup_settings.create", "Create Backup")}
                        </button>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 font-bold text-gray-700">{t("backup_settings.date", "Date")}</th>
                                    <th className="px-4 py-3 font-bold text-gray-700">{t("backup_settings.format", "Format")}</th>
                                    <th className="px-4 py-3 font-bold text-gray-700">{t("backup_settings.size", "File Size")}</th>
                                    <th className="px-4 py-3 font-bold text-gray-700">{t("backup_settings.storage", "Storage")}</th>
                                    <th className="px-4 py-3 font-bold text-gray-700">{t("backup_settings.status", "Status")}</th>
                                    <th className="px-4 py-3 font-bold text-gray-700 text-right">{t("sales.common.actions", "Actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-600">
                                {loading && rows.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-10 text-center text-gray-500">
                                            {t("sales.common.loading", "Loading...")}
                                        </td>
                                    </tr>
                                ) : rows.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-10 text-center text-gray-500">
                                            {t("backup_settings.empty", "No backups found")}
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((b) => (
                                        <tr key={b._id || b.backupId}>
                                            <td className="px-4 py-3 font-medium text-gray-900">
                                                {b.backupDate ? new Date(b.backupDate).toLocaleString() : "—"}
                                            </td>
                                            <td className="px-4 py-3">{(b.format || "jsonl").toUpperCase()}</td>
                                            <td className="px-4 py-3">{formatBytes(b.fileSizeBytes)}</td>
                                            <td className="px-4 py-3">
                                                {b.storage?.type || "local"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${b.status === "success" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                                                    {b.status || "unknown"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDownload(b._id || b.backupId)}
                                                        className="h-7 px-2 rounded border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-1"
                                                    >
                                                        <Download size={12} />
                                                        {t("backup_settings.download", "Download")}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openRestoreModal(b)}
                                                        className="h-7 px-2 rounded border border-red-200 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-1"
                                                    >
                                                        <RotateCcw size={12} />
                                                        {t("backup_settings.restore", "Restore")}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {restoreModalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {t("backup_settings.restore_title", "Restore Backup")}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            {t("backup_settings.restore_warning", "This action may overwrite existing data.")}
                        </p>
                        <label className="flex items-center gap-2 text-sm text-gray-700 mb-3">
                            <input
                                type="checkbox"
                                checked={restoreConfirm}
                                onChange={(e) => setRestoreConfirm(e.target.checked)}
                                className="h-4 w-4 text-indigo-600"
                            />
                            {t("backup_settings.restore_confirm", "I understand and want to proceed")}
                        </label>
                        <label className="flex items-center gap-2 text-sm text-red-600 mb-5">
                            <input
                                type="checkbox"
                                checked={restoreWipe}
                                onChange={(e) => setRestoreWipe(e.target.checked)}
                                className="h-4 w-4 text-red-600"
                            />
                            {t("backup_settings.restore_wipe", "Wipe existing data before restore")}
                        </label>
                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setRestoreModalOpen(false)}
                                className="h-8 px-4 rounded border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50"
                            >
                                {t("sales.common.cancel", "Cancel")}
                            </button>
                            <button
                                type="button"
                                onClick={handleRestore}
                                disabled={!restoreConfirm || restoring}
                                className="h-8 px-4 rounded bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50"
                            >
                                {restoring ? t("sales.common.saving", "Saving...") : t("backup_settings.restore_now", "Restore")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BackupSettings;
