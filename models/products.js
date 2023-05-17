const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    prod_id:{
        type:String,
        required:true,
        unique:true,
        
    },
    name:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    qty:{
        type:Number,
        required:true
    },
    description:{
        type:String
    },
    origin:{
        type:String
    },
    fabric:{
        type:String
    },
    category:{
        type:String
    }


});

const Product = new mongoose.model("Product",productSchema);
module.exports = Product;