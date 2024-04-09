const express = require("express"),
    dotenv =  require("dotenv").config(),
    asyncHandler = require("express-async-handler"),
    jwtDecode = require('jwt-decode'),
    {CognitoJwtVerifier} = require("aws-jwt-verify");

const getTokensAfterLogin = asyncHandler( async (authorizationCode) => {
    const tokenEndpoint = `${process.env.COGNITO_DOMAIN}/oauth2/token`,
        data = `grant_type=authorization_code&client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&redirect_uri=${process.env.CALLBACK_URL}&code=${authorizationCode}`;

    try{
        const response = await fetch(tokenEndpoint,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: data,
        });
        if (!response.ok) {
            const error = new Error(`Failed to get access token: ${response.status} ${response.statusText}`);
            error.code = "400";
            throw error;
        }
        const responseData = await response.json();
        const emailFromIdToken = await getEmailFromIdToken(responseData.id_token);

        return  { //if the async is a promise then do i need to use resolve instead of return
            'emailFromIdToken' : emailFromIdToken,
            'accessToken' : responseData.access_token,
            'refreshToken' : responseData.refresh_token
        };
    }catch(err){
        const error = new Error("Failed to get access token");
        error.code = "400";
        throw error;
    }
});

const getEmailFromIdToken = asyncHandler(async (idToken)=>{
    const decodedIdToken = jwtDecode(idToken);
    return decodedIdToken.email;
});

const validateAccessToken = asyncHandler( async (accessToken, res)=>{
    const accessVerifier = CognitoJwtVerifier.create({
        userPoolId: process.env.USERPOOL_ID,
        tokenUse: "access",
        clientId: process.env.CLIENT_ID,
    });
    try {
        accessPayload = await accessVerifier.verify(accessToken);
        return accessPayload.sub;
    } catch(err) {
        //to-do
        return res.redirect('http://localhost:5000/homepage');
    }
});

const revokeTokens = asyncHandler(async(req, res)=>{
    console.log("revoke inside");
    const revokeUrl = `https://filebox-user-authentication.auth.eu-north-1.amazoncognito.com/oauth2/revoke`;
    const headers = new Headers();

    const credentials = btoa(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`);
    headers.append('Authorization', `Basic ${credentials}`);

    headers.append('Content-Type', 'application/x-www-form-urlencoded');

    const body = new URLSearchParams();
    body.append('token', req.cookies.accessToken);
    body.append('client_id', process.env.CLIENT_ID);

    try{
        const response = await fetch(revokeUrl, {
            method: 'POST',
            headers: headers,
            body: body,
        });

        if(response.status === 200){
            console.log("successfully revoked tokens"); //to-do
            res.clearCookie('access_token');
            res.clearCookie('refresh_token');
            res.clearCookie('email');
            return res.status(200).send({message : "successfully revoked tokens"});
        }else {
            console.error('Token revocation failed:', response.statusText);
            return res.status(400).send({message : "Failed to revoke tokens"});
        }
    }catch(err){
        console.log(err);
        return res.status(400).send({message : "Failed to revoke tokens"});
    }
}); 

module.exports = {getTokensAfterLogin, validateAccessToken, getEmailFromIdToken, revokeTokens};