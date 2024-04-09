const express = require("express");
const dotenv =  require("dotenv").config();
const asyncHandler = require("express-async-handler");
const {getTokensAfterLogin,validateAccessToken} = require("../middleware/tokensMiddleware");
const {checkUserExistenceDB} = require("../middleware/dbMiddleware");
const {createFolder} = require("../middleware/filesMiddleware");

const hasJustLoggedIn =  asyncHandler( async (req, res, next)=>{
    if(!req.query["code"]){
        console.log("inside hasJustLoggedIn");
        next();
        return;
    }
    const authorizationCode = req.query.code;
    const tokens = await getTokensAfterLogin(authorizationCode);
    console.log("outside");
    res.cookie('email', tokens.emailFromIdToken); //{ sameSite: 'strict' }
    res.cookie('access_token', tokens.accessToken,{ httpOnly: true, secure: true});
    res.cookie('refresh_token', tokens.refreshToken,{ httpOnly: true, secure: true }); //{domain: 'localhost:5000', path: '/userdashboard'}
    return res.redirect('http://localhost:5000/userdashboard');
});

const hasAlreadyLoggedIn = asyncHandler(async (req,res,next)=>{
    
    const accessToken = req.cookies.access_token;
    if(!accessToken){
        return res.status(401).send("This is a private route. Access Token missing"); //should do like error
    }
    req.userId = await validateAccessToken(accessToken, res);
    if(req.userId == null){
        return;
    }

    const userDataFromDB = await checkUserExistenceDB(req.userId);
    if(userDataFromDB === "newUser"){
        req.body.folderPath="";
        req.body.newUser = "yes";
        await createFolder(req, res);
    }

    next();   
});

module.exports = {hasJustLoggedIn, hasAlreadyLoggedIn};