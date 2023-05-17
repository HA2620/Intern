require('dotenv').config({ path: (__dirname, '../.env') })
const express = require("express");
const path = require('path');
const hbs = require("hbs");
const nodemailer = require("nodemailer");
const session = require("express-session");
var helpers = require('handlebars-helpers')({
    handlebars: hbs
});
const stripe = require('stripe')(process.env.STRIPE_KEY);
const UniqueStringGenerator = require('unique-string-generator');
const date = require('date-and-time');
const bcrypt = require('bcrypt');
const multer = require('multer');



const app = express();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        return cb(null, '../public/Images')
    },
    filename: function (req, file, cb) {
        // console.log(req.body.productName);
        // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, `${req.body.productName}-jpg.jpg`)
    }
})

const upload = multer({ storage: storage })

var webviews = Number(process.env.WEB_VIEWS);

// Connection to Database
require("./db/conn");
const Register = require("./models/registers");
const Product = require("./models/products");
const Admin = require("./models/admins");
const Order = require("./models/orders");
const { log } = require("console");
const { use } = require("passport");


const static_path = path.join(__dirname, "../public");
const template_path = path.join(__dirname, "../templates/views");
const partials_path = path.join(__dirname, "../templates/partials");
const helper = helpers;

app.use(express.static(static_path));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set("view engine", "hbs");
app.set("views", template_path);
hbs.registerPartials(partials_path);

// app.set('trust proxy', 1) // trust first proxy
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}))

// Functions


//To send mail

const sendVerifyMail = async (name, email, user_id) => {
    // console.log('entered svm');
    try {

        const transporter = nodemailer.createTransport({
            // service:"Gmail",
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            // requireTLS:true,
            tls: {
                rejectUnauthorized: false
            },
            auth: {
                user: 'harshprasad338@gmail.com',
                pass: process.env.GMAIL_PASS
            }
        });
        const mailOptions = {
            // console.log('mailoptiobn read');
            from: 'harshprasad338@gmail.com',
            to: email,
            subject: "Verification Mail",
            html: `<p> Hii ${name}, Please click in the link <a href="http://127.0.0.1:3000/verify?id=${user_id}"> Verify <a/>your mail.</p>`

        }
        transporter.sendMail(mailOptions, function (error, info) {
            // console.log("entered send Mail");
            if (error) {
                console.log(error);
            }
            else {
                console.log("Email has been sent", info.response);
            }
            // console.log('last line svm try');

        })
    } catch (error) {
        console.log(error.message);
    }
    // console.log('last line svm');
}

// to verify email

const verifyMail = async (req, res) => {
    try {

        const updateStatus = await Register.updateOne({ _id: req.query.id }, { $set: { verified: true } });
        console.log(updateStatus);
        res.status(201).render("login", { message: "e-mail verified please login!", currStatus: req.session.currLog });
        // res.send("<!DOCTYPE html>  <html lang='en'> <head> <title>Email verification</title></head> <body> Thanks for verifying your mail with us. Kindly login again. <a href='/'>click here</a></body> </html>")
    } catch (error) {
        console.log(error.message);
    }
}

// MAIN

app.get("/", async (req, res) => {
    req.session.views = (req.session.views || 0) + 1;
    webviews = webviews + 1;
    if (!req.session.cart) {
        req.session.cart = [];
        req.session.totalValue = {
            totalPrice: 0,
            includeTax: 0,
        }
    }
    // console.log(`You have visited ${req.session.views} times.`);
    // console.log(`User name : ${req.session.currLog} name is.`);
    // console.log(req.session);
    res.render("index", { currStatus: req.session.currLog });



})

//to send forgot password link

const sendforgetPassLink = async (name, email, user_id) => {
    // console.log('entered svm');
    try {
        // console.log('entered svm try');
        const transporter = nodemailer.createTransport({
            // service:"Gmail",
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            // requireTLS:true,
            tls: {
                rejectUnauthorized: false
            },
            auth: {
                user: 'harshprasad338@gmail.com',
                pass: process.env.GMAIL_PASS
            }
        });
        const mailOptions = {
            // console.log('mailoptiobn read');
            from: 'harshprasad338@gmail.com',
            to: email,
            subject: "Change Password",
            html: `<p> Hii ${name}, Please click in the link to <a href="http://127.0.0.1:3000/changePassword?id=${user_id}"> change your password<a/>.</p>`

        }
        transporter.sendMail(mailOptions, function (error, info) {
            // console.log("entered send Mail");
            if (error) {
                console.log(error);
            }
            else {
                console.log("Email has been sent", info.response);
            }
            // console.log('last line svm try');

        })
    } catch (error) {
        console.log(error.message);
    }
    // console.log('last line svm');
}


