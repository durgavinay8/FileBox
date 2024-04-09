const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client, GetObjectCommand,PutObjectCommand, DeleteObjectCommand, ListObjectsCommand} = require("@aws-sdk/client-s3");
const {checkUserExistenceDB, updateData} = require("../middleware/dbMiddleware");
const asyncHandler = require("express-async-handler");
const dotenv = require("dotenv").config();

const s3Client = new S3Client({
    region: process.env.BUCKET_REGION,
    credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY
    }
});

const getPreSignedUrl = asyncHandler( async (req, res) => {
    if(!req.query["fileKey"]){
        return res.status(404).send("Didn't provided the fileKey to serve the request");
    }
    console.log("-===>",req.query.fileKey);

    const url = await getSignedUrl(s3Client, new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: req.query.fileKey,
    }));
    return res.status(200).json({ presigned_url: url });
});

const deleteFile = asyncHandler(async(req, res)=>{
    if(!req.query["fileKey"]){
        return res.status(404).send("Didn't provided the fileKey to serve the request");
    }

    let imageCount = 0,videoCount = 0, documentCount = 0, otherCount = 0, fileSize = 0;

    if(!req.query.folder){
        const objectDetails = await getObjectDetailsFromS3(req.query.fileKey); //directly from frontend i can get this info
        
        fileSize = 0-(objectDetails.contentLength/1073741824);
    
        if ((objectDetails.contentType).includes('image')) {
            imageCount--;
        } else if ((objectDetails.contentType).includes('video')) {
            videoCount--;
        } else if (
            (objectDetails.contentType).includes('application/pdf') ||
            (objectDetails.contentType).includes('application/msword') ||
            (objectDetails.contentType).includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') ||
            (objectDetails.contentType).includes('application/vnd.ms-excel') ||
            (objectDetails.contentType).includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') || 
            (objectDetails.contentType).includes('application/vnd.ms-powerpoint') ||
            (objectDetails.contentType).includes('application/vnd.openxmlformats-officedocument.presentationml.presentation') 
            ) {
                documentCount--;
        } else {
            otherCount--;
        }
    }else{
        req.query.fileKey = req.userId+"/"+req.query.fileKey;
    }
        
    console.log("-===>",req.query.fileKey);
    const response = await s3Client.send(new DeleteObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: req.query.fileKey,
    }));

    await updateData(req.userId,{
        storageUsed: fileSize,
        imagesCount: imageCount,
        videosCount: videoCount,
        documentsCount: documentCount,
        othersCount: otherCount,
    });
        
    return res.status(200).json({"message": "File successfully deleted."})
});

const listUserFiles = asyncHandler(async (req,res)=>{
    const listObjectsdata = await s3Client.send(new ListObjectsCommand({
        Bucket: process.env.BUCKET_NAME,
        Prefix: `${req.userId}`
    }));

    const folderStructure ={};
    const userFiles = listObjectsdata.Contents.map((eachContent) => {
        const objectkeyParts = eachContent.Key.split("/"), noOfParts = objectkeyParts.length-1;
        let currentLevel = folderStructure;
        for(let i=1; i<noOfParts; ++i){
            currentLevel = currentLevel[objectkeyParts[i]] = currentLevel[objectkeyParts[i]] || {};
        }
        //in the frontend i want to join each part and get the url instead of just keeping it in the JSON. lot's of storage minimized!. I guess!!
        //ippudu vaddhu tharuvaatha chusukunddam
        currentLevel[objectkeyParts[noOfParts]] = {
            fileKey: eachContent.Key,
            fileSize: eachContent.Size,
            lastModified: eachContent.LastModified,
        };
    });

    const userDataFromDB = await checkUserExistenceDB(req.userId);
    
    return res.json({
        userDataFromDB: userDataFromDB,
        folderStructure: folderStructure
    });
});

const uploadFiles = asyncHandler( async (req, res, next)=>{
    if(!req.files || req.files.length === 0 ){
        return res.status(400).send('No files were uploaded');
    }

    let imageCount = 0;
    let videoCount = 0;
    let documentCount = 0;
    let otherCount = 0;
    let filesSize = 0;

    try{
        const files = req.files;
        let key = req.userId+"/"+req.body.folderPath;
        if(req.body.folderPath){
            key+="/";
        }
        
        for(const file of files){
            const uploadParams = {
                Bucket: process.env.BUCKET_NAME,
                Key: key+file.originalname,
                Body: file.buffer,
                ContentType: file.mimetype,
            };
            await s3Client.send(new PutObjectCommand(uploadParams));

            filesSize += file.size;
            const mimeType = file.mimetype;
            if (mimeType.includes('image')) {
                imageCount++;
            } else if (mimeType.includes('video')) {
                videoCount++;
            } else if (
                mimeType.includes('application/pdf') ||
                mimeType.includes('application/msword') ||
                mimeType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') ||
                mimeType.includes('application/vnd.ms-excel') ||
                mimeType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') || 
                mimeType.includes('application/vnd.ms-powerpoint') ||
                mimeType.includes('application/vnd.openxmlformats-officedocument.presentationml.presentation') 
              ) {
                documentCount++;
            } else {
                otherCount++;
            }
        }

        filesSize /= 1073741824;
        await updateData(req.userId,{
            storageUsed: filesSize,
            imagesCount: imageCount,
            videosCount: videoCount,
            documentsCount: documentCount,
            othersCount: otherCount,
        });
        res.status(200).json({message: 'Files uploaded successfully'});
    }catch(error){
        res.status(500).json({message: "Error uploading files"});
    }
});

const createFolder = asyncHandler(async (req,res)=>{
    let folderPath = req.body.folderPath;

    try{
        const uploadParams = {
            Bucket: process.env.BUCKET_NAME,
            Key: req.userId+'/'+folderPath,
        };
        await s3Client.send(new PutObjectCommand(uploadParams));
        
        if(req.body.newUser != "yes"){
            return res.status(200).json({message: "Successfully created folder"});
        }else{
            return;
        }
    }catch(error){
        return res.status(500).json({message: "Error creating folder"});
    }
});

const getObjectDetailsFromS3 = asyncHandler(async(fileKey)=>{
    const {ContentLength, ContentType} = await s3Client.send(new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: fileKey,
    }));
    return {
        contentLength: ContentLength,
        contentType: ContentType,
    };
});

module.exports = {getPreSignedUrl, deleteFile, listUserFiles, uploadFiles,createFolder};