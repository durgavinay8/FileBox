const mysql = require("mysql2/promise");
const asyncHandler = require("express-async-handler");

const checkUserExistenceDB =  asyncHandler( async (userId)=>{
    const connection  = await mysql.createConnection({
        host: "fileboxdb.ccrybb7wgvwx.us-east-1.rds.amazonaws.com",
        user: "admin",
        password: "filebox123",
        database: "fileboxdb",
        port: 3306
    });
    
    const result = await connection .query(`SELECT * FROM filebox_users WHERE userId = ?`, [userId]);
    let userData;
    if (result[0].length === 0 ) {
        await connection.query(`INSERT INTO filebox_users (userId) VALUES (?)`, [userId]);
        console.log("Successfully Added new user");
        return "newUser";
    } else {
        userData = {
            userId: result[0][0].userId,
            Total_storage: result[0][0].totalStorage,
            Used_storage: result[0][0].storageUsed,
            image_count: result[0][0].imagesCount,
            document_count: result[0][0].documentsCount,
            videos_count: result[0][0].videosCount,
            other_count: result[0][0].othersCount
        }
        return userData;
    }
});

const updateData = asyncHandler( async (userId, fileTypes)=>{
    const connection  = await mysql.createConnection({
        host: "fileboxdb.ccrybb7wgvwx.us-east-1.rds.amazonaws.com",
        user: "admin",
        password: "filebox123",
        database: "fileboxdb",
        port: 3306
    });
    
    for(const fileType in fileTypes){
        connection.query(`UPDATE filebox_users SET ${fileType} = ${fileType} + ${fileTypes[fileType]} WHERE userId = '${userId}';`);
    }
});

module.exports = {checkUserExistenceDB, updateData};