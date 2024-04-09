const express = require("express");
const path = require("path");
const {hasJustLoggedIn, hasAlreadyLoggedIn} = require("../middleware/userValidation");
const router = express.Router();

//route for first time login or page refresh when in the userdashboard url

router.get("/",hasJustLoggedIn,hasAlreadyLoggedIn,(req, res)=>{
    res.sendFile(path.join(__dirname,"../../public/userdashboard.html"));
});



module.exports = router;