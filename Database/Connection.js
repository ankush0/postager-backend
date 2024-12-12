//includes all schemas also

const { access } = require("fs");
const mong = require("mongoose");
const { platform, type } = require("os");

let gfsBucket;
    mong.connect("mongodb+srv://sumitsrawat2003:AJAYsumit2003%40123@cluster0.3tow8fw.mongodb.net/postager").then(() => {
        console.log("Connected to Database");
    }

    ).catch((err) => {
        console.log(err);
    });
        
    mong.connection.once("open", () => {
      const db = mong.connection.db;
      gfsBucket = new mong.mongo.GridFSBucket(db, { bucketName: "uploads" });
      console.log("GridFSBucket initialized");

    });

const Brandschema = new mong.Schema({

    userid: String,
    planId: {
        type: String,
        required: true,
        default: "1",
    },
    planName: {
        type: String,
        default: "Free",
        required: true
    },
    planType: {
        type: String,
        default: "Monthly",
        required: true
    },
    planPrice: {
        type: String,
        default: "0.00",
        required: true
    },
    planExpiry: {
        type: Date,
        required: true,
        default: '1-1-2040',
    },
    security_key: String,
    fbname:String,
    name: String,
    
    facebookcredential: {
        type: Map,
        of: String
    },
    fbpicture: String,
    instagramcredential: {
        type: Map,
        of: String
    },
    fbuseraccesstoken: String,
    instagrampicture: String,
    twitterAccessToken: String,
    twitterAccessSecret: String,
    linkdinid: String,
    linkdinCredential:{
        type: Map,
        of: String
    },
    linkdinPicture:String,
    youtubeCredential:{
        type: Map,
        of: String
    },
    youtubePicture:String,
    image: String,
    ptcredential: {
        type: Map,
        of: String
    },
    ptpicture: String,
    media:{
        media_id: {type: Array,required: true},
        platform:{type: Array,required: true},
        time: {type: Array,required: true},
        published_posts_id: {type: Object},

    },


    scheduledMedia:{
        media_id: {type: Array,required: true},
        platform:{type: Array,required: true},
        time: {type: Array,required: true},
        scheduledPostId:{
            type:Object,
            required:true
        }
        
    },
    schedule_id: String
    
})


const Brands = mong.model("postagerbrand", Brandschema);
const postschema = new mong.Schema({
    userid: String,
    instapostid: String,
    facebookpostid: String,
    twitterpostid: String,
    linkedinpostid: String,
    pinterestPostID: String,
    Createdat: Date,
    Scheduledat: Date,
    Status: String,
    Platform: {
         platform: { type: String}, // Platform name
   isChecked: { type: Boolean }, 
    },
    Content: String,
    Image: String,
    Brand: String,
    type:String
 })
 const Posts = mong.model("postagerpost", postschema);
 const memberschema = new mong.Schema({

    name: String,
    address: String,
    email: String,
    mobile: Number,
    passward: String,
    facebookid: String,
    facebooktoken: String,
    Instagramid: String,
    Instagramtoken: String,
    invitedBy: Array,
    Posts: [String],
    Brands: [String],
    AccessTo: [String]

})

const user = mong.model("postageruser", memberschema);

module.exports = async function AddNewUser(brands, posts) {
    var newuser = new user({
        name: "Guest",
        address: "",
        email: req.body.email,
        passward: 'Guest',
        mobile: '',
        facebookid: "",
        facebooktoken: "",
        Instagramid: "",
        Instagramtoken: "",
        Posts: [],
        AccessTo: [],
        Brands: []
    });
}
const schedule=new mong.Schema({
    brandId: {
        type: String,
       
    },
    post_id:Array,
    post_time:Array,
 
         
        insta_id:{
        type: String,
      
    },
    fb_id:{
        type: String,
       
    },
    twitter_id:{
        type: String,
       
    },
    linkedin_id:{
        type: String,
       
    },
    pinterest_id:{
        type: String,
       
    },


insta_access_token:{
    type: String,
    
},
fb_access_token:{
    type: String,
    
},
twitter_access_token:{
    type: String,

},
linkedin_access_token:{
    type: String,
    
},
pinterest_access_token:{
    type: String,

},
platform:Array

})
const Schedule = mong.model("postagerschedule", schedule);
const planschema = new mong.Schema({
    planId: {
      type: Number,
      default: 1,
      require: true
    },
    planDesc: {
      type: String,
      require: true
    },
    planName: {
      type: String,
      require: true
    },
    planPrice: {
      type: String,
      require: true
    },
  })
  const Plans = mong.model("postagerplans", planschema);

  function getGfsBucket() {
return gfsBucket;
  };
  module.exports = {
    Schedule,
    user,
  getGfsBucket,
    Brands,
    Posts,
    Plans
  }
  
