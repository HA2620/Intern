const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({

    custId: {
        type: ObjectId,
        required: true
    },

    orderId: {
        type:String,
        require:true
    },
    shopItems:{
        type:Array,

    },
    shopDate:{
        type:String,
    },
    orderStatus:{
        type:String,
    }


});

const Order = new mongoose.model("Order", orderSchema);
module.exports = Order;