//Register

app.get("/register", (req, res) => {
    res.render("register", { currStatus: req.session.currLog });
})
app.post("/register", async (req, res) => {
    console.log('entered reg post');
    try {
        console.log('entered reg post try');
        const password = req.body.password;
        const conPassword = req.body.confirmPassword;
        // console.log(password);
        console.log(conPassword);

        const userData = await Register.findOne({ email: req.body.email });
        if (userData) {
            res.send("User already exist!")
        }
        else {
            if (password === conPassword) {
                console.log('entered reg post try if');
                const userData = new Register({
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    email: req.body.email,
                    password: req.body.password,
                    confirmPassword: req.body.confirmPassword,
                    address: req.body.address
                });
                const registered = await userData.save();
                // console.log('sendingg...');
                sendVerifyMail(req.body.firstName, req.body.email, registered._id);
                res.status(201).render("login", { message: "verify your mail to continue", currStatus: req.session.currLog });

            } else {
                // render("register", { message: "Passwords do not match" });
                res.send("Password != Confirm Password")

            }

        }


    }
    catch (error) {
        res.status(400).send(error);
    }
});

// Login

app.get("/login", (req, res) => {
    res.render("login", { currStatus: req.session.currLog });
});

app.post("/login", async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await Register.findOne({ email: email });
        if (userData.verified) {
            if (userData.password === password) {
                // console.log(req.userData);
                req.session.currLog = userData._id;
                res.status(201).render('index', { currStatus: req.session.currLog }); /// To be done
            } else {
                // res.send("Password mismatch");
                res.render('login', { message: "Username or password incorrect", currStatus: req.session.currLog });
            }
        } else {
            // res.send("Please verify your email.")

            res.render('login', { message: "Please verify your mail", currStatus: req.session.currLog });
        }
        // res.send("Succesfully logged in");

    } catch (error) {
        console.log(error);
        res.status(400).send("Invalid email");
    }
})

//Forget Pass

app.get("/forgetPass", (req, res) => {
    res.render("forgetPass", { currStatus: req.session.currLog });
});

app.post("/forgetPass", async (req, res) => {
    try {
        const email = req.body.email;
        const userEmail = await Register.findOne({ email: email });
        if (userEmail) {
            res.send("Link has been sent to change your password in your registerd email");
            sendforgetPassLink(userEmail.firstName, userEmail.email, userEmail._id);
        }
        else {
            res.send("email not found");
            console.log("email not found");
        }

    } catch (error) {
        console.log(error);
        res.status(400).send("Invalid Email");
    }
});

// Change Forget Password

app.get("/changePassword", (req, res) => {
    res.render("changePassword", { userId: req.query.id, currStatus: req.session.currLog });
    // console.log("id = "+req.query.id);
});
app.post("/changePassword", async (req, res) => {
    const newPass = req.body.newPass;
    const conNewPass = req.body.confirmNewPass;
    if (newPass === conNewPass) {

        console.log('pass = ' + newPass);
        const updatePass = await Register.updateOne({ _id: req.body.userId }, { $set: { password: newPass, confirmPassword: conNewPass } });
        console.log(updatePass);
        res.send("Password has been changed successfully");

    }
    else {
        res.send("Password mismatch");
    }
});



//verification

app.get("/verify", verifyMail);

//

//Policies

app.get("/policies", (req, res) => {
    res.render("policies", { currStatus: req.session.currLog });
});

//About us
app.get("/about-us", (req, res) => {
    res.render("about-us", { currStatus: req.session.currLog });
});

// Products

app.get("/products", async (req, res) => {
    const ctg = req.query.category;
    var productList;
    if (ctg) {

        productList = await Product.find({ category: ctg });
    } else {
        productList = await Product.find();

    }
    // console.log(ctg);

    res.render("products", { productList: productList, currStatus: req.session.currLog });

});


// Product Main Page

app.get("/prdct-main", async (req, res) => {
    const clickedProduct = await Product.findOne({ prod_id: req.query.id });
    res.render("prdct-main", { clickedProduct: clickedProduct, currStatus: req.session.currLog });
    //console.log(req.query.id);
});

