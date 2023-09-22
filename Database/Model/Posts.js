var mong = require("../Connection");
const crypto = require("crypto");
const postschema = new mong.Schema({
   userid: String,
   instapostid: String,
   facebookpostid: String,
   twitterpostid: String,
   linkedinpostid: String,
   Createdat: Date,
   Scheduledat: Date,
   Status: String,
   Platform: [String],
   Content: String,
   Image: String,
   Brand: String,
   type:String
})
const Posts = mong.model("postagerpost", postschema);
module.exports = Posts;