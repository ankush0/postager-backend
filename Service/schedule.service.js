var user = require("../Database/Model/User");
var Post = require("../Database/Model/Posts");
var Brand = require("../Database/Model/Brand");
var Plans = require("../Database/Model/Plans");
var jwt = require("jsonwebtoken");
const axios = require("axios");
const { IgApiClient } = require("instagram-private-api");
const { get } = require("request-promise");
const CronJob = require("cron").CronJob;
const schedule = require("node-schedule");
const Transporter = require("../Mail/Transporter");
var { LocalStorage } = require("node-localstorage");
const serverfile = require("../server.js");
var upload = serverfile.upload;
const Linekedin = require("../Controllers/LinkedIn");
const Instagram = require("../Controllers/Instagram");
const { post_to_pinterest } = require("../Controllers/Pinterest");
const { getAccessToken, getFbId, postToFacebook } = require("../Controllers/Facebook.js");

// constructor function to create a storage directory inside our project for all our localStorage setItem.
var localStorage = new LocalStorage("./Localstorage");





exports.Post_To_All_SocialMedia_Scheduling_Post = async (req, res) => {
  if (
    req.body.Platform &&
    req.body.Date &&
    req.body.userid.match(/^[0-9a-fA-F]{24}$/) &&
    req.body.Content &&
    req.body.Brand
  ) {
    try {
      const userdata = await user.findById(req.body.userid);

      const brandData = await Brand.findById(req.body.Brand);

      var post = new Post({
        userid: req.body.userid,
        Createdat: new Date(),
        Scheduledat: new Date(),
        Status: "Live",
        Platform: req.body.Platform,
        Content: req.body.Content,
        Image: req.body.mypic,
        Brand: req.body.Brand,
      });
      var post_saved = await post.save();

      if (!userdata) {
        res.json({
          status: 0,
          msg: "Check your Credentials before posting",
        });
      }

      if (req.body.Platform.includes("facebook")) {
        schedule.scheduleJob(req.body.Date, async function () {
          postToFacebook(
            getFbId(brandData),
            req.body.mypic,
            req.body.Content,
            getAccessToken(brandData),
            post_saved._id
          );
        });

        console.log(`Facebook Post with Id: ${post_saved.id} scheduled for ${req.body.Date}`);
      }

      if (req.body.Platform.includes("Pinterest")) {
        const { title, board, content, url, mypic } = req.body;

        schedule.scheduleJob(new Date(req.body.Date), async function () {
        post_to_pinterest(
            brandData,
            title,
            content,
            board,
            url,
            mypic
          );
        });

        console.log(`Pinterest Post with Id: ${post_saved.id} scheduled for ${req.body.Date}`);
      }
    } catch (error) {
      res.json({
        status: 500,
        msg: error,
      });
    }

    res.json({
      code: 1,
      msg: "Post has been Scheduled succesfully",
    });
  } else {
    res.json({
      status: 0,
      msg: "Send All Necessary and valid Details",
    });
  }
};

exports.Post_Scheduling = async (req, res) => {
  // Get current time
  const currentTime = new Date();

  // Calculate 1 minute ago and 1 minute ahead
  const oneMinuteAgo = new Date(currentTime.getTime() - 5 * 60 * 1000);
  const oneMinuteAhead = new Date(currentTime.getTime() + 5 * 60 * 1000);

  const updatedBrand = await Post.updateOne(
    {
      Status: "Scheduled",
      Scheduledat: { $gte: oneMinuteAgo, $lte: oneMinuteAhead },
    },
    { $set: { Status: "Live" } }
  );
  console.log(updatedBrand);

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

  // // var postsave = await post.save();

  res.json({
    code: 1,
    msg: "post has been Scheduled  succesfully",
  });
};