// Account 
app.get("/account", async (req, res) => {
    const currLoggedUser = await Register.findOne({ _id: req.session.currLog })
    // console.log(currLoggedUser.firstName);
    const orderDetails = await Order.find({ custId: currLoggedUser._id })
    console.log(orderDetails);
    res.render("account", { orderDetails: orderDetails, userDetails: currLoggedUser, currStatus: req.session.currLog });

});

//Cart
app.get("/cart", async (req, res) => {

    req.session.totalValue = {
        totalPrice: 0,
        includeTax: 0,
    }

    if (!(req.session.cart.length == 0)) {
        req.session.totalValue.totalPrice = 0;
        req.session.totalValue.includeTax = 0;
        for (var i = 0; i < req.session.cart.length; i++) {
            req.session.totalValue.totalPrice = req.session.totalValue.totalPrice + (req.session.cart[i].prodQty * req.session.cart[i].prodPrice);
        }
        req.session.totalValue.includeTax = req.session.totalValue.totalPrice + ((5 / 100) * req.session.totalValue.totalPrice);
    }
    res.render("cart", { total: req.session.totalValue, cartItems: req.session.cart, currStatus: req.session.currLog });

});

// Add to cart

app.get("/add/:prodId", async (req, res) => {

    // req.session.totalPrice = 

    const cartItem = req.session.cart;

    if (!req.session.currLog) {
        res.render("login");
    }
    else {
        // console.log("prof id = ", req.params.prodId);
        const cartProduct = await Product.findOne({ prod_id: req.params.prodId });
        const cartObj = {
            prodName: cartProduct.name,
            prodId: cartProduct.prod_id,
            prodQty: 1,
            prodPrice: cartProduct.price,
        };
        if (!cartItem) {
            (req.session.cart).push(cartObj);
        } else {
            var newItem = true;

            for (var i = 0; i < cartItem.length; i++) {
                if (cartItem[i].prodId == req.params.prodId) {
                    cartItem[i].prodQty++;
                    newItem = false;
                    break;
                }
            }
            if (newItem) {
                (req.session.cart).push(cartObj);
            }
        }


        // console.log("Cart prdct = ",cartProduct);

        // console.log(cartObj);

        // console.log("updates cart = ", req.session.cart);
        res.redirect("back");
    }

})
// Update product

app.get("/update/:prodId/:action", async (req, res) => {
    // console.log("prod Id = ",req.params.prodId);
    // const cartItem = req.session.cart;
    const action = req.params.action;
    // console.log("Action = ",action);
    for (var i = 0; i < req.session.cart.length; i++) {

        // console.log("ent loop");
        if (req.session.cart[i].prodId == req.params.prodId) {
            // console.log("ent if");
            switch (action) {
                case "add":
                    // console.log("ent add");
                    req.session.cart[i].prodQty++;
                    break;
                case "sub":
                    // console.log("ent sub");
                    if (req.session.cart[i].prodQty == 1) {
                        req.session.cart.splice(i, 1);
                    }
                    else {

                        req.session.cart[i].prodQty--;
                    }
                    break;
                case "clear":
                    // console.log("ent clear");
                    req.session.cart.splice(i, 1);
                    // if (req.session.cart.length == 0) {

                    // }
                    break;

                default:
                    console.log("Update Problem");
                    break;
            }
            break;
        }
    }
    res.redirect("/cart");
});

// Checkout or Payment

app.post('/create-checkout-session', async (req, res) => {
    const product = req.session.totalValue;
    // console.log("prod = ", product);
    // console.log("ses cart  = ", req.session.cart);
    // console.log("prod name = ", product[0].prodName);
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
            {
                price_data: {
                    currency: "inr",
                    product_data: {
                        name: "THE URBAN CLOTHING",
                    },
                    unit_amount: product.includeTax * 100,
                },
                quantity: 1,
            },
        ],
        mode: "payment",
        success_url: "http://localhost:3000/success",
        cancel_url: "http://localhost:3000/cancel",
    });

    res.redirect(303, session.url);
});
app.get("/success", async (req, res) => {

    const currLoggedUser = await Register.findOne({ _id: req.session.currLog })
    // console.log(currLoggedUser.firstName);
    const ordID = UniqueStringGenerator.UniqueNumberId();
    const now = new Date();
    const currTime = date.format(now, 'ddd, MMM DD YYYY');
    // date.format(now, 'YYYY/MM/DD HH:mm:ss');
    const delhiDate = date.addDays(now, +10);
    const delDate = date.format(delhiDate, 'ddd, MMM DD YYYY');

    const succOrder = new Order({
        custId: currLoggedUser._id,
        orderId: ordID,
        shopItems: req.session.cart,
        shopDate: currTime,
        orderStatus: "Ongoing"
    });
    const success = await succOrder.save();

    const successMessage = {
        orderId: ordID,
        subTotal: req.session.totalValue.totalPrice,
        tax: req.session.totalValue.includeTax - req.session.totalValue.totalPrice,
        delhiDate: delDate,
        delhiversTo: currLoggedUser.firstName,
        email: currLoggedUser.email,
    }

    req.session.cart = [];
    req.session.totalValue = {
        totalPrice: 0,
        includeTax: 0,
    }
    res.render("success", { success: successMessage, currStatus: req.session.currLog });

});

