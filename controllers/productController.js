const mongoose = require("mongoose");
const Product = require("../models/Product");


/* =========================================================
   BAZARIA — PRODUCT CONTROLLER V3
   Scalable / Lightweight / Pagination-Ready
========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const MAX_IMAGES = 10;


/*
 * Public listing fields only.
 *
 * IMPORTANT:
 * The Home/Product Card does NOT need the complete
 * Product document.
 */
const PUBLIC_LIST_FIELDS = [
    "name",
    "category",
    "subCategory",
    "brand",
    "condition",
    "price",
    "originalPrice",
    "stock",
    "images",
    "createdAt",
].join(" ");


/* =========================================================
   HELPERS
========================================================= */

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}


function cleanString(value) {
    if (value === undefined || value === null) {
        return undefined;
    }

    const result = String(value).trim();

    return result === "" ? undefined : result;
}


function cleanNumber(value) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return undefined;
    }

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : undefined;
}


function escapeRegex(value) {
    return String(value).replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
}


/* =========================================================
   CURSOR HELPERS
========================================================= */

/*
 * Cursor format:
 *
 * {
 *   createdAt: "2026-08-14T00:00:00.000Z",
 *   id: "ObjectId"
 * }
 *
 * The cursor is encoded so it can safely travel
 * through a URL.
 */

function encodeCursor(product) {
    if (!product || !product._id || !product.createdAt) {
        return null;
    }

    const payload = JSON.stringify({
        createdAt: new Date(product.createdAt).toISOString(),
        id: String(product._id),
    });

    return Buffer
        .from(payload, "utf8")
        .toString("base64url");
}


function decodeCursor(cursor) {
    if (!cursor) {
        return null;
    }

    try {
        const decoded =
            Buffer
                .from(String(cursor), "base64url")
                .toString("utf8");

        const parsed =
            JSON.parse(decoded);

        if (
            !parsed ||
            !parsed.createdAt ||
            !parsed.id
        ) {
            return null;
        }

        if (!isValidObjectId(parsed.id)) {
            return null;
        }

        const createdAt =
            new Date(parsed.createdAt);

        if (
            Number.isNaN(
                createdAt.getTime()
            )
        ) {
            return null;
        }

        return {
            createdAt,
            id: new mongoose.Types.ObjectId(parsed.id),
        };

    } catch (error) {
        return null;
    }
}


/* =========================================================
   CLOUDINARY FILE → PRODUCT IMAGE
========================================================= */

function buildUploadedImages(files = []) {

    if (!Array.isArray(files)) {
        return [];
    }

    return files.map((file) => ({
        url: file.path,
        public_id: file.filename,
    }));
}


/* =========================================================
   PRODUCT DATA BUILDER
========================================================= */

function buildProductData(body = {}) {

    const data = {};


    /* -----------------------------------------
       STRING FIELDS
    ----------------------------------------- */

    const stringFields = [
        "name",
        "category",
        "subCategory",
        "brand",
        "condition",
        "conditionDetails",
        "description",
        "city",
        "area",
        "deliveryAvailable",
        "pickupAvailable",
        "status",
    ];


    for (const field of stringFields) {

        const value =
            cleanString(body[field]);

        if (value !== undefined) {
            data[field] = value;
        }
    }


    /* -----------------------------------------
       NUMBER FIELDS
    ----------------------------------------- */

    const numberFields = [
        "price",
        "originalPrice",
        "stock",
        "deliveryCharges",
    ];


    for (const field of numberFields) {

        const value =
            cleanNumber(body[field]);

        if (value !== undefined) {
            data[field] = value;
        }
    }


    /* -----------------------------------------
       SELLER
       Temporary support.
       Auth system will replace this later.
    ----------------------------------------- */

    if (
        body.seller !== undefined &&
        body.seller !== null
    ) {

        const seller =
            cleanString(body.seller);

        if (seller) {
            data.seller = seller;
        }
    }


    /* -----------------------------------------
       SPECIFICATIONS
    ----------------------------------------- */

    if (
        body.specifications !== undefined
    ) {

        let specifications =
            body.specifications;


        if (
            typeof specifications === "string"
        ) {

            try {

                specifications =
                    JSON.parse(
                        specifications
                    );

            } catch (error) {

                throw new Error(
                    "Invalid specifications JSON"
                );

            }

        }


        if (
            !specifications ||
            typeof specifications !== "object" ||
            Array.isArray(specifications)
        ) {

            throw new Error(
                "Specifications must be an object"
            );

        }


        data.specifications =
            specifications;

    }


    return data;
}


