import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    // الاسم - إلزامي
    name: {
        type: String,
        required: [true, 'اسم المنتج مطلوب'],
        trim: true,
        minLength: [2, 'اسم المنتج يجب أن يكون على الأقل حرفين'],
        maxLength: [200, 'اسم المنتج يجب ألا يتجاوز 200 حرف']
    },

    // الكود - اختياري وفريد
    code: {
        type: String,
        trim: true,
        unique: true,
        sparse: true, // يسمح بعدة قيم null
        uppercase: true
    },

    // التصنيف - اختياري
    category: {
        type: String,
        trim: true,
        default: ''
    },

    // النوع - منتج بمخزون أو خدمة
    type: {
        type: String,
        enum: {
            values: ['tracked', 'service'],
            message: 'النوع يجب أن يكون منتج بمخزون أو خدمة'
        },
        default: 'tracked'
    },

    // سعر الشراء - إلزامي
    purchasePrice: {
        type: Number,
        required: [true, 'سعر الشراء مطلوب'],
        min: [0, 'سعر الشراء لا يمكن أن يكون سالباً']
    },

    // سعر البيع - إلزامي
    sellingPrice: {
        type: Number,
        required: [true, 'سعر البيع مطلوب'],
        min: [0, 'سعر البيع لا يمكن أن يكون سالباً']
    },

    // هامش الربح - يتم حسابه تلقائياً
    profitMargin: {
        type: Number,
        default: 0,
        get: function () {
            if (this.purchasePrice > 0 && this.sellingPrice > 0) {
                return ((this.sellingPrice - this.purchasePrice) / this.purchasePrice * 100);
            }
            return 0;
        }
    },

    // الوصف - اختياري
    description: {
        type: String,
        trim: true,
        default: '',
        maxLength: [1000, 'الوصف يجب ألا يتجاوز 1000 حرف']
    },

    // كمية المخزون - للمنتجات المُتتبعة فقط
    stockQuantity: {
        type: Number,
        default: 0,
        min: [0, 'الكمية لا يمكن أن تكون سالبة']
    },

    // حد التنبيه للمخزون المنخفض
    lowStockThreshold: {
        type: Number,
        default: 0,
        min: [0, 'حد التنبيه لا يمكن أن يكون سالباً']
    },

    // الباركود - اختياري
    barcode: {
        type: String,
        trim: true,
        default: ''
    },

    // خاضع للضريبة
    taxable: {
        type: Boolean,
        default: true
    },

    // نسبة الضريبة
    taxRate: {
        type: Number,
        default: 14,
        min: [0, 'نسبة الضريبة لا يمكن أن تكون سالبة'],
        max: [100, 'نسبة الضريبة لا يمكن أن تتجاوز 100%']
    },

    // المستودع
    warehouse: {
        type: String,
        enum: {
            values: ['main', 'secondary'],
            message: 'المستودع غير صحيح'
        },
        default: 'main'
    },

    // اسم الوحدة
    unitName: {
        type: String,
        trim: true,
        default: ''
    },

    // وحدات متعددة
    multipleUnits: {
        type: Boolean,
        default: false
    },

    // صورة المنتج
    image: {
        type: String,
        default: ''
    },

    // حالة المنتج
    isActive: {
        type: Boolean,
        default: true
    },

    // معلومات الإنشاء والتعديل
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true }
});

// Indexes للبحث السريع
productSchema.index({ name: 1 });

productSchema.index({ category: 1 });
productSchema.index({ type: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ barcode: 1 });

// Virtual للتحقق من انخفاض المخزون
productSchema.virtual('isLowStock').get(function () {
    return this.type === 'tracked' && this.stockQuantity <= this.lowStockThreshold;
});

// Virtual لحساب القيمة الإجمالية للمخزون
productSchema.virtual('totalStockValue').get(function () {
    return this.stockQuantity * this.sellingPrice;
});

// Pre-save middleware لحساب هامش الربح تلقائياً
productSchema.pre('save', function (next) {
    if (this.purchasePrice > 0 && this.sellingPrice > 0) {
        this.profitMargin = ((this.sellingPrice - this.purchasePrice) / this.purchasePrice * 100);
    } else {
        this.profitMargin = 0;
    }

    // تحويل الكود إلى uppercase
    if (this.code) {
        this.code = this.code.toUpperCase();
    }

    next();
});

// Method للبحث عن المنتجات
productSchema.statics.searchProducts = function (searchTerm) {
    return this.find({
        $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { code: { $regex: searchTerm, $options: 'i' } },
            { category: { $regex: searchTerm, $options: 'i' } },
            { barcode: { $regex: searchTerm, $options: 'i' } }
        ],
        isActive: true
    }).sort({ createdAt: -1 });
};

// Method لتحديث المخزون
productSchema.methods.updateStock = function (quantity, operation = 'add') {
    if (this.type !== 'tracked') {
        throw new Error('لا يمكن تحديث مخزون الخدمات');
    }

    if (operation === 'add') {
        this.stockQuantity += quantity;
    } else if (operation === 'subtract') {
        this.stockQuantity = Math.max(0, this.stockQuantity - quantity);
    }
    return this.save();
};

// Method للتحقق من توفر الكمية
productSchema.methods.checkAvailability = function (requiredQuantity) {
    if (this.type !== 'tracked') {
        return true; // الخدمات دائماً متوفرة
    }
    return this.stockQuantity >= requiredQuantity;
};

// Method لحساب السعر مع الضريبة
productSchema.methods.getPriceWithTax = function () {
    if (this.taxable) {
        return this.sellingPrice * (1 + this.taxRate / 100);
    }
    return this.sellingPrice;
};

export const productModel = mongoose.model('Product', productSchema);