var user = require('../Database/Model/User');
var Post = require('../Database/Model/Posts');
var Brand = require('../Database/Model/Brand');

const path = require('path')
var { LocalStorage } = require('node-localstorage');
const Instagram = require("../Controllers/Instagram");
const { postReelsToFacebook, getAccessToken, getFbId } = require("../Controllers/Facebook");
const { media_upload: media_upload_confirmation } = require('../Controllers/Pinterest.js');

// constructor function to create a storage directory inside our project for all our localStorage setItem.
var localStorage = new LocalStorage('./Localstorage');


exports.Reels_To_All_SocialMedia_Immediatly = async (req, res) => {
    try {
        let errorstaus = false;
        if (req.body.Platform && req.body.userid.match(/^[0-9a-fA-F]{24}$/) && req.body.Brand && req.body.Brand.match(/^[0-9a-fA-F]{24}$/)) {
            // console.log(req.file);
            let userdata = await user.findById(req.body.userid)
            let branddata = await Brand.findById(req.body.Brand)
            var Image =  process.env.IMG_URL + req?.file?.filename;

            var currentPoststack = userdata.Posts;            


            if (req.body.Platform.includes("facebook")) {
                const jsonPath = path.join(__dirname, '..', 'uploads', req.body.fileName);

                await postReelsToFacebook(getAccessToken(branddata),  getFbId(branddata), jsonPath)

            }

            if(req.body.Platform.includes('Pinterest')) {
                await media_upload_confirmation(branddata, req.body.fileName, req.body.pinterestData);
            }
            

            var post = new Post({
                userid: req.body.userid,
                instapostid: instagrampostid,
                Createdat: new Date(),
                Scheduledat: new Date(),
                Status: "Live",
                Platform: req.body.Platform,
                type: "Reels",
                Image: Image,
                Brand: req.body.Brand
            });
            var post_saved = await post.save();
            currentPoststack.push(post_saved._id);
            await user.updateOne({ "_id": req.body.userid }, { "Posts": currentPoststack }, function (error, response) {
                if (error) {
                    console.log(error);
                }
            });
            res.json({ msg: `Posted Successfully to ${req.body.Platform.join(' , ')}`, status: 1 });
        }
        else {
            res.json({
                status: 0,
                msg: "Send All Necessary and valid Details"
            })
        }
    } catch (err) {
        res.json({
            status: 0,
            msg: "error in Server"
        })
        console.log(err);
    }
}