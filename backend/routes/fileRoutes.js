const express = require("express");
const path = require("path");
const multer = require('multer');

const {hasAlreadyLoggedIn} = require("../middleware/userValidation");
const {getPreSignedUrl, deleteFile, listUserFiles,uploadFiles,createFolder} = require("../middleware/filesMiddleware");
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({storage});

router.use('/',hasAlreadyLoggedIn);
router.get('/allFiles',listUserFiles);
router.get('/presignedUrl',getPreSignedUrl);
router.delete('/delete',deleteFile);
router.post('/upload',upload.array("files"), uploadFiles);
router.post('/createFolder',createFolder);

module.exports = router;