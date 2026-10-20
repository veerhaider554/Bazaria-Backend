const express = require("express");

const upload = require("../config/cloudinary");

const {
    createProduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,
} = require("../controllers/productController");


const router = express.Router();


/*
|--------------------------------------------------------------------------
| PRODUCT ROUTES
|--------------------------------------------------------------------------
|
| Route responsibility:
| Request
|   ↓
| Route middleware
|   ↓
| Controller
|
| Database/business logic is handled elsewhere.
|
*/


/*
|--------------------------------------------------------------------------
| CREATE PRODUCT
|--------------------------------------------------------------------------
|
| Frontend sends multipart/form-data.
| Product images use the "images" field.
|
*/

router.post(
    "/",
    upload.array("images", 10),
    createProduct
);


/*
|--------------------------------------------------------------------------
| GET ALL PUBLIC PRODUCTS
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    getAllProducts
);


/*
|--------------------------------------------------------------------------
| GET SINGLE PUBLIC PRODUCT
|--------------------------------------------------------------------------
*/

router.get(
    "/:id",
    getSingleProduct
);


/*
|--------------------------------------------------------------------------
| UPDATE PRODUCT
|--------------------------------------------------------------------------
|
| Images are optional during update.
|
*/

router.put(
    "/:id",
    upload.array("images", 10),
    updateProduct
);


/*
|--------------------------------------------------------------------------
| ARCHIVE PRODUCT
|--------------------------------------------------------------------------
*/

router.delete(
    "/:id",
    deleteProduct
);


/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports = router;