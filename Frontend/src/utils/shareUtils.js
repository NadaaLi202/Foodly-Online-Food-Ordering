import toast from 'react-hot-toast';

/**
 * Robust share/copy utility that works on HTTP and HTTPS.
 * Priority:
 * 1. navigator.share (Mobile/HTTPS)
 * 2. navigator.clipboard.writeText (HTTPS)
 * 3. document.execCommand('copy') (HTTP Fallback)
 * 
 * @param {Object} options
 * @param {string} options.title - Share title
 * @param {string} options.text - Share text
 * @param {string} options.url - URL to share/copy
 * @param {File[]} [options.files] - Optional files to share (only works with navigator.share)
 * @param {string} [options.successMsg] - Custom success message
 * @param {string} [options.errorMsg] - Custom error message
 * @param {Function} [options.t] - i18next translation function
 */
export const handleUniversalShare = async ({
    title,
    text,
    url,
    files,
    successMsg,
    errorMsg,
    t
}) => {
    const sMsg = successMsg || (t ? t('sales.invoices.link_copied') : 'تم نسخ الرابط بنجاح');
    const eMsg = errorMsg || 'تعذر نسخ الرابط';
    const shareUrl = url || window.location.href;

    // 1. Web Share API (Priority 1)
    if (navigator.share) {
        try {
            const shareData = { title, text, url: shareUrl };
            if (files && files.length > 0 && navigator.canShare && navigator.canShare({ files })) {
                shareData.files = files;
            }
            await navigator.share(shareData);
            // toast.success(t ? t('sales.invoices.share') + ' — OK' : 'تمت المشاركة بنجاح');
            return true;
        } catch (err) {
            if (err.name === 'AbortError') return false;
            console.error('navigator.share failed:', err);
            // Fall through to clipboard
        }
    }

    // 2. Clipboard API (Priority 2 - HTTPS)
    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success(sMsg);
            return true;
        } catch (err) {
            console.error('navigator.clipboard failed:', err);
            // Fall through to legacy fallback
        }
    }

    // 3. Legacy Fallback (Priority 3 - HTTP)
    try {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
            toast.success(sMsg);
            return true;
        }
    } catch (err) {
        console.error('Legacy copy fallback failed:', err);
    }

    toast.error(eMsg);
    return false;
};