/* =========================================================
   PUBLIC PRODUCT NORMALIZATION
========================================================= */

/*
 * Only keep the first image for listing pages.
 *
 * Full image set remains available from:
 * GET /api/products/:id
 */

function normalizePublicProduct(product) {

    if (!product) {
        return null;
    }

    const firstImage =
        Array.isArray(product.images) &&
        product.images.length > 0
            ? product.images[0]
            : null;


    return {
        _id: product._id,
        name: product.name,
        category: product.category,
        subCategory: product.subCategory,
        brand: product.brand,
        condition: product.condition,
        price: product.price,
        originalPrice: product.originalPrice,
        stock: product.stock,
        images: firstImage
            ? [firstImage]
            : [],
        createdAt: product.createdAt,
    };
}


/* =========================================================
   ERROR RESPONSE
========================================================= */

function sendControllerError(
    res,
    error,
    fallbackMessage
) {

    console.error(
        "Product Controller Error:",
        error
    );


    /* -----------------------------------------
       MONGOOSE VALIDATION
    ----------------------------------------- */

    if (
        error.name === "ValidationError"
    ) {

        const errors =
            Object.values(
                error.errors
            ).map(
                (item) => ({
                    field: item.path,
                    message: item.message,
                })
            );


        return res.status(400).json({

            success: false,

            message:
                "Product validation failed",

            errors,

        });

    }


    /* -----------------------------------------
       CAST ERROR
    ----------------------------------------- */

    if (
        error.name === "CastError"
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Invalid product ID",

        });

    }


    /* -----------------------------------------
       DUPLICATE KEY
    ----------------------------------------- */

    if (
        error.code === 11000
    ) {

        return res.status(409).json({

            success: false,

            message:
                "Duplicate product data",

        });

    }


    /* -----------------------------------------
       DEFAULT
    ----------------------------------------- */

    return res.status(500).json({

        success: false,

        message:
            fallbackMessage ||
            "Server error",

    });

}


/* =========================================================
   CREATE PRODUCT
========================================================= */

const createProduct =
    async (req, res) => {

    try {

        const files =
            Array.isArray(req.files)
                ? req.files
                : [];


        /* -----------------------------------------
           IMAGE REQUIREMENT
        ----------------------------------------- */

        if (files.length === 0) {

            return res.status(400).json({

                success: false,

                message:
                    "At least one product image is required",

            });

        }


        if (files.length > MAX_IMAGES) {

            return res.status(400).json({

                success: false,

                message:
                    `Maximum ${MAX_IMAGES} product images are allowed`,

            });

        }


        /* -----------------------------------------
           BUILD PRODUCT
        ----------------------------------------- */

        const productData =
            buildProductData(
                req.body
            );


        productData.images =
            buildUploadedImages(
                files
            );


        /* -----------------------------------------
           CREATE
        ----------------------------------------- */

        const product =
            await Product.create(
                productData
            );


        return res.status(201).json({

            success: true,

            message:
                "Product created successfully",

            product,

        });

    } catch (error) {

        return sendControllerError(
            res,
            error,
            "Unable to create product"
        );

    }

};


/* =========================================================
   GET ALL PUBLIC PRODUCTS
========================================================= */

