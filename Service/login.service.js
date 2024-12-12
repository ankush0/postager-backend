const {user}=require("../Database/Connection");
const {Posts} = require("../Database/Connection")
var jwt = require("jsonwebtoken");
const Transporter = require("../Mail/Transporter");
var { LocalStorage } = require("node-localstorage");


// constructor function to create a storage directory inside our project for all our localStorage setItem.
var localStorage = new LocalStorage("./Localstorage");

// const twitter = require('twitter-lite');


// const plan = new Plans({
//     planId: 1,
//     planDesc: "Plan 1",
//     planName: "Free",
//     planPrice: "10$"
// })
// plan.save()




function generateAccessToken(userData) {
  return jwt.sign(
    {
      data: userData,
    },
   "b7ef9135bc070a5900ff96e723cf157cd69fc48994667faf3defa35591a5d1e8b9e91c80a4010d0cc92d4af506516d26c9f732ddcdc757a4dee624a56f3a400e",
    {
      expiresIn: "24h",
    }
  );
}

exports.Login = async (req, res) => {
  console.log(req.body);
  var data;
  if (req.body.email && req.body.passward) {
    if (req.body.email.length > 0 && req.body.passward.length > 0) {
      data = {
        email: req.body.email,
        passward: req.body.passward,
      };
    }

    await user.findOne(data).then((user) => {
      if (!user) {
        console.log("not found");
        res.json({
            status: 0,
            msg: "not found"
        });
    }
   else{
    res.json({
      access_token: generateAccessToken(user),
      data: user,
      message: " success"
  });
   }
 
    })
}
   else {
   
    await res.json({
      status: 0,
      msg: "Invalid Fields",
    });
  }
};

exports.googleLogin = async (req, res) => {
  if (req.body.name && req.body.email) {
    user.find(
      {
        email: req.body.email,
      },
      async function (err, result) {
        if (result.length == 0) {
          var newuser = new user({
            name: req.body.name,
            email: req.body.email,
            passward: "Dheeraj@`8931",
            facebookid: "",
            facebooktoken: "",
            Instagramid: "",
            Instagramtoken: "",
            Posts: [],
            AccessTo: [],
          });
          var dat = await newuser.save();
          console.log(dat);
          data = {
            email: req.body.email,
            passward: req.body.passward,
          };
          user.findOne(data, function (err, user) {
            res.json({
              access_token: generateAccessToken(user),
              data: user,
              status: 1,
              msg: "success",
            });
          });
        } else {
          data = {
            email: req.body.email,
          };
          user.findOne(data, function (err, user) {
            if (!user) {
              res.json({
                status: 0,
                msg: "not found",
              });
            }
            if (err) {
              res.json({
                status: 0,
                message: err,
              });
            }

            res.json({
              access_token: generateAccessToken(user),
              data: user,
              message: " success",
            });
          });
        }
      }
    );
  } else {
    res.json({
      status: 0,
      mag: "Enter valid Credential",
    });
  }
};

exports.Signup = async (req, res) => {
  if (
    req.body.name &&
    req.body.address &&
    req.body.passward &&
    req.body.mobile &&
    req.body.email
  ) {
    const result = await user.find({
      email: req.body.email,
    });
    console.log(result);
    if (result.length == 0) {
      var newuser = new user({
        name: req.body.name,
        address: req.body.address,
        email: req.body.email,
        passward: req.body.passward,
        mobile: req.body.mobile,
        facebookid: "",
        facebooktoken: "",
        Instagramid: "",
        Instagramtoken: "",
        Posts: [],
        AccessTo: [],
      });
      var dat = await newuser.save();
      console.log(dat);
      const data = {
        email: req.body.email,
        passward: req.body.passward,
      };
      user.findOne(data).then((user) => {
        res.json({
          access_token: generateAccessToken(user),
          data: user,
          status: 1,
          msg: "User Created",
        });
      });
    } else {
      res.json({
        status: 0,
        msg: "User Already Exist",
      });
    }
  } else {
    res.json({
      status: 0,
      mag: "Enter valid Credential",
    });
  }
};

