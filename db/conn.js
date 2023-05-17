const mongoose = require("mongoose");
mongoose.set('strictQuery',false);
mongoose.connect("mongodb://127.0.0.1/userRegistration",{
    useNewUrlParser:true,
    
}).then(() => {
    console.log("Connection successfull");
}).catch((e)=>{
    console.log("No connecton");
});