const mongoose = require("mongoose");

const { Schema } = mongoose;


/* =========================================================
   BAZARIA — PRODUCT MODEL V3
   Scalable Product Schema
========================================================= */


/* =========================================================
   IMAGE SUB-SCHEMA
========================================================= */

const productImageSchema = new Schema(
    {
        url: {
            type: String,
            required: [true, "Image URL is required"],
            trim: true,
        },

        public_id: {
            type: String,
            required: [
                true,
                "Cloudinary public_id is required",
            ],
            trim: true,
        },
    },
    {
        _id: false,
    }
);


/* =========================================================
   PRODUCT SCHEMA
========================================================= */

const productSchema = new Schema(
    {

        /* -----------------------------------------------------
           CORE PRODUCT
        ----------------------------------------------------- */

        name: {
            type: String,

            required: [
                true,
                "Product name is required",
            ],

            trim: true,

            minlength: [
                2,
                "Product name must be at least 2 characters",
            ],

            maxlength: [
                100,
                "Product name cannot exceed 100 characters",
            ],
        },


        category: {
            type: String,

            required: [
                true,
                "Category is required",
            ],

            trim: true,

            maxlength: [
                80,
                "Category cannot exceed 80 characters",
            ],
        },


        subCategory: {
            type: String,

            required: [
                true,
                "Sub category is required",
            ],

            trim: true,

            maxlength: [
                80,
                "Sub category cannot exceed 80 characters",
            ],
        },


        brand: {
            type: String,

            trim: true,

            maxlength: [
                80,
                "Brand cannot exceed 80 characters",
            ],

            default: "",
        },


        /* -----------------------------------------------------
           CONDITION
        ----------------------------------------------------- */

        condition: {
            type: String,

            trim: true,

            lowercase: true,

            enum: {
                values: [
                    "new",
                    "used",
                    "refurbished",
                    "open_box",
                ],

                message:
                    "Invalid product condition",
            },

            default: "new",
        },


        conditionDetails: {
            type: String,

            trim: true,

            maxlength: [
                1000,
                "Condition details cannot exceed 1000 characters",
            ],

            default: "",
        },


        /* -----------------------------------------------------
           PRICING
        ----------------------------------------------------- */

        price: {
            type: Number,

            required: [
                true,
                "Product price is required",
            ],

            min: [
                0,
                "Product price cannot be negative",
            ],
        },


        originalPrice: {
            type: Number,

            min: [
                0,
                "Original price cannot be negative",
            ],

            default: null,
        },


        /* -----------------------------------------------------
           INVENTORY
        ----------------------------------------------------- */

        stock: {
            type: Number,

            min: [
                0,
                "Stock cannot be negative",
            ],

            validate: {
                validator: Number.isInteger,

                message:
                    "Stock must be a whole number",
            },

            default: 1,
        },


        /* -----------------------------------------------------
           DESCRIPTION
        ----------------------------------------------------- */

        description: {
            type: String,

            trim: true,

            maxlength: [
                1000,
                "Description cannot exceed 1000 characters",
            ],

            default: "",
        },


        /* -----------------------------------------------------
           LOCATION
        ----------------------------------------------------- */

        city: {
            type: String,

            trim: true,

            maxlength: [
                100,
                "City cannot exceed 100 characters",
            ],

            default: "",
        },


        area: {
            type: String,

            trim: true,

            maxlength: [
                150,
                "Area cannot exceed 150 characters",
            ],

            default: "",
        },


        /* -----------------------------------------------------
           DELIVERY
        ----------------------------------------------------- */

        deliveryAvailable: {
            type: String,

            enum: {
                values: [
                    "Yes",
                    "No",
                ],

                message:
                    "Delivery availability must be Yes or No",
            },

            default: "No",
        },


        deliveryCharges: {
            type: Number,

            min: [
                0,
                "Delivery charges cannot be negative",
            ],

            default: 0,
        },


        pickupAvailable: {
            type: String,

            enum: {
                values: [
                    "Yes",
                    "No",
                ],

                message:
                    "Pickup availability must be Yes or No",
            },

            default: "Yes",
        },


        /* -----------------------------------------------------
           DYNAMIC SPECIFICATIONS
           RAM / Storage / Color / Size / Material etc.
        ----------------------------------------------------- */

        specifications: {
            type: Map,

            of: {
                type: String,

                trim: true,

                maxlength: [
                    200,
                    "Specification value cannot exceed 200 characters",
                ],
            },

            default: {},
        },


        /* -----------------------------------------------------
           PRODUCT IMAGES
        ----------------------------------------------------- */

        images: {
            type: [productImageSchema],

            required: [
                true,
                "At least one product image is required",
            ],

            validate: {
                validator: function (images) {

                    return (
                        Array.isArray(images) &&
                        images.length >= 1 &&
                        images.length <= 10
                    );

                },

                message:
                    "Product must contain between 1 and 10 images",
            },
        },


        /* -----------------------------------------------------
           PRODUCT METRICS
        ----------------------------------------------------- */

        views: {
            type: Number,

            min: [
                0,
                "Views cannot be negative",
            ],

            default: 0,
        },


        likesCount: {
            type: Number,

            min: [
                0,
                "Likes cannot be negative",
            ],

            default: 0,
        },


        /* -----------------------------------------------------
           SELLER / OWNER
        ----------------------------------------------------- */

        seller: {
            type: Schema.Types.ObjectId,

            ref: "User",

            default: null,
        },


        /* -----------------------------------------------------
           PRODUCT STATUS
        ----------------------------------------------------- */

        status: {
            type: String,

            enum: {
                values: [
                    "draft",
                    "active",
                    "out_of_stock",
                    "hidden",
                    "archived",
                ],

                message:
                    "Invalid product status",
            },

            default: "active",
        },


        /* -----------------------------------------------------
           VISIBILITY
        ----------------------------------------------------- */

        visibility: {
            type: String,

            enum: {
                values: [
                    "public",
                    "private",
                ],

                message:
                    "Visibility must be public or private",
            },

            default: "public",
        },

    },


    /* =======================================================
       SCHEMA OPTIONS
    ======================================================= */

    {
        timestamps: true,

        strict: true,

        strictQuery: true,
    }
);


