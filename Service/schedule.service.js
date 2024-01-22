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
const { post_to_pintrest } = require("../Controllers/Pinterest");

// constructor function to create a storage directory inside our project for all our localStorage setItem.
var localStorage = new LocalStorage("./Localstorage");

const posttoFacebookScheduled = async (
  pageid,
  Image,
  Content,
  accesstoken,
  postid
) => {
  var base = "https://graph.facebook.com/";
  var ping_adr =
    base +
    pageid +
    "/feed?photos?url=" +
    Image +
    "&message=" +
    Content +
    "&access_token=" +
    accesstoken;
  const facebookdata = await axios.post(ping_adr).catch((err) => {
    localStorage.setItem("Facebook" + postid, err);
    console.error(err);
  });

  if (facebookdata) {
    await Post.findByIdAndUpdate(postid, {
      facebookpostid: facebookdata.data.id,
      Status: "Live",
    });
    localStorage.removeItem("Facebook" + postid);
    console.log(
      `Post with id ${postid} has been uploaded succesfully on Facebook`
    );
  } else {
    console.log(`Post with id ${postid} could not be posted on Facbeook`);
  }
};



exports.Post_To_All_SocialMedia_Scheduling_Post = async (req, res) => {
  if (
    req.body.Platform &&
    req.body.Date &&
    req.body.userid.match(/^[0-9a-fA-F]{24}$/) &&
    req.body.Content &&
    req.body.Brand
  ) {
    try {
      var userdata = await user.findById(req.body.userid);

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
          msg: "check your Credentials or internal server error",
        });
      }
      if (req.body.Platform.includes("Facebook")) {
        localStorage.setItem(
          "Facebook " + post_saved._id,
          "Post Scheduled at " + date + "current timing" + new Date()
        );
        schedule.scheduleJob(req.body.Date, async function () {
          posttoFacebookScheduled(
            userdata.facebookid,
            Image,
            Content,
            userdata.facebooktoken,
            post_saved._id
          );
        });
      }

      if (req.body.Platform.includes("Pinterest")) {
        const { ptcredential } = brandData;

        const pinterest_access_token = ptcredential.values().next().value;

        const { title, board, content, url, mypic } = req.body;

        schedule.scheduleJob(new Date(req.body.Date), async function () {
        post_to_pintrest(
            pinterest_access_token,
            title,
            content,
            board,
            url,
            mypic
          );
        });

        console.log(
          "Pintrest" + post_saved._id,
          " Post Scheduled at " + req.body.Date + "current timing" + new Date()
        );

        localStorage.setItem(
          "Pintrest",
          "Post Scheduled at " + req.body.Date + "current timing" + new Date()
        );
      }
    } catch (error) {
      console.log(error);
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