// Failed Transaction


app.get("/cancel", async (req, res) => {
    // const currLoggedUser = await Register.findOne({ _id: req.session.currLog })
    // console.log(currLoggedUser.firstName);
    res.render("cancel");

});

// Logout

app.get("/logout", (req, res) => {
    req.session.currLog = 0;
    res.redirect("/");
});

// Admin

app.get("/admin", (req, res) => {
    console.log("pass = ", process.env.SIX_DIGIT_CODE);
    res.render("admin");

});

app.post("/admin", async (req, res) => {
    try {
        const admData = await Admin.findOne({ admin_id: "tub01" });
        console.log("admData.admin_pass = ",admData.admin_pass);
        console.log("req.body.password = ",req.body.password);

        if (admData.admin_pass == req.body.password) {
            // console.log(req.userData);
            const products = await Product.find();
            const orders = await Order.find();
            const users = await Register.find();
            var productSold = 0;
            var sales = 0;
            for (var i = 0; i < orders.length; i++) {
                productSold = productSold + orders[i].shopItems.length;
                for (var j = 0; j < orders[i].shopItems.length; j++) {
                    sales = sales + orders[i].shopItems[j].prodPrice;
                }
            }
            const overview = {
                sales: sales,
                productSold: productSold,
                webViews: webviews
            }
            res.render("admin-dashboard", { products: products, orders: orders, users: users, overview: overview });

        } else {
            // res.send("Password mismatch");
            res.render("admin", { message: "Incorrect Password" })
        }

    } catch (error) {
        console.log(error);
    }

});

// Admin add product

app.post("/admin/add-product", upload.single('product-image'), async (req, res) => {

    // req.body.id;
    try {
        console.log(req.file);
        console.log(req.body);



        const productAdd = new Product({
            prod_id: req.body.productId,
            name: req.body.productName,
            price: req.body.productPrice,
            qty: req.body.productQty,
            description: req.body.productDescription,
            origin: req.body.productOrigin,
            fabric: req.body.productFabric,
            category: req.body.category
        });
        const success = await productAdd.save();
        res.redirect('back');
        // console.log("Succes Product added - ",success);
    } catch (error) {
        console.log(error);
    }
});

// Admin edit product

app.get("/admin/dashboard/product/edit", async (req, res) => {

    console.log(req.query.id);
    const fetchProduct = await Product.findOne({ prod_id: req.query.id });
    // console.log(fetchProduct.name); 
    res.render("admin-edit-product", { product: fetchProduct })
});

app.post("/admin/edit-product/:id", upload.single('product-image'), async (req, res) => {
    console.log("param = ", req.params.id);
    const updateProduct = await Product.updateOne({ prod_id: req.params.id }, {
        $set: {
            name: req.body.productName,
            price: req.body.productPrice,
            qty: req.body.productQty,
            description: req.body.productDescription,
            origin: req.body.productOrigin,
            fabric: req.body.productFabric,
            category: req.body.category
        }
    });
    res.redirect('/admin');
});

// delete product

app.get("/admin/dashboard/product/delete", async (req, res) => {
    try {
        const deleteProduct = await Product.deleteOne({ prod_id: req.query.id });
        console.log("id =", req.query.id);
        console.log("del pr = ", deleteProduct);
        res.redirect("/admin");

    } catch (error) {
        console.log(error);
    }
});
app.listen(process.env.PORT, () => {
    console.log(`Server is running at ${process.env.PORT}`);
});
