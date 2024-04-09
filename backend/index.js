const express = require("express");
const dotenv =  require("dotenv").config();
const path = require("path");
const cookieParser = require('cookie-parser');
const app = express();
const {revokeTokens} = require("./middleware/tokensMiddleware")


const port = process.env.PORT || 5000;

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Promise Rejection:', reason);
});
  
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname,"../public")));
app.use("/homepage",(req,res)=>{
    res.sendFile(path.join(__dirname,"../public/index.html"));
});
app.use("/userdashboard",require('./routes/dashboardRoutes'));
app.use("/files",require('./routes/fileRoutes'));
app.use("/logout",revokeTokens);

//  ERROR HANDLING 
app.use((err,req,res,next)=>{
    /*
    const statusCode = res.statusCode ? res.statusCode : 500;
    switch(statusCode){
        case ://to-do
            res.json({
                title : res.title
            });
    }
    */
   if(err){
       console.log("error",err);
        res.status(500).json({ error: 'Something went wrong!' });
   }
});

app.listen(port, ()=>{
    console.log(`Server running on port ${port}`);
});

