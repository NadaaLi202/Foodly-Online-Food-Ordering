import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, RefreshCw, ShieldAlert, Plus, RotateCcw, Upload, X, AlertTriangle } from "lucide-react";
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
    const { user, companyId } = useAuth();
    const fileInputRef = useRef(null);

    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    // --- Restore from existing backup state ---
    const [restoreModalOpen, setRestoreModalOpen] = useState(false);
    const [restoreTarget, setRestoreTarget] = useState(null);
    const [restoreConfirm, setRestoreConfirm] = useState(false);
    const [restoreWipe, setRestoreWipe] = useState(false);
    const [restoring, setRestoring] = useState(false);

    // --- Upload & restore state ---
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadConfirm, setUploadConfirm] = useState(false);
    const [uploadWipe, setUploadWipe] = useState(false);
    const [uploading, setUploading] = useState(false);

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
                : list.filter((b) => String(b.backupForCompanyId || "") === String(companyId || ""));
            setBackups(filtered);
        } catch (error) {
            toast.error(t("sales.common.error_message") || "Failed to fetch backups");
        } finally {
            setLoading(false);
        }
    }, [canAccess, isSuperAdmin, t, companyId]);

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
        if (!restoreTarget || !restoreConfirm) return;
        setRestoring(true);
        try {
            const response = await api.post(
                `/backups/restore/${restoreTarget._id || restoreTarget.backupId}?confirm=true&wipe=${restoreWipe ? "true" : "false"}${companyId ? `&companyId=${companyId}` : ""}`
            );
            toast.success(t("sales.common.success_message") || "Restore completed");
            setRestoreModalOpen(false);
            fetchBackups();
        } catch (error) {
            toast.error(t("sales.common.error_message") || "Restore failed");
        } finally {
            setRestoring(false);
        }
    };

    // --- Upload handlers ---
    const openUploadModal = () => {
        setUploadFile(null);
        setUploadConfirm(false);
        setUploadWipe(false);
        setUploadModalOpen(true);
        setTimeout(() => fileInputRef.current?.click(), 100);
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const ext = file.name.split(".").pop().toLowerCase();
        if (ext !== "jsonl" && ext !== "json") {
            toast.error("يُقبل فقط ملفات النسخ الاحتياطية بصيغة JSONL");
            e.target.value = "";
            return;
        }
        setUploadFile(file);
        setUploadModalOpen(true);
    };

    const handleUploadRestore = async () => {
        if (!uploadFile || !uploadConfirm) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("backupFile", uploadFile);
            const response = await api.post(
                `/backups/restore-from-file?confirm=true&wipe=${uploadWipe ? "true" : "false"}${companyId ? `&companyId=${companyId}` : ""}`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            const { totalRestored, durationSeconds } = response.data;
            toast.success(`تمت الاستعادة بنجاح — ${totalRestored} سجل في ${durationSeconds}ث`);
            setUploadModalOpen(false);
            fetchBackups();
        } catch (error) {
            const msg = error?.response?.data?.message || "فشلت عملية الاستعادة من الملف";
            toast.error(msg);
        } finally {
            setUploading(false);
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
                {/* Header bar */}
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

                        {/* Upload file to restore */}
                        <button
                            type="button"
                            onClick={openUploadModal}
                            className="h-8 px-3 rounded border border-amber-300 bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100 flex items-center gap-1.5"
                            title="استعادة من ملف محلي"
                        >
                            <Upload size={14} />
                            استعادة من ملف
                        </button>

                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".jsonl,.json"
                            className="hidden"
                            onChange={handleFileChange}
                        />

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

                {/* Backups table */}
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
                                    <th className="px-4 py-3 font-bold text-gray-700">{t("backup_settings.availability", "File")}</th>
                                    <th className="px-4 py-3 font-bold text-gray-700 text-right">{t("sales.common.actions", "Actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-600">
                                {loading && rows.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-10 text-center text-gray-500">
                                            {t("sales.common.loading", "Loading...")}
                                        </td>
                                    </tr>
                                ) : rows.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-10 text-center text-gray-500">
                                            {t("backup_settings.empty", "No backups found")}
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((b) => {
                                        const available = b.fileExists !== false;
                                        const unavailableTitle = "الملف غير متوفر على هذا الجهاز — تم إنشاؤه على خادم آخر";
                                        return (
                                            <tr key={b._id || b.backupId} className={available ? "" : "opacity-75 bg-amber-50/40"}>
                                                <td className="px-4 py-3 font-medium text-gray-900">
                                                    {b.backupDate ? new Date(b.backupDate).toLocaleString() : "—"}
                                                </td>
                                                <td className="px-4 py-3">{(b.format || "jsonl").toUpperCase()}</td>
                                                <td className="px-4 py-3">{formatBytes(b.fileSizeBytes)}</td>
                                                <td className="px-4 py-3">{b.storage?.type || "local"}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${b.status === "success" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                                                        {b.status || "unknown"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {available ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                                            متاح
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700" title={unavailableTitle}>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                                                            غير متاح
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDownload(b._id || b.backupId)}
                                                            disabled={!available}
                                                            title={available ? t("backup_settings.download", "Download") : unavailableTitle}
                                                            className={`h-7 px-2 rounded border text-xs font-bold flex items-center gap-1 ${available
                                                                ? "border-gray-200 text-gray-600 hover:bg-gray-50"
                                                                : "border-gray-100 text-gray-300 cursor-not-allowed"
                                                                }`}
                                                        >
                                                            <Download size={12} />
                                                            {t("backup_settings.download", "Download")}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openRestoreModal(b)}
                                                            disabled={!available}
                                                            title={available ? t("backup_settings.restore", "Restore") : unavailableTitle}
                                                            className={`h-7 px-2 rounded border text-xs font-bold flex items-center gap-1 ${available
                                                                ? "border-red-200 text-red-600 hover:bg-red-50"
                                                                : "border-gray-100 text-gray-300 cursor-not-allowed"
                                                                }`}
                                                        >
                                                            <RotateCcw size={12} />
                                                            {t("backup_settings.restore", "Restore")}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* === Restore from existing backup modal === */}
            {restoreModalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-gray-900">
                                {t("backup_settings.restore_title", "Restore Backup")}
                            </h3>
                            <button onClick={() => setRestoreModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={18} />
                            </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            {t("backup_settings.restore_warning", "This action may overwrite existing data.")}
                        </p>

                        <label className="flex items-center gap-2 text-sm text-gray-700 mb-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={restoreConfirm}
                                onChange={(e) => setRestoreConfirm(e.target.checked)}
                                className="h-4 w-4 text-indigo-600"
                            />
                            {t("backup_settings.restore_confirm", "I understand and want to proceed")}
                        </label>

                        <label className="flex items-start gap-2 text-sm text-red-600 mb-5 cursor-pointer bg-red-50 border border-red-100 rounded-lg p-3">
                            <input
                                type="checkbox"
                                checked={restoreWipe}
                                onChange={(e) => setRestoreWipe(e.target.checked)}
                                className="h-4 w-4 text-red-600 mt-0.5 shrink-0"
                            />
                            <span>
                                <span className="font-bold block">حذف البيانات الحالية قبل الاستعادة</span>
                                <span className="text-xs text-red-400">سيتم حذف جميع بيانات الشركة أولاً ثم استعادة النسخة الاحتياطية</span>
                            </span>
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

            {/* === Upload & restore from file modal === */}
            {uploadModalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-gray-900">استعادة من ملف محلي</h3>
                            <button onClick={() => setUploadModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={18} />
                            </button>
                        </div>

                        <p className="text-sm text-gray-500 mb-4">
                            قم برفع ملف نسخة احتياطية بصيغة JSONL لاستعادة بيانات الشركة — حتى لو كانت الشركة محذوفة من النظام.
                        </p>

                        {/* File picker area */}
                        <div
                            className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center mb-4 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload size={28} className="mx-auto text-gray-300 mb-2" />
                            {uploadFile ? (
                                <div>
                                    <p className="text-sm font-bold text-indigo-600">{uploadFile.name}</p>
                                    <p className="text-xs text-gray-400">{formatBytes(uploadFile.size)}</p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">اضغط لاختيار ملف JSONL</p>
                                    <p className="text-xs text-gray-400 mt-1">يُقبل فقط ملفات .jsonl</p>
                                </div>
                            )}
                        </div>

                        {uploadFile && (
                            <>
                                <label className="flex items-center gap-2 text-sm text-gray-700 mb-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={uploadConfirm}
                                        onChange={(e) => setUploadConfirm(e.target.checked)}
                                        className="h-4 w-4 text-indigo-600"
                                    />
                                    أفهم أن هذه العملية ستُعيد كتابة البيانات وأرغب في المتابعة
                                </label>

                                <label className="flex items-start gap-2 text-sm text-red-600 mb-5 cursor-pointer bg-red-50 border border-red-100 rounded-lg p-3">
                                    <input
                                        type="checkbox"
                                        checked={uploadWipe}
                                        onChange={(e) => setUploadWipe(e.target.checked)}
                                        className="h-4 w-4 text-red-600 mt-0.5 shrink-0"
                                    />
                                    <span>
                                        <span className="font-bold block">حذف البيانات الحالية قبل الاستعادة</span>
                                        <span className="text-xs text-red-400">سيتم حذف جميع بيانات الشركة أولاً ثم استعادة بيانات الملف</span>
                                    </span>
                                </label>

                                {uploadWipe && (
                                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                                        <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-amber-700 font-medium">
                                            تحذير: سيتم حذف كافة بيانات الشركة بشكل نهائي قبل الاستعادة. لا يمكن التراجع عن هذا الإجراء.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setUploadModalOpen(false)}
                                className="h-8 px-4 rounded border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50"
                            >
                                إلغاء
                            </button>
                            <button
                                type="button"
                                onClick={handleUploadRestore}
                                disabled={!uploadFile || !uploadConfirm || uploading}
                                className="h-8 px-4 rounded bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 disabled:opacity-50 flex items-center gap-1.5"
                            >
                                <Upload size={14} />
                                {uploading ? "جارٍ الاستعادة..." : "استعادة من الملف"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BackupSettings;
