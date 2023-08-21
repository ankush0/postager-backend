var user=require('../Database/Model/User');
var Post=require('../Database/Model/Posts');
var Brand=require('../Database/Model/Brand');
var jwt = require("jsonwebtoken");
const axios = require('axios');

 async function main(req,res){

var userid= req.body.userid;

user.findByIdAndUpdate({userid},{ $push: { scores: 89 } })

 }

