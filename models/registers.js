const mongoose = require('mongoose');

const userRegSchema = new mongoose.Schema({
    firstName: {
        type:String,
        required:true
    },
    lastName: {
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    confirmPassword:{
        type:String,
        required:true
    },
    verified:{
        type:Boolean,
        default:false
        
    },
    address:{
        type:String
    }
});



const Register = new mongoose.model("Register",userRegSchema);

module.exports = Register;
