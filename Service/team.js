var user = require('../Database/Model/User');
var Team = require('../Database/Model/Team');
const Transporter = require('../Mail/Transporter');
const express = require("express");
const app = express();
var { LocalStorage } = require('node-localstorage');
var localStorage = new LocalStorage('./Localstorage');

exports.sendMail = async (req, res) => {
    var team = new Team({
                    name: req.body.name,
                    email: req.body.email,
                    brand_name: req.body.brand_name
                });
                var dat = await team.save();
                console.log(dat);
    if (req.body.email && req.body.brand_name && req.body.name) {
        Transporter(req.body.email, localStorage,req.body.brand_name,req.body.name).then((response) => {
            console.log(response);
            if (response.accepted.length > 0) {
                

                res.json({
                    status: 1,
                    msg: "Email send Succesfully"
                });
            }
            else {
                res.json({
                    status: 0,
                    msg: "Email not Send"
                });
            }
        }, (error) => {
            console.log(error);
            res.json({
                status: 0,
                msg: "Internal Server Error Email can not be sent Either format of Email is not Good"
            });
        });
    }
    else {
        res.json({
            code: 0,
            msg: "Please enter email id"
        })
    }
}


module.exports.team = async (req, res) => {
    try {
        if (req.body.email) {
            Team.find({
                email: req.body.email
            }, function (err, result) {
                if (!err) {
                    res.json({ status: 1, data: result });
                } else {
                    res.send("internal server error");
                }
            })
        } else {
            res.json({ status: 0, msg: "Please enter Valid Credentials" })
        }
    }
    catch (err) {
        console.log(err);
        res.json("Internal Servr Error watch logs for more information");
    }
}