/**
 * Utility functions for contact management
 */

/**
 * Prepares the payload for creating or updating a contact.
 * Ensures consistent data structure across different forms (Contacts page, Invoice modal).
 * Handles type-specific logic (individual vs commercial).
 * 
 * @param {Object} formData - The form data object
 * @returns {Object} Cleaned payload object ready for API submission
 */
export const prepareContactPayload = (formData) => {
    // Create a shallow copy to avoid mutating original state
    const payload = { ...formData };

    // Ensure type is set (default to individual if missing)
    if (!payload.type) {
        payload.type = 'individual';
    }

    // Handle individual type specific logic
    if (payload.type === 'individual') {
        // Individual contacts should not have tax/commercial numbers
        // We delete them to ensure they are not sent to backend
        // This prevents unique index violations on null values
        delete payload.taxNumber;
        delete payload.commercialRegister;
    } else {
        // Commercial type: Ensure strings are trimmed
        if (typeof payload.taxNumber === 'string') {
            payload.taxNumber = payload.taxNumber.trim();
            // If empty string, remove it (let backend validation handle required check if needed, 
            // or if optional in some contexts, backend handles it)
            if (!payload.taxNumber) delete payload.taxNumber;
        }

        if (typeof payload.commercialRegister === 'string') {
            payload.commercialRegister = payload.commercialRegister.trim();
            if (!payload.commercialRegister) delete payload.commercialRegister;
        }
    }

    // Clean up code field
    if (typeof payload.code === 'string') {
        payload.code = payload.code.trim();
        if (!payload.code) delete payload.code;
    } else if (!payload.code) {
        // If null/undefined/false, delete it
        delete payload.code;
    }

    return payload;
};