/* =========================================================
   DOCUMENT-LEVEL BUSINESS VALIDATION
========================================================= */

productSchema.pre(
    "validate",
    function () {

        /* -----------------------------------------------------
           ORIGINAL PRICE RULE
        ----------------------------------------------------- */

        if (
            this.originalPrice !== null &&
            this.originalPrice !== undefined &&
            this.originalPrice < this.price
        ) {

            throw new Error(
                "Original price cannot be lower than selling price"
            );

        }


        /* -----------------------------------------------------
           CONDITION DETAILS
        ----------------------------------------------------- */

        if (
            this.condition !== "new" &&
            !this.conditionDetails?.trim()
        ) {

            throw new Error(
                "Condition details are required for non-new products"
            );

        }


        /* -----------------------------------------------------
           DELIVERY CHARGES
        ----------------------------------------------------- */

        if (
            this.deliveryAvailable === "No"
        ) {

            this.deliveryCharges = 0;

        }

    }
);


/* =========================================================
   DATABASE INDEXES
========================================================= */


/*
 * PRIMARY PUBLIC PRODUCT LISTING
 *
 * Matches:
 *
 * status = active
 * visibility = public
 *
 * Sort:
 *
 * createdAt DESC
 * _id DESC
 *
 * This supports the cursor pagination strategy
 * used by productController.js.
 */

productSchema.index(
    {
        status: 1,
        visibility: 1,
        createdAt: -1,
        _id: -1,
    }
);


/*
 * CATEGORY BROWSING
 */

productSchema.index(
    {
        status: 1,
        visibility: 1,
        category: 1,
        subCategory: 1,
        createdAt: -1,
        _id: -1,
    }
);


/*
 * SELLER PRODUCTS
 */

productSchema.index(
    {
        seller: 1,
        createdAt: -1,
        _id: -1,
    }
);


/*
 * INVENTORY / STATUS OPERATIONS
 */

productSchema.index(
    {
        status: 1,
        stock: 1,
    }
);


/* =========================================================
   MODEL
========================================================= */

const Product =
    mongoose.model(
        "Product",
        productSchema
    );


module.exports = Product;