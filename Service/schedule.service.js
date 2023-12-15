var user = require('../Database/Model/User');
var Post = require('../Database/Model/Posts');
var Brand = require('../Database/Model/Brand');
var Plans = require('../Database/Model/Plans');
var jwt = require("jsonwebtoken");
const axios = require('axios');
const { IgApiClient } = require('instagram-private-api');
const { get } = require('request-promise');
const CronJob = require("cron").CronJob
const schedule = require('node-schedule');
const Transporter = require('../Mail/Transporter');
var { LocalStorage } = require('node-localstorage');
const serverfile = require('../server.js');
var upload = serverfile.upload
const Linekedin = require("../Controllers/LinkedIn");
const Instagram = require("../Controllers/Instagram");

// constructor function to create a storage directory inside our project for all our localStorage setItem.
var localStorage = new LocalStorage('./Localstorage');

exports.Post_To_All_SocialMedia_Scheduling_Post = async (req, res) => {
    if (req.body.Platform && req.body.value && req.body.userid.match(/^[0-9a-fA-F]{24}$/) && req.body.Content && req.body.Brand) {

        var userdata = await user.findById(req.body.userid, function (err, result) {

            if (err) {
                console.log(err);
                res.json({
                    status: 0,
                    msg: "check your Credentials or internal server error"

                })


            }

        })


        var Image =  process.env.IMG_URL + req?.file?.filename;
        // var Image =  'https://8bittask.com/june/WhatsApp05.mp4';
        // var Image = "https://8bittask.com/june/pinterest.png";

        var Content = req.body.Content;
        var post = new Post({
            userid: req.body.userid,
            instapostid: "",
            facebookpostid: "",
            linkedinpostid: "",
            Createdat: new Date(),
            Scheduledat: req.body.value,
            Status: "Scheduled",
            Platform: req.body.Platform,
            Content: Content,
            Image: Image,
            Brand: req.body.Brand
        });
        var postsave = await post.save();
        res.json({
            code: 1,
            msg: "Post has been Scheduled  succesfully"
        });



                // var Content = req.body.Content;



                // var currentPoststack = userdata.Posts;

                // var Content = req.body.Content;
                // var Image = 'http://localhost:4000/images/';

                // var base = 'https://graph.facebook.com/'

                // var post = new Post({

                //     userid: req.body.userid,
                //     instapostid: "",
                //     facebookpostid: "",
                //     Createdat: req.body.Date,
                //     Scheduledat: Date(),
                //     Status: "Scheduled",
                //     Platform: req.body.Platform,
                //     Brand: req.body.Brand


                // });

                // var postsave = await post.save();
                // res.json({
                //     code: 1,
                //     msg: "post has been Scheduled  succesfully"
                // });
    }
    else {

        res.json({

            status: 0,
            msg: "Send All Necessary and valid Details post"
        })
    }
}


exports.Post_Scheduling = async (req, res) => {
    if (req.body.Platform && req.body.Date && req.body.userid.match(/^[0-9a-fA-F]{24}$/) && req.body.Content && req.body.Brand) {

        var userdata = await user.findById(req.body.userid, function (err, result) {

            if (err) {
                console.log(err);
                res.json({
                    status: 0,
                    msg: "check your Credentials or internal server error"

                })


            }

        })



        // console.log(userdata);
        // if (userdata) {

        //     if (userdata.facebookid && userdata.facebooktoken && userdata.Instagramid && userdata.Instagramtoken) {
                // console.log(photopath);

                // var Instagramid=req.body.Instagramid;
                var Content = req.body.Content;



                var currentPoststack = userdata.Posts;

                var Content = req.body.Content;
                var Image = 'http://localhost:4000/images/';

                var base = 'https://graph.facebook.com/'

                var post = new Post({

                    userid: req.body.userid,
                    instapostid: "",
                    facebookpostid: "",
                    Createdat: req.body.Date,
                    Scheduledat: Date(),
                    Status: "Scheduled",
                    Platform: req.body.Platform,
                    Brand: req.body.Brand


                });

                var postsave = await post.save();

                // currentPoststack.push(postsave._id);
                // console.log(req.body.userid);

                // await user.findByIdAndUpdate(req.body.userid, { "Posts": currentPoststack }, function (err, docs) {

                //     if (err) {
                //         console.log(err)
                //     }
                //     else {
                //         console.log("User Post has been  Updated");
                //     }

                // });

                // const date = new Date(req.body.Date).toJSON();



                // if (req.body.Platform.includes("Facebook")) {
                //     localStorage.setItem("Facebook" + postsave._id, "Facebook Post Scheduled at " + date + "current timing" + new Date());
                //     schedule.scheduleJob(date, async function () {
                //         console.log("Facebook executing function has been called")

                //         posttoFacebookScheduled(userdata.facebookid, Image, Content, userdata.facebooktoken, postsave._id)


                //     })
                // }

                // if (req.body.Platform.includes("Instagram")) {


                //     localStorage.setItem("Instagram" + postsave._id, "Instagram Post Scheduled at " + date + "current timing" + new Date());
                //     const job = schedule.scheduleJob(date, function (y) {

                //         console.log("Instagram Scheduled function is Executing now");
                //         postToInstaScheduled(userdata.Instagramid, Content, Image, userdata.Instagramtoken, postsave._id);

                //     });
                // }




                res.json({
                    code: 1,
                    msg: "post has been Scheduled  succesfully"
                });


        //     }
        //     else {
        //         res.json({
        //             status: 0,
        //             msg: "you have not saved valid Credential saved in database"

        //         })

        //     }

        // }
        // else {

        //     res.json({
        //         status: 0,
        //         msg: "check your Credential User does not exist"

        //     })

        // }




    }
    else {

        res.json({

            status: 0,
            msg: "Send All Necessary and valid Details post"
        })
    }
}