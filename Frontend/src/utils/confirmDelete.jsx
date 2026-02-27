import React from "react";
import { createRoot } from "react-dom/client";
import { X, AlertTriangle } from "lucide-react";
import i18n from "../i18n";

const ConfirmDeleteDialog = ({ title, message, confirmText, cancelText, onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/35" onClick={onClose} aria-hidden="true" />
            <div className="relative w-full max-w-[410px] overflow-hidden rounded-lg bg-white shadow-2xl">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute left-4 top-4 text-gray-400 transition-colors hover:text-gray-600"
                    aria-label="Close"
                >
                    <X size={18} />
                </button>

                <div className="flex items-center justify-end gap-3 border-b border-gray-100 px-5 py-4">
                    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-500">
                        <AlertTriangle size={18} />
                    </div>
                </div>

                <div className="px-5 py-5 text-sm text-gray-700">{message}</div>

                <div className="flex items-center gap-2 border-t border-gray-100 px-3 py-3">
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="rounded-md bg-red-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700"
                    >
                        {confirmText}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border border-gray-300 bg-white px-5 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const confirmDelete = ({
    title = i18n.t("sales.common.confirm_delete"),
    message = i18n.t("sales.common.confirm_delete"),
    confirmText = i18n.t("sales.common.confirm"),
    cancelText = i18n.t("sales.common.cancel")
} = {}) => {
    return new Promise((resolve) => {
        const container = document.createElement("div");
        document.body.appendChild(container);
        const root = createRoot(container);

        const cleanup = () => {
            root.unmount();
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
        };

        const handleClose = () => {
            cleanup();
            resolve(false);
        };

        const handleConfirm = () => {
            cleanup();
            resolve(true);
        };

        root.render(
            <ConfirmDeleteDialog
                title={title}
                message={message}
                confirmText={confirmText}
                cancelText={cancelText}
                onClose={handleClose}
                onConfirm={handleConfirm}
            />
        );
    });
};