const getAllProducts =
    async (req, res) => {

    try {

        const {
            search,
            category,
            subCategory,
            cursor,
            includeTotal,
        } = req.query;


        /* -----------------------------------------
           LIMIT
        ----------------------------------------- */

        let limit =
            Number.parseInt(
                req.query.limit,
                10
            );


        if (
            !Number.isFinite(limit) ||
            limit < 1
        ) {

            limit =
                DEFAULT_LIMIT;

        }


        limit =
            Math.min(
                limit,
                MAX_LIMIT
            );


        /* -----------------------------------------
           BASE PUBLIC FILTER
        ----------------------------------------- */

        const filter = {

            status: "active",

            visibility: "public",

        };


        /* -----------------------------------------
           CATEGORY
        ----------------------------------------- */

        if (category) {

            const value =
                cleanString(category);

            if (value) {

                filter.category =
                    value;

            }

        }


        /* -----------------------------------------
           SUBCATEGORY
        ----------------------------------------- */

        if (subCategory) {

            const value =
                cleanString(
                    subCategory
                );

            if (value) {

                filter.subCategory =
                    value;

            }

        }


        /* -----------------------------------------
           SEARCH
           -----------------------------------------
           This remains compatible with the
           current project.

           A dedicated search architecture can
           replace regex later when the catalog
           becomes genuinely large.
        ----------------------------------------- */

        if (search) {

            const searchValue =
                cleanString(search);


            if (searchValue) {

                const safeSearch =
                    escapeRegex(
                        searchValue
                    );


                const regex = {
                    $regex: safeSearch,
                    $options: "i",
                };


                filter.$and = [
                    {
                        $or: [
                            {
                                name: regex,
                            },
                            {
                                category: regex,
                            },
                            {
                                subCategory: regex,
                            },
                            {
                                brand: regex,
                            },
                        ],
                    },
                ];

            }

        }


        /* -----------------------------------------
           CURSOR PAGINATION
        ----------------------------------------- */

        let decodedCursor = null;


        if (cursor) {

            decodedCursor =
                decodeCursor(cursor);


            if (!decodedCursor) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid pagination cursor",

                });

            }


            /*
             * Stable newest-first pagination:
             *
             * createdAt DESC
             * _id DESC
             *
             * Next page:
             *
             * createdAt < current
             *
             * OR
             *
             * same createdAt + _id < current
             */

            filter.$and =
                filter.$and || [];


            filter.$and.push({

                $or: [

                    {
                        createdAt: {
                            $lt:
                                decodedCursor.createdAt,
                        },
                    },

                    {
                        createdAt:
                            decodedCursor.createdAt,

                        _id: {
                            $lt:
                                decodedCursor.id,
                        },
                    },

                ],

            });

        }


        /* -----------------------------------------
           DATABASE QUERY
        ----------------------------------------- */

        const query =
            Product.find(
                filter
            )
                .select(
                    PUBLIC_LIST_FIELDS
                )
                .sort({
                    createdAt: -1,
                    _id: -1,
                })
                .limit(
                    limit + 1
                )
                .lean();


        const rawProducts =
            await query;


        /*
         * Fetch one extra document.
         *
         * This lets us determine whether
         * another page exists without
         * running countDocuments().
         */

        const hasNextPage =
            rawProducts.length >
            limit;


        const products =
            hasNextPage
                ? rawProducts.slice(
                    0,
                    limit
                )
                : rawProducts;


        const normalizedProducts =
            products
                .map(
                    normalizePublicProduct
                )
                .filter(Boolean);


        /* -----------------------------------------
           NEXT CURSOR
        ----------------------------------------- */

        const lastProduct =
            products[
                products.length - 1
            ];


        const nextCursor =
            hasNextPage
                ? encodeCursor(
                    lastProduct
                )
                : null;


        /* -----------------------------------------
           OPTIONAL TOTAL
        ----------------------------------------- */

        let total = null;
        let totalPages = null;


        if (
            String(
                includeTotal
            ).toLowerCase() ===
            "true"
        ) {

            total =
                await Product.countDocuments(
                    filter
                );


            totalPages =
                Math.ceil(
                    total / limit
                );

        }


        /* -----------------------------------------
           RESPONSE
        ----------------------------------------- */

        return res.status(200).json({

            success: true,

            count:
                normalizedProducts.length,

            products:
                normalizedProducts,

            pagination: {

                limit,

                hasNextPage,

                nextCursor,

                mode:
                    cursor
                        ? "cursor"
                        : "initial",

                total,

                totalPages,

            },

        });

    } catch (error) {

        return sendControllerError(
            res,
            error,
            "Unable to fetch products"
        );

    }

};


