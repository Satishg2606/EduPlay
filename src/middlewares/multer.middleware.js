import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const fileExtension = file.originalname.split('.').pop();  // get file extension
        cb(null, `${uniqueSuffix}-${req.body.name}.${fileExtension}`);
    }
});

export const upload = multer({ 
    storage, 
});
