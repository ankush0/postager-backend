
var mong = require("../Connection");

const crypto = require("crypto");
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
module.exports = user;