exports.UpdateAccount = async (req, res) => {
  console.log("updated account");
  if (
    req.body._id.match(/^[0-9a-fA-F]{24}$/) &&
    req.body.email &&
    req.body.mobile &&
    req.body.name
  ) {
    user.updateOne(
      { _id: req.body._id },
      { email: req.body.email, mobile: req.body.mobile, name: req.body.name },
      function (error, response) {
        // && req.body.  req.body.id&& "address": req.body.address,
        if (error) {
          res.json({
            status: 0,
            msg: "internal server error or 'UserId' is not correct",
          });
        } else {
          if (response.nModified == 1) {
            res.json({
              Status: 1,
              msg: "Profile Updated Succesfully",
            });
          } else {
            res.json({
              Status: 0,
              msg: "Not Updated Either Check your Credentials or change your Form fields or Stop OverWriting",
            });
          }
        }
      }
    );
  } else {
    res.json({
      status: 0,
      msg: "Send all Necessary Fields",
    });
  }
};
exports.ForgetPassward = async (req, res) => {
  const data = await user.findOne(
    { email: req.body.email },
    function (err, docs) {
      if (err) {
        res.json({
          status: 0,
          msg: "Internal Server Error",
        });
        console.log(err);
      }
    }
  );
  if (data) {
    Transporter(req.body.email, localStorage).then(
      (response) => {
        console.log(response);
        if (response.accepted.length > 0) {
          res.json({
            status: 1,
            msg: "Email send Succesfully",
          });
        } else {
          res.json({
            status: 0,
            msg: "Email not Send",
          });
        }
      },
      (error) => {
        console.log(error);
        res.json({
          status: 0,
          msg: "Internal Server Error Email can not be sent Either format of Email is not Good",
        });
      }
    );
  } else {
    res.json({
      code: 0,
      msg: "Email is not Registerd with us",
    });
  }
};
exports.VerifyCode = async (req, res) => {
  if (req.body.email && req.body.code) {
    var email = req.body.email;
    var code = req.body.code;
    console.log(localStorage.getItem(JSON.stringify(email)));

    if (localStorage.getItem(JSON.stringify(email)) == code) {
      res.json({
        status: 1,
        msg: "Verified Sucessfully",
      });
      localStorage.removeItem(JSON.stringify(email));
    } else {
      res.json({
        status: 0,
        msg: "Not Verified",
      });
    }
  } else {
    res.json({
      code: 0,
      msg: "Check your Credentials",
    });
  }
};

exports.NewPassward = async (req, res) => {
  if (req.body.email && req.body.passward) {
    await user.updateOne(
      { email: req.body.email },
      { passward: req.body.passward },
      function (error, response) {
        if (error) {
          console.log(error);
        }
        console.log(response);
        if (response.nModified == 1) {
          res.json({
            status: 1,
            msg: "Updated Succesfully",
          });
        } else {
          res.json({
            status: 0,
            msg: "Email address not Registerd or You are trying to overwrite existring data",
          });
        }
      }
    );
  } else {
    res.json({
      status: 0,
      msg: "Enter Valid Details",
    });
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
    var userdata = await user.findById(req.body.userid, function (err, result) {
      if (err) {
        console.log(err);
        res.json({
          status: 0,
          msg: "check your Credentials or internal server error",
        });
      }
    });

    // console.log(userdata);
    // if (userdata) {

    //     if (userdata.facebookid && userdata.facebooktoken && userdata.Instagramid && userdata.Instagramtoken) {
    // console.log(photopath);

    // var Instagramid=req.body.Instagramid;
    var Content = req.body.Content;

    var currentPoststack = userdata.Posts;

    var Content = req.body.Content;
    var Image = "http://localhost:4000/images/";

    var base = "https://graph.facebook.com/";

    var post = new Posts({
      userid: req.body.userid,
      instapostid: "",
      facebookpostid: "",
      Createdat: req.body.Date,
      Scheduledat: Date(),
      Status: "Scheduled",
      Platform: req.body.Platform,
      Brand: req.body.Brand,
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
      msg: "post has been Scheduled  succesfully",
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
  } else {
    res.json({
      status: 0,
      msg: "Send All Necessary and valid Details",
    });
  }
};

exports.Show_All_Post = async (req, res) => {
  if (req.body.userid && req.body.userid.match(/^[0-9a-fA-F]{24}$/)) {
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to 0
    // Create a query based on the timestamp field
    const currentTime = new Date(); // replace with your current timestamp
    const previousTime = new Date(currentTime.getTime() - 124 * 60 * 60 * 1000);

    const next365Days = new Date(today);
    next365Days.setDate(today.getDate() + 365);

    const firstArrayData = await Posts.find({
      Scheduledat: { $lt: currentTime, $gte: previousTime },
      userid: req.body.userid,
      Brand: req.body.brandId,
    }).limit(20);

    // Fetch data from the secondArray collection for today
    const secondArrayData = await Posts.find({
      Scheduledat: { $lt: next365Days, $gte: currentTime },
      userid: req.body.userid,
      Brand: req.body.brandId,
    });

    // Do something with the data
    // console.log('Data from firstArray:', firstArrayData);
    // console.log('Data from secondArray:', secondArrayData);

    res.json({
      status: 1,
      data: firstArrayData,
      secondArrayData: secondArrayData,
    });
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
