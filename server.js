const express = require("express")
const parser = require("body-parser")
const ejs = require("ejs")
const multer = require("multer");
const app = new express();
const cors = require('cors');
const nodemailer = require("nodemailer")
const schedule = require('node-schedule');
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser')

const session = require('express-session')
const fs = require('fs');
const request = require('request');

var LoginRoutes = require('./Router/Route');
const path = require("path");

const twitter = require("./Twiter client/Twiter");
console.log(new Date());
app.get("/date", (req, res) => {

    res.send(new Date());
})

require("dotenv").config();
app.use(cors());
app.options('*', cors());

app.use(cookieParser())
        // to support JSON-encoded bodies

app.use(parser.json()); // to support JSON-encoded bodies
app.use(parser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));
// app.use(session({ secret: 'secret' }))
let port = process.env.PORT;
if (port == null || port == "") {
    port = 4000;
}
app.listen(port);

app.use('/images', express.static('uploads'));

var storage = multer.diskStorage({
    destination: function (req, file, cb) {

        // Uploads is the Upload_folder_name
        cb(null, "uploads")
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "-" + Date.now() + ".jpg")
    }
})

const maxSize = 10 * 1000 * 1000;

var upload = multer({
    storage: storage,
    limits: {
        fileSize: maxSize
    },
    fileFilter: function (req, file, cb) {

        // Set the filetypes, it is optional
        var filetypes = /jpeg|jpg|png|mp4/;
        var mimetype = filetypes.test(file.mimetype);

        var extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }

        cb(
            "Error: File upload only supports the following filetypes - " + filetypes
        );
    }

    // mypic is the name of file attribute
}).single("mypic");

app.use(upload);
app.use('/api/v1', LoginRoutes);

app.post("/uploadProfilePicture", function (req, res, next) {
    console.log(req.body);

    // upload(req,res,function(err) {   console.log(req.body.name);         if(err)
    // {             res.send(err)         }         else {              SUCCESS,
    // image successfully uploaded             res.send("Success, Image uploaded!")
    // }     })
})

app.get("/image/:name", function (req, res) {

    console.log("i have got the request to show images");

    var myLog = (path.join(__dirname, 'uploads/', req.params.name));

    if (fs.existsSync(myLog)) {
        console.log('file exists');
        res.sendFile(path.join(__dirname, 'uploads/', req.params.name));

    } else {
        res.statusCode = 302;
        res.setHeader(
            "Location",
            "https://images.pexels.com/photos/133081/pexels-photo-133081.jpeg?auto=compress" +
                    "&cs=tinysrgb&w=300"
        );
        res.end();
    }
  

})

app.get("/file", function (req, res) {

    res.sendFile(__dirname + "/new.html");

})

app.get("/gettheclientdata",function(req,res){

  res.send(JSON.stringify(req.session));
})