/* =========================================================
   GET SINGLE PRODUCT
========================================================= */

const getSingleProduct =
    async (req, res) => {

    try {

        const { id } =
            req.params;


        if (
            !isValidObjectId(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid product ID",

            });

        }


        const product =
            await Product.findOne({

                _id: id,

                status: {
                    $ne: "archived",
                },

                visibility:
                    "public",

            })
                .lean();


        if (!product) {

            return res.status(404).json({

                success: false,

                message:
                    "Product not found",

            });

        }


        return res.status(200).json({

            success: true,

            product,

        });

    } catch (error) {

        return sendControllerError(
            res,
            error,
            "Unable to fetch product"
        );

    }

};


/* =========================================================
   UPDATE PRODUCT
========================================================= */

const updateProduct =
    async (req, res) => {

    try {

        const { id } =
            req.params;


        if (
            !isValidObjectId(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid product ID",

            });

        }


        /* -----------------------------------------
           FIND PRODUCT
        ----------------------------------------- */

        const product =
            await Product.findById(id);


        if (!product) {

            return res.status(404).json({

                success: false,

                message:
                    "Product not found",

            });

        }


        /* -----------------------------------------
           BUILD UPDATE
        ----------------------------------------- */

        const updateData =
            buildProductData(
                req.body
            );


        const files =
            Array.isArray(req.files)
                ? req.files
                : [];


        /*
         * Replace images only if new images
         * are uploaded.
         */

        if (files.length > 0) {

            if (
                files.length >
                MAX_IMAGES
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Maximum ${MAX_IMAGES} product images are allowed`,

                });

            }


            updateData.images =
                buildUploadedImages(
                    files
                );

        }


        /* -----------------------------------------
           EMPTY UPDATE
        ----------------------------------------- */

        if (
            Object.keys(updateData).length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "No valid product fields provided",

            });

        }


        /* -----------------------------------------
           APPLY UPDATE
        ----------------------------------------- */

        Object.assign(
            product,
            updateData
        );


        await product.validate();

        await product.save();


        return res.status(200).json({

            success: true,

            message:
                "Product updated successfully",

            product,

        });

    } catch (error) {

        return sendControllerError(
            res,
            error,
            "Unable to update product"
        );

    }

};


/* =========================================================
   DELETE / ARCHIVE PRODUCT
========================================================= */

const deleteProduct =
    async (req, res) => {

    try {

        const { id } =
            req.params;


        if (
            !isValidObjectId(id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid product ID",

            });

        }


        const product =
            await Product.findById(id);


        if (!product) {

            return res.status(404).json({

                success: false,

                message:
                    "Product not found",

            });

        }


        /*
         * Soft delete.
         */

        product.status =
            "archived";


        await product.save();


        return res.status(200).json({

            success: true,

            message:
                "Product archived successfully",

        });

    } catch (error) {

        return sendControllerError(
            res,
            error,
            "Unable to archive product"
        );

    }

};


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {

    createProduct,

    getAllProducts,

    getSingleProduct,

    updateProduct,

    deleteProduct,

};