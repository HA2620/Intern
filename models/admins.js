
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({

    adminId: {
        type: String,
        required: true
    },

    adm_email: {
        type:String
    },
    admin_pass:{
        type:String,

    }



});

const Admin = new mongoose.model("Admin", adminSchema);
module.exports = Admin;