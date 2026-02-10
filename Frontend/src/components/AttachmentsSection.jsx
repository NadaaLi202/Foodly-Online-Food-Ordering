import React, { useState, useCallback } from 'react';
import { FilePlus, Trash2, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB - match backend
const MAX_ATTACHMENTS = 5; // match backend maxCount
const ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const isFileAllowed = (file) => {
    return ALLOWED_TYPES.some(t => file.type === t || file.type.startsWith('image/'));
};

const AttachmentsSection = ({
    uploadedFiles = [],
    onFilesChange,
    existingAttachments = [],
    onDeleteExisting,
    onDownloadExisting,
    documentId,
    disabled = false
}) => {
    const { t } = useTranslation();
    const [isDragging, setIsDragging] = useState(false);
    const [validationError, setValidationError] = useState('');

    const validateFile = (file) => {
        if (file.size > MAX_FILE_SIZE) {
            return t('sales.invoices.file_too_large', { max: '5MB' });
        }
        if (!isFileAllowed(file)) {
            return t('sales.invoices.file_type_not_allowed');
        }
        return null;
    };

    const addFiles = useCallback((files) => {
        const list = Array.from(files || []);
        const totalCount = uploadedFiles.length + existingAttachments.length + list.length;
        if (totalCount > MAX_ATTACHMENTS) {
            setValidationError(t('sales.invoices.max_attachments', { max: MAX_ATTACHMENTS }));
            toast.error(t('sales.invoices.max_attachments', { max: MAX_ATTACHMENTS }));
            return;
        }
        setValidationError('');
        const valid = [];
        for (const file of list) {
            const err = validateFile(file);
            if (err) {
                toast.error(err);
            } else {
                valid.push(file);
            }
        }
        if (valid.length) {
            onFilesChange([...uploadedFiles, ...valid]);
        }
    }, [uploadedFiles, existingAttachments.length, onFilesChange, t]);

    const handleFileInput = (e) => {
        addFiles(e.target.files);
        e.target.value = '';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;
        addFiles(e.dataTransfer?.files);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const removeNewFile = (index) => {
        onFilesChange(uploadedFiles.filter((_, i) => i !== index));
        setValidationError('');
    };

    return (
        <div className="space-y-4">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {t('sales.common.attachments')}
            </label>

            {/* Upload zone - matches screenshot: light grey bg, dashed border, document+plus icon, blue instruction text */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`relative flex flex-col items-center justify-center w-full min-h-[140px] rounded-lg border-2 border-dashed transition-all cursor-pointer
                    ${isDragging ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-200 bg-gray-50'}
                    ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-indigo-300 hover:bg-gray-50/80'}
                `}
            >
                <input
                    type="file"
                    multiple
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    onChange={handleFileInput}
                    disabled={disabled}
                    accept={ALLOWED_TYPES.join(',')}
                />
                <FilePlus size={32} className="text-gray-400 mb-2" />
                <span className="text-sm font-bold text-indigo-600 text-center px-4">
                    {t('sales.invoices.upload_attachments')}
                </span>
                {validationError && (
                    <p className="mt-2 text-xs text-red-500 font-bold">{validationError}</p>
                )}
            </div>

            {/* File lists */}
            <div className="space-y-2">
                {uploadedFiles.map((file, i) => (
                    <div
                        key={`new-${i}`}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100 group"
                    >
                        <span className="text-xs font-bold text-gray-600 truncate flex-1 min-w-0 mr-2">
                            {file.name}
                        </span>
                        <button
                            type="button"
                            onClick={() => removeNewFile(i)}
                            className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                            title={t('sales.common.delete')}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
                {existingAttachments.map((att, i) => (
                    <div
                        key={att.fileUrl || i}
                        className="flex items-center justify-between p-2 bg-indigo-50/50 rounded-lg border border-indigo-100 group"
                    >
                        <span className="text-xs font-bold text-gray-700 truncate flex-1 min-w-0 mr-2">
                            {att.fileName || 'Attachment'}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                            {att.fileUrl && (
                                <a
                                    href={att.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:text-indigo-700 p-1"
                                    title={t('sales.invoices.download')}
                                >
                                    <Download size={14} />
                                </a>
                            )}
                            {onDeleteExisting && documentId && (
                                <button
                                    type="button"
                                    onClick={() => onDeleteExisting(i)}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                    title={t('sales.common.delete')}
                                    disabled={disabled}
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AttachmentsSection;
