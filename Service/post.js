var user = require("../Database/Connection").user;
var Post = require("../Database/Connection").Posts;
const Brand = require("../Database/Connection").Brands;

const { getGfsBucket } = require("../Database/Connection");

const schedule = require("node-schedule");

var { LocalStorage } = require("node-localstorage");
const Instagram = require("../Controllers/Instagram");

const { post_to_pinterest } = require("../Controllers/Pinterest");
const {
  postToFacebook,
  getFbId,
  getAccessToken,
} = require("../Controllers/Facebook");

// constructor function to create a storage directory inside our project for all our localStorage setItem.
var localStorage = new LocalStorage("./Localstorage");

exports.Post_To_All_SocialMedia_Immidiatly = async (req, res) => {
  async function gfs() {
    const gfsBucket = await getGfsBucket();
    return gfsBucket;
  }
  const posts_id = [];
  let fb_post_id = null;
  let insta_post_id = null;
  const gfsBucket = await gfs();
  const media_id = [];
  const platformArray = [];
  let formattedDate;
  let formattedTime;
  req.body.Platform.forEach((element) => {
    if (element.isChecked) {
      platformArray.push(element.platform);
    }
  });
  console.log("platformArray", platformArray);
  try {
    for (let i = 0; i < req.body.mypic.length; i++) {
      const base64Data = req.body.mypic[i].replace(
        /^data:image\/jpeg;base64,/,
        ""
      );
      const as = await new Promise((resolve, reject) => {
        const uploadStream = gfsBucket.openUploadStream(req.body.Brand, {
          metadata: {
            chunkSizeBytes: 1048576, // 1 MB chunks
            type: "image",
          },
        });
        // Listen for finish and error events
        uploadStream.on("finish", () => {
          console.log("File successfully uploaded with ID:", uploadStream.id);
          media_id.push(uploadStream.id);
          resolve(uploadStream.id);
        });

        uploadStream.on("error", (err) => {
          console.error("Error uploading file:", err);
          reject(err);
        });

        // Write buffer to the upload stream
        uploadStream.end(Buffer.from(base64Data, "base64"));
      });

      console.log("as", as);
    }
  } catch (err) {
    console.log("error in uploading image to gridfs", err);
  }

  try {
    console.log("-----------fb------------", req.body);

    const brandData = await Brand.findById(req.body.Brand);

    if (req.body.Platform[0].isChecked) {
      //for facebook
      try {
        fb_post_id = await postToFacebook(
          getFbId(brandData),
          req.body.mypic,
          req.body.Content,
          getAccessToken(brandData),
          req.body.Date
        );
      } catch (error) {
        console.log("facebook error", error);
        res.json({
          status: 0,
          msg: error,
        });
      }
    }
    if (req.body.Platform[1].isChecked) {
      //for instagram

      try {
        insta_post_id = await Instagram.postToInsta(
          brandData.instagramcredential.values().next().value,
          brandData.fbuseraccesstoken,
          req.body.Content,
          req.body.mypic,
          res,
          brandData,
          req.body.Date
        );
      } catch (error) {
        console.log("insta error", error);
        res.json({
          status: 0,
          msg: error,
        });
      }
    }

    if (req.body.Date != undefined) {
      const newdate = new Date(req.body.Date);
      const unixTimestamp = Math.floor(newdate.getTime() / 1000);
      const date = new Date(unixTimestamp * 1000);
      const dateFormatter = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      formattedDate = dateFormatter.format(date);

      const timeFormatter = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
      formattedTime = timeFormatter.format(date);

      console.log(`Date: ${formattedDate}`); // Output example: "Sunday, 29, January"
      console.log(`Time: ${formattedTime}`); // Output example: "10:30 AM"
      const response = await Brand.findByIdAndUpdate(
        req.body.Brand,
        {
          $push: {
            "scheduledMedia.media_id": media_id,
            "scheduledMedia.platform": platformArray,
            "scheduledMedia.time": [formattedDate, formattedTime],
            "scheduledMedia.scheduledPostId": {
              fb_post_id: fb_post_id,
              insta_post_id: insta_post_id,
              post_type: req.body.mypic.length > 1 ? "carousel" : "image",
            },
          },
        },
        { new: true }
      );
    } else {
      const date = new Date(); // Current date and time
      const dateFormatter = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      formattedDate = dateFormatter.format(date);
      const timeFormatter = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
      formattedTime = timeFormatter.format(date);

      console.log(`Date: ${formattedDate}`);
      console.log(`Time: ${formattedTime}`);
    }

    console.log("mediaIdField", req.body.Brand);
    const response = await Brand.findByIdAndUpdate(
      req.body.Brand,
      {
        $push: {
          "media.media_id": media_id,
          "media.platform": platformArray,
          "media.time": [formattedDate, formattedTime],
          "media.published_posts_id": {
            fb_post_id: fb_post_id,
            insta_post_id: insta_post_id,
            post_type: req.body.mypic.length > 1 ? "carousel" : "image",
          },
        },
      },
      { new: true }
    );
    if (response) {
      console.log("media uplaoded succesfully");
      res.json({
        status: 1,
        msg: "success",
      });
    }
  } catch (err) {
    console.log("error in post.js", err);
    res.json({
      status: 0,
      msg: "error in Server",
    });

    return;
  }
};
exports.Post_To_All_SocialMedia_Scheduling = async (req, res) => {
  if (
    req.body.Platform &&
    req.body.Date &&
    req.body.userid.match(/^[0-9a-fA-F]{24}$/) &&
    req.body.Content &&
    req.body.Brand
  ) {
    try {
      var userdata = await user.findById(req.body.userid);

      var post = new Post({
        userid: req.body.userid,
        Createdat: new Date(),
        Scheduledat: new Date(),
        Status: "Live",
        Platform: req.body.Platform,
        Content: Content,
        Image: Image,
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
        const { title, board, content, url } = req.body;

        localStorage.setItem(
          "Pinterest" + post_saved._id,
          " Post Scheduled at " + date + "current timing" + new Date()
        );

        schedule.scheduleJob(req.body.Date, async function () {
          post_to_pinterest(brandData, title, content, board, url);
        });
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

exports.Show_All_Post = async (req, res) => {
  if (req.body.userid && req.body.userid.match(/^[0-9a-fA-F]{24}$/)) {
    Post.find(
      {
        userid: req.body.userid,
        Brand: req.body.brandId,
      },
      function (err, result) {
        if (!err) {
          res.json({
            status: 1,
            data: result,
          });
        } else {
          res.send("internal server error");
        }
      }
    );
  } else {
    res.json({
      status: 0,
      msg: "Please enter Valid Credentials",
    });
  }
};

exports.Show_Scheduled_Post = async (req, res) => {
  if (req.body.userid && req.body.userid.match(/^[0-9a-fA-F]{24}$/)) {
    Post.find(
      {
        userid: req.body.userid,
        Status: "Scheduled",
      },
      function (err, result) {
        if (!err) {
          res.json({
            status: 1,
            data: result,
          });
        } else {
          res.send("internal server error");
        }
      }
    );
  } else {
    res.json({
      status: 0,
      msg: "Please enter Valid Credentials",
    });
  }
};

exports.Show_Live_Post = async (req, res) => {
  if (req.body.userid && req.body.userid.match(/^[0-9a-fA-F]{24}$/)) {
    Post.find(
      {
        userid: req.body.userid,
        Status: "Live",
      },
      function (err, result) {
        if (!err) {
          res.json({
            status: 1,
            data: result,
          });
        } else {
          res.send("Internal Server Error");
        }
      }
    );
  } else {
    res.json({
      status: 0,
      msg: "Please enter Valid Credentials",
    });
  }
};

exports.Show_;
