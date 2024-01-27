var mong = require("../Connection");

const crypto = require("crypto");
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

})

const Brands = mong.model("postagerbrand", Brandschema);
module.exports = Brands