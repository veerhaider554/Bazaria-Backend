const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");


/*
|--------------------------------------------------------------------------
| Environment Validation
|--------------------------------------------------------------------------
*/

const requiredEnv = [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
];

for (const key of requiredEnv) {
    if (!process.env[key]) {
        throw new Error(`${key} is missing from environment variables`);
    }
}


/*
|--------------------------------------------------------------------------
| Cloudinary Configuration
|--------------------------------------------------------------------------
*/

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


/*
|--------------------------------------------------------------------------
| Cloudinary Storage
|--------------------------------------------------------------------------
*/

const storage = new CloudinaryStorage({
    cloudinary,

    params: {
        folder: "bazaria_products",

        allowed_formats: [
            "jpg",
            "jpeg",
            "png",
            "webp",
        ],

        transformation: [
            {
                width: 1200,
                height: 1200,
                crop: "limit",
                quality: "auto",
                fetch_format: "auto",
            },
        ],
    },
});


/*
|--------------------------------------------------------------------------
| File Validation
|--------------------------------------------------------------------------
*/

const allowedMimeTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);


const fileFilter = (req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
        return callback(
            new Error(
                "Only JPG, JPEG, PNG and WEBP images are allowed"
            )
        );
    }

    callback(null, true);
};


/*
|--------------------------------------------------------------------------
| Multer Upload Configuration
|--------------------------------------------------------------------------
*/

const upload = multer({
    storage,

    limits: {
        files: 10,
        fileSize: 5 * 1024 * 1024,
    },

    fileFilter,
});


module.exports = upload;