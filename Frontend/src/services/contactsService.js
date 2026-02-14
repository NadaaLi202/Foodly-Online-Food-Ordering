import api from "./api";

const SUPPLIERS_PATH = "/contacts/suppliers";
const CONTACTS_PATH = "/contacts";

/**
 * Build the API payload for create/update supplier from form state.
 * Keeps backend contract in one place (address shape, optional fields).
 * @param {Object} formData - Form state from the modal
 * @param {Object} options - { omitCodeForCreate: boolean } - when true, code is omitted so backend auto-generates (avoids duplicate code on create)
 */
export function buildSupplierPayload(formData, options = {}) {
    const { omitCodeForCreate = false } = options;
    const address = {
        address1: (formData.address1 || "").trim() || undefined,
        address2: (formData.address2 || "").trim() || undefined,
        neighborhood: (formData.district || "").trim() || undefined,
        city: (formData.city || "").trim() || undefined,
        province: (formData.state || "").trim() || undefined,
        zipCode: (formData.postalCode || "").trim() || undefined,
        country: (formData.country || "").trim() || undefined,
    };
    const additionalContacts = (formData.additionalContacts || [])
        .map((ac) => ({
            name: (ac.name || "").trim() || undefined,
            phone: (ac.phone || "").trim() || undefined,
            email: (ac.email || "").trim() || undefined,
            title: (ac.title || "").trim() || undefined,
        }))
        .filter((ac) => ac.name);

    const payload = {
        name: (formData.name || "").trim(),
        type: formData.type === "commercial" ? "commercial" : "individual",
        taxNumber: (formData.taxNumber || "").trim() || undefined,
        commercialRegister: (formData.commercialRegister || "").trim() || undefined,
        phone: (formData.phone || "").trim() || undefined,
        mobile: (formData.mobile || "").trim() || undefined,
        email: (formData.email || "").trim() || undefined,
        notes: (formData.notes || "").trim() || undefined,
        initialBalance: Number(formData.initialBalance) || 0,
        address,
        additionalContacts,
    };

    // Remove tax/commercial fields completely for individual type
    if (payload.type === 'individual') {
        delete payload.taxNumber;
        delete payload.commercialRegister;
    } else {
        // For commercial, remove if empty (though validation should catch this)
        if (!payload.taxNumber) delete payload.taxNumber;
        if (!payload.commercialRegister) delete payload.commercialRegister;
    }
    if (!omitCodeForCreate) {
        payload.code = (formData.code || "").trim() || undefined;
    }
    return payload;
}

/**
 * Client-side validation for supplier form.
 * Returns { valid: boolean, error: string }.
 */
export function validateSupplierForm(formData, t, options = {}) {
    const { isEdit = false } = options;
    const name = (formData.name || "").trim();
    if (!name) {
        return { valid: false, error: t("purchases.suppliers.name_required", "Name is required.") };
    }
    if (formData.type === "commercial") {
        const taxNumber = (formData.taxNumber || "").trim();
        const commercialRegister = (formData.commercialRegister || "").trim();
        if (!taxNumber) {
            return { valid: false, error: t("sales.suppliers.tax_number_required", "Tax number is required for commercial suppliers.") };
        }
        if (!commercialRegister) {
            return { valid: false, error: t("sales.suppliers.commercial_register_required", "Commercial register is required for commercial suppliers.") };
        }
    }
    return { valid: true, error: null };
}

/**
 * Create a new supplier.
 * @param {Object} payload - From buildSupplierPayload(formData)
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export async function createSupplier(payload) {
    try {
        const response = await api.post(SUPPLIERS_PATH, payload);
        const data = response.data;
        const contact = data?.contact ?? data;
        if (response.status === 200 || response.status === 201) {
            return { success: true, data: contact };
        }
        return { success: false, error: data?.message || "Failed to create supplier." };
    } catch (err) {
        const message = err.response?.data?.message || err.message || "Failed to create supplier.";
        return { success: false, error: message };
    }
}

/**
 * Update an existing supplier.
 * @param {string} id - Contact/supplier _id
 * @param {Object} payload - From buildSupplierPayload(formData)
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export async function updateSupplier(id, payload) {
    if (!id) {
        return { success: false, error: "Supplier ID is required." };
    }
    try {
        const response = await api.patch(`${CONTACTS_PATH}/${id}`, payload);
        const data = response.data;
        const contact = data?.contact ?? data;
        if (response.status === 200) {
            return { success: true, data: contact };
        }
        return { success: false, error: data?.message || "Failed to update supplier." };
    } catch (err) {
        const message = err.response?.data?.message || err.message || "Failed to update supplier.";
        return { success: false, error: message };
    }
}

/**
 * Fetch all suppliers (for dropdowns/lists).
 * @returns {Promise<Array>}
 */
export async function getSuppliers() {
    try {
        const response = await api.get(SUPPLIERS_PATH);
        const list = response.data?.contacts ?? response.data?.data ?? response.data ?? [];
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
}

export default {
    buildSupplierPayload,
    validateSupplierForm,
    createSupplier,
    updateSupplier,
    getSuppliers,
};
