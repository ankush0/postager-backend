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



// const twitter = require('twitter-lite');



const newTweeterClient = function (subdomain = 'api', Consumer_key, Consumer_Secret, access_token, access_token_secret, Bearer_Token) {
    return new twitter({
        subdomain,
        consumer_key: Consumer_key,
        consumer_secret: Consumer_Secret,
        access_token_key: access_token,
        access_token_secret: access_token_secret
    });
}


// const plan = new Plans({
//     planId: 1,
//     planDesc: "Plan 1",
//     planName: "Free",
//     planPrice: "10$"
// })
// plan.save()





const postToInstaScheduled = async (Instagramid, Content, Image, accesstoken, postid) => {



    var base = 'https://graph.facebook.com/'
    // var date_Frontend=req.body.date;
    // var date=req.body.date;
    var ping_adr = base + Instagramid + '/media?image_url=' + Image + '&caption=' + Content + '&access_token=' + accesstoken;
    const data = await axios
        .post(ping_adr).catch((err) => {
            console.error(err.code)
            localStorage.setItem("Instagram" + postid, err.code);
        });
    if (data) {

        var container_ping_adr = base + Instagramid + '/media_publish?creation_id=' + data.data.id + '&access_token=' + accesstoken;;


        const datafromupload = await axios.post(container_ping_adr).catch((err) => {
            localStorage.setItem("Instagram" + postid, error);

        });

        if (datafromupload) {
            await Post.findByIdAndUpdate(postid, { "instapostid": datafromupload.data.id, "Status": "Live" }, function (error, response) {

                if (error) {


                    console.log(error);
                }

                if (!error) {

                    console.log("updated Document" + response)
                }

            });
            localStorage.removeItem("Instagram" + postid);
            console.log("post has been uploaded on Instagram");

        }
        else {

            localStorage.setItem("Instagram" + postid, "error");

        }

    }
    else {

        localStorage.setItem("Instagram" + postid, "error");
    }







}

const posttoFacebookScheduled = async (pageid, Image, Content, accesstoken, postid) => {

    var base = 'https://graph.facebook.com/'
    var ping_adr = base + pageid + '/feed?photos?url=' + Image + '&message=' + Content + '&access_token=' + accesstoken;
    const facebookdata = await axios.post(ping_adr)
        .catch((err) => {
            localStorage.setItem("Facebook" + postid, err)
            console.error(err)
        })

    if (facebookdata) {
        await Post.findByIdAndUpdate(postid, { "facebookpostid": facebookdata.data.id, "Status": "Live" }, function (error, response) {
            if (!error) {

                console.log(response);
            }



        });
        localStorage.removeItem("Facebook" + postid);
        console.log("post has been uploaded succesfully on Facebook");

    }
    else {

        console.log("The  Facebookpost post can not be posted on facebbook");
    }






}



function generateAccessToken(userData) {

    return jwt.sign({
        data: userData
    },
        process.env.TOKEN_SECRET, {
        expiresIn: "24h",
    }
    );
}


exports.Login = async (req, res) => {

    var data;
    if (req.body.email && req.body.passward) {
        if (req.body.email.length > 0 && req.body.passward.length > 0) {
            data = {
                email: req.body.email,
                passward: req.body.passward
            };
        }

        user.findOne(data, function (err, user) {
            
            if (!user) {
                res.json({
                    status: 0,
                    msg: "not found"
                });
            }
            if (err) {
                res.json({
                    status: 0,
                    message: err
                });
            }




            res.json({
                access_token: generateAccessToken(user),
                data: user,
                message: " success"
            });
        })
    }
    else {
        res.json({
            status: 0,
            msg: "Invalid Fields"
        });
    }









}
exports.Signup = async (req, res) => {
    if (req.body.name && req.body.address && req.body.passward && req.body.mobile && req.body.email) {
        user.find({
            email: req.body.email
        }, async function (err, result) {
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
                    AccessTo: []
                });
                var dat = await newuser.save();
                console.log(dat);
                data = {
                    email: req.body.email,
                    passward: req.body.passward
                };
                user.findOne(data, function (err, user) {
                    res.json({
                        access_token: generateAccessToken(user),
                        data: user,
                        status: 1,
                        msg: "User Created"
                    });
                })

            } else {

                res.json({
                    status: 0,
                    msg: "User Already Exist"
                });

            }



        })

    }
    else {
        res.json({
            status: 0,
            mag: "Enter valid Credential"
        })
    }
}

exports.UpdateAccount = async (req, res) => {
    console.log('updated account');
    if (req.body._id.match(/^[0-9a-fA-F]{24}$/) && req.body.email && req.body.mobile && req.body.name) {
        user.updateOne({ "_id": req.body._id }, { "email": req.body.email, "mobile": req.body.mobile, "name": req.body.name }, function (error, response) {
            // && req.body.  req.body.id&& "address": req.body.address,
            if (error) {
                res.json({
                    status: 0,
                    msg: "internal server error or 'UserId' is not correct"
                })
            }
            else {
                if (response.nModified == 1) {
                    res.json({
                        Status: 1,
                        msg: "Profile Updated Succesfully"
                    })
                }
                else {
                    res.json({
                        Status: 0,
                        msg: "Not Updated Either Check your Credentials or change your Form fields or Stop OverWriting"
                    })
                }
            }
        });
    }
    else {
        res.json({
            status: 0,
            msg: "Send all Necessary Fields"
        })
    }
}
exports.ForgetPassward = async (req, res) => {

    const data = await user.findOne({ email: req.body.email }, function (err, docs) {

        if (err) {
            res.json({
                status: 0,
                msg: "Internal Server Error"
            })
            console.log(err)
        }
    }
    );
    if (data) {
        Transporter(req.body.email, localStorage).then((response) => {
            console.log(response);
            if (response.accepted.length > 0) {
                res.json({
                    status: 1,
                    msg: "Email send Succesfully"
                });
            }
            else {
                res.json({
                    status: 0,
                    msg: "Email not Send"
                });
            }
        }, (error) => {
            console.log(error);
            res.json({
                status: 0,
                msg: "Internal Server Error Email can not be sent Either format of Email is not Good"
            });
        });
    }
    else {
        res.json({
            code: 0,
            msg: "Email is not Registerd with us"
        })
    }
}
exports.VerifyCode = async (req, res) => {


    if (req.body.email && req.body.code) {
        var email = req.body.email;
        var code = req.body.code;
        console.log(localStorage.getItem(JSON.stringify(email)));


        if (localStorage.getItem(JSON.stringify(email)) == code) {

            res.json({

                status: 1,
                msg: "Verified Sucessfully"

            });
            localStorage.removeItem(JSON.stringify(email));
        }
        else {
            res.json({

                status: 0,
                msg: "Not Verified"

            });



        }








    }
    else {


        res.json({

            code: 0,
            msg: "Check your Credentials"

        })
    }


}



    ;

exports.NewPassward = async (req, res) => {

    if (req.body.email && req.body.passward) {
        await user.updateOne({ "email": req.body.email }, { "passward": req.body.passward }, function (error, response) {
            if (error) {

                console.log(error)
            }
            console.log(response)
            if (response.nModified == 1) {

                res.json({

                    status: 1,
                    msg: "Updated Succesfully"
                })
            }
            else {

                res.json({

                    status: 0,
                    msg: "Email address not Registerd or You are trying to overwrite existring data"
                })


            }

        });


    }
    else {

        res.json({
            status: 0,
            msg: "Enter Valid Details"

        })

    }


};




exports.CreateFacebookPost = async (req, res) => {

    var pageid = req.body.Page_id;
    var photurl = req.body.Photo_url;
    var postmessage = req.body.Post_message;
    var accesstoken = req.body.accesstoken;
    var base = 'https://graph.facebook.com/'
    var date_Frontend = req.body.date;
    // var date=req.body.date;

    var ping_adr = base + pageid + '/feed?photos?url=' + photurl + '&message=' + postmessage + '&access_token=' + accesstoken;

    const date = new Date(date_Frontend);
    console.log("hello we are scheduling the job");

    // const job =  await schedule.scheduleJob(date, function(y){
    console.log("Time has come");
    axios
        .post(ping_adr)
        .then((result) => {
            console.log(`Status: ${result.status}`)
            console.log('Body: ', result.data)
            res.send(result.data);
        })
        .catch(err => {
            console.error(err)
        })
    // }.bind(null,"scheduling"));





}
exports.CreateInstagramPost = async (req, res) => {

    console.log(req.body);
    // var UserName = req.body.UserName;
    // var UserPass = req.body.UserPass;

    var Instagramid = req.body.Instagramid;
    var Content = req.body.Content;
    var Image = req.body.Image;
    var accesstoken = req.body.accesstoken;
    // new Date(2012, 11, 21, 5, 30, 0) date in this format
    const date = new Date(2023, 0, 1, 18, 5, 0);
    console.log(date);

    postToInsta(Instagramid, Content, Image, accesstoken);
    // await schedule.scheduleJob( date,postToInsta(UserName, UserPass, Content, Image))

    //  console.log( new Date().toLocaleString());
    //     const cronInsta = new CronJob("51 14 1 1 0", async () => {
    //         console.log(":hello i am intitaded")
    //         postToInsta();
    //     });

    // res.send(cronInsta.start());

}

CreateTweeterPost = async (ACCESS_TOKEN, ACCESS_SECRET, Bearer_Token) => {

    const uploadClient = newTweeterClient('upload', process.env.API_KEY, process.env.API_SECRET, ACCESS_TOKEN, ACCESS_SECRET, Bearer_Token);
    var data = await uploadClient.post("statuses/update", { status: "I tweeted from Node.js!" }, function (error, tweet, response) {
        if (error) {
            console.log(error)
        } else {
            console.log(tweet)
        }
    })

    if (data) {


        return data.id
    }
    else {

        return null;
    }

}

exports.AddApikeysandTokenFacebook = async (req, res) => {

    if (req.body._id && req.body.Facebookid && req.body.Facebooktoken && req.body._id.match(/^[0-9a-fA-F]{24}$/)) {
        user.updateOne({ "_id": req.body._id }, { "facebookid": req.body.Facebookid, "facebooktoken": req.body.Facebooktoken }, function (error, response) {
            if (error) {

                res.json({

                    status: 0,
                    msg: "Internal Server Error check your credentials"
                })
            }
            else {
                if (response.nModified == 1) {

                    res.json({
                        Status: 1,
                        msg: "updated succesfully"


                    })

                }
                else {
                    res.json({
                        Status: 0,
                        msg: "Not Updated/Dont tyr to Overwrite"


                    })

                }
            }
            console.log(error);

        });
    }
    else {


        res.json(

            {
                status: 0,
                msg: "Send all Necessary Fields"

            }
        )
    }



}

exports.AddApikeysandTokenInstagram = async (req, res) => {




    if (req.body._id && req.body.Instagramid && req.body.Instagramtoken && req.body._id.match(/^[0-9a-fA-F]{24}$/)) {
        user.updateOne({ "_id": req.body._id }, { "Instagramid": req.body.Instagramid, "Instagramtoken": req.body.Instagramtoken }, function (error, response) {
            if (error) {
                res.send("Internal server error Check your Credentials userid");

            }
            else {

                if (response.nModified == 1) {

                    res.json({
                        Status: 1,
                        msg: "updated succesfully"


                    })

                }
                else {
                    res.json({
                        Status: 0,
                        msg: "Not Updated"


                    })

                }
            }

        });

    }
    else {
        res.json({

            status: 0,
            mag: "send all necessary fields"

        })

    }



}


exports.AddApikeysandTokenTwitter = async (req, res) => {




    if (req.body._id && req.body.Instagramid && req.body.Instagramtoken && req.body._id.match(/^[0-9a-fA-F]{24}$/)) {
        user.updateOne({ "_id": req.body._id }, { "Instagramid": req.body.Instagramid, "Instagramtoken": req.body.Instagramtoken }, function (error, response) {
            if (error) {
                res.send("Internal server error Check your Credentials userid");

            }
            else {

                if (response.nModified == 1) {

                    res.json({
                        Status: 1,
                        msg: "updated succesfully"


                    })

                }
                else {
                    res.json({
                        Status: 0,
                        msg: "Not Updated"


                    })

                }
            }

        });

    }
    else {
        res.json({

            status: 0,
            mag: "send all necessary fields"

        })

    }



}



exports.Post_To_All_SocialMedia_Immidiatly = async (req, res) => {
    //    var date=new Date('2011-04-11T10:20:30Z')
    // console.log(req.body);
    try {

        var errorstaus = false;
        if (req.body.Platform && req.body.userid.match(/^[0-9a-fA-F]{24}$/) && req.body.Content && req.body.Brand && req.body.Brand.match(/^[0-9a-fA-F]{24}$/)) {
            // console.log(req.file);
            var userdata = await user.findById(req.body.userid, function (err, result) {

                if (err) throw err;
            })
            var branddata = await Brand.findById(req.body.Brand, function (err, result) {

                if (err) throw err;
            })
            //app.js
            
            console.log("------------");
            // const express = require('express');
            // const app = express();
            // const multer = require("multer");
            // app.post("/multiple", upload.array("images", 5), (req, res) => {
            //     if (req.files) {
            //         console.log("Muliple files uploaded successfully");
            //     } else {
            //         console.log("Please upload a valid images");
            //     }
            //   });
            var Image =  process.env.IMG_URL + req?.file?.filename;
            // var Image =  'https://8bittask.com/june/WhatsApp05.mp4';
            // var Image = "https://8bittask.com/june/pinterest.png";
            var Content = req.body.Content;
            var facebookpostid = "";
            var instagrampostid = "";
            var linkedinid = ""
            var currentPoststack = userdata.Posts;            

            if (req.body.Platform.includes("facebook")) {
                console.log("-----------Facebook------------");
                for (let [key, value] of branddata.facebookcredential) {
                    var pageid = key;
                    var ACCESS_TOKEN = value;
                    const FB = require('fb');
                    FB.setAccessToken(ACCESS_TOKEN);
                    FB.api(`/${pageid}/photos`,'POST',{ "message": Content,url: Image },
                        function (response) {
                            console.log('successfully posted to page!',response);
                          if (response.error) {
                           console.log('error occurred: ' , response.error)
                           return;
                          }
                          console.log('successfully posted to page!');
                        }
                    );
                }
            }

            if (req.body.Platform.includes("instagram")) {
                console.log("-----------Instagram------------");
                for (let [key, value] of branddata.instagramcredential) {
                    console.log(key);
                    let containerParams = new URLSearchParams();
                    var pageid = key;
                    var accesstoken = value;
                    instagrampostid = await Instagram.postToInsta(key
                        , req.body.Content, Image, value
                    );
                }
            }

            if (req.body.Platform.includes("Twitter")) {
                // const TwitterApi = require('twitter-api-v2');
                const { TwitterApi } = require('twitter-api-v2');
                console.log("-----------twit------------");
                const client = new TwitterApi({
                    appKey: "frE99Sn3FBj0pB43iTAuEiAny",
                    appSecret: "824gCARU9VA0MQAINXKcgkeSt8w8luXOF5O1KA20P3KaWUhwAs",
                    accessToken: branddata.twitterAccessToken,
                    accessSecret: branddata.twitterAccessSecret,
                  });
                if(req?.file?.filename){
                    // You can use media IDs generated by v1 API to send medias!
                    const mediaId = await client.v1.uploadMedia('./uploads/mypic-1690207485574.jpg');

                    await client.v2.tweetThread([
                    // 'Hello, lets talk about Twitter!',
                    { text: req.body.Content, media: { media_ids: [mediaId] } },
                    // 'This thread is automatically made with twitter-api-v2 :D',
                    ]);
                }else{
                    const { data: createdTweet } = await client.v2.tweet(req.body.Content);
                    console.log('Tweet', createdTweet.id, ':', createdTweet.text);
                }
                

                // console.log(req.files[0]);
//                 const { google } = require('googleapis');
// const fs = require('fs');

// // Replace with your credentials
// const CLIENT_ID = '817536862033-r8fhq0khg051u6d41g010erj54lrbrtr.apps.googleusercontent.com';
// const CLIENT_SECRET = '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';
// const REDIRECT_URI = 'http://localhost:3000/Pinterest'; // This should be one of the authorized redirect URIs you set in your Google Developers Console.

// // Replace with your video details
// const VIDEO_TITLE = 'My Uploaded Video 23444';
// const VIDEO_DESCRIPTION = 'Description for my video gggg';
// const VIDEO_FILE_PATH = './WhatsApp.mp4'; // The file path of the video you want to upload

// async function authorize() {
//   const auth = new google.auth.OAuth2(
//     CLIENT_ID,
//     CLIENT_SECRET,
//     REDIRECT_URI
//   );


//   // Generate the access token using your refresh token or OAuth 2.0 flow
//   // The access token will be used to authenticate API requests
//   // For more details on how to obtain the access token, check the google-auth-library documentation.
//   const accessToken = "ya29.a0AbVbY6M9s9TwmLB4cqClkjlvIrYeyt7nPyYUFU-b1NotzPXIsHsB1O67nNOMNy1PAP_TdmXIEj2auGSUFDw2S60-JUOLAcQ34j7Berxxa6HTJgWhcZmt8vi69CSx8PA5odIyYsaS9CXcHjBOGiKrKSdsdUiEiAaCgYKAYcSARESFQFWKvPlukDlKUGoukc3y6MmEPWcwQ0165";

//   auth.setCredentials({
//     access_token: accessToken,
//   });

//   return auth;
// }

// async function uploadVideo(auth) {
//   const youtube = google.youtube({
//     version: 'v3',
//     auth: auth,
//   });

//   const videoDetails = {
//     part: 'snippet,contentDetails,statistics',
//     requestBody: {
//       snippet: {
//         title: VIDEO_TITLE,
//         description: VIDEO_DESCRIPTION,
//       },
//       status: {
//         privacyStatus: 'public', // Change this to 'public' or 'unlisted' if desired
//       },
//     },
//   };

//   const videoPath = VIDEO_FILE_PATH;
//   const media = {
//     mimeType: 'video/*',
//     body: fs.createReadStream(videoPath),
//   };

//   try {
//     const res = await youtube.videos.insert(videoDetails, media);
//     console.log(`Video uploaded! Video ID: ${res.data.id}`);
//   } catch (err) {
//     console.error('Error uploading video:', err.message);
//   }
// }
// async function main() {
//   try {
//     const auth = await authorize();
//     await uploadVideo(auth);
//   } catch (err) {
//     console.error('Error:', err.message);
//   }
// }

// main();
//                 const Twit = require('twit');

//                 const T = new Twit({
//                 consumer_key: 'qPP3ysixSRV2TWqyuVqNGPdGd',
//                 consumer_secret: 'mtlhIoGn7oh9v0F9OnvocVBxLPet5Hv1XIfANU9b8OlbZnlPuA',
//                 access_token: '1547149737337712643-Z47HNK4UlbgxOOAea0QR2UyJSVplMp',
//                 access_token_secret: '0spWPKAkLbs3TMjA7ibt3cTiXrM72Gzr2s2atCIBmwDiw',
//                 });
//                 // Post a tweet
//                 // Function to retrieve tweets
//                        // Function to post media
//                        function postTweet(tweetText) {
//                         T.post('2/tweets', { status: tweetText }, (err, data, response) => {
//                           if (err) {
//                             console.error('Error posting tweet:', err.message);
//                           } else {
//                             console.log('Tweet posted successfully!');
//                             console.log('Tweet ID:', data);
//                             console.log('Tweet text:', data);
//                           }
//                         });
//                       }
                      
//                       // Example usage: Call the function to post a tweet
//                       const tweetText = "Hello, Twitter! This is my first tweet using Node.js! #NodeJS #TwitterAPI";
//                       postTweet(tweetText);


//                       // app.js

// // Function to fetch tweets
// function fetchTweets() {
//   const query = { q: '#example', count: 2 }; // Replace '#example' with your desired search query
//   T.get('2/users/1684261210064027668', query, (err, data, response) => {
//     if (err) {
//       console.log('Error:', err);
//     } else {
//       const tweets = data.statuses;
//         console.log('User:', data);
//     }
//   });
// }

// fetchTweets();


// const consumerKey = 'qPP3ysixSRV2TWqyuVqNGPdGd';
// const consumerSecret = 'mtlhIoGn7oh9v0F9OnvocVBxLPet5Hv1XIfANU9b8OlbZnlPuA';
// const accessToken = '1547149737337712643-Z47HNK4UlbgxOOAea0QR2UyJSVplMp';
// const accessTokenSecret = '0spWPKAkLbs3TMjA7ibt3cTiXrM72Gzr2s2atCIBmwDiw';

// const baseURL = 'https://api.twitter.com/2';
// const baccessToken = 'AAAAAAAAAAAAAAAAAAAAAKElpAEAAAAAPvMaCJn5hYYdJN9LT0yWMLVtn3c%3D1zemjBUiYDlXYfVyw7J18LkT2ouOTGYICGNqV0Z7dP6vXgr7CU';
// const headers = {
//   'Authorization': `Bearer ${baccessToken}`
// };

// try {
//     const response = await axios.get(`${baseURL}/tweets?ids=1261326399320715264`, { headers });
//     console.log(response);
//   } catch (error) {
//     console.error('Error fetching tweets:', error.message.data);
//     throw error.response.data;
//   }

                
            }

            if (req.body.Platform.includes("Pinterest")) {
                console.log("-----------Pintrest------------");
                for (let [key, value] of branddata.ptcredential) {
                    let containerParams = new URLSearchParams();
                    var pageid = key;
                    var accesstoken = value;

                    try {
                        const response = await axios.get(
                        `https://api.pinterest.com/v5/boards/`,
                        {
                            headers: {
                            Authorization: `Bearer ${accesstoken}`
                            }
                        }
                        );
                        console.log('Boards retrieved successfully!');
                        console.log(response.data.items[0].id);
                        var board_id = response.data.items[0].id;
                    } catch (error) {
                        console.error('Error retrieving boards:', error.response.data);
                    }
                    try {
                    const response = await axios.post(
                        `https://api.pinterest.com/v5/pins`,
                        {
                            "title": req.body.Content,
                            "description": req.body.Content,
                            "board_id": board_id,
                            "media_source": {
                            "source_type": "image_url",
                            "url": Image
                            }
                        },
                        {
                        headers: {
                            Authorization: `Bearer ${accesstoken}`,
                            'Content-Type': 'application/json'
                        }
                        }
                    );
                    console.log('Post created successfully!');
                    console.log(response.data);
                    } catch (error) {
                    console.error('Error creating the post:', error.response.data);
                    }
                }
            }

            if (req.body.Platform.includes("Linkedin")) {
                // const postContent = {
                //   "author": "urn:li:organization:5515715",
                //   "commentary": "Sample text Post",
                //   "visibility": "PUBLIC",
                //   "distribution": {
                //     "feedDistribution": "MAIN_FEED",
                //     "targetEntities": [],
                //     "thirdPartyDistributionChannels": []
                //   },
                //   "lifecycleState": "PUBLISHED",
                //   "isReshareDisabledByAuthor": false
                // };

                //   try {
                //     const response = await axios.post(
                //       'https://api.linkedin.com/rest/posts',
                //       {
                //   "author": "urn:li:person:5515716",
                //   "commentary": "Sample text Post",
                //   "visibility": "PUBLIC",
                //   "distribution": {
                //     "feedDistribution": "MAIN_FEED",
                //     "targetEntities": [],
                //     "thirdPartyDistributionChannels": []
                //   },
                //   "lifecycleState": "PUBLISHED",
                //   "isReshareDisabledByAuthor": false
                // },
                //       {
                //         headers: {
                //           'Authorization': `Bearer AQXn8n-6zt0JpuEcsyxyhvzdAJvS6LgImYPKybq2UD8MdCo6AofkoHvRKGzcFuX0mFokoDgYkmqeBLIPbPA35EyXc5NPMkftdgPgsBvRX9irvkEXQRh0BS4b-FmKkLRCKv8QXWlYujHl93ZQcKGk2Zn4QJxObwwRn-JM60Ww3naI9JN6vspYICuPfaVGy4X9VUNJt36y0m-oBdgEGakQwj8G1Igl3RfIRgYdU0iHUcDeFyXYSCXDPkao31fiUa4Y1V12HZ5jS_rZkNVGTIO1gsMzr-UInmnnHNf0DSyGij1TasIUFRY75IpduYmK5lhZu085MnhvrEri1TUaqL89uBZsSIHIqQ`,
                //           'Content-Type': 'application/json',
                //           'X-Restli-Protocol-Version': '2.0.0',
                //           'LinkedIn-Version': '202301'
                //         },
                //       }
                //     );

                //     console.log('Successfully posted on LinkedIn:', response.data);
                //   } catch (error) {
                //     console.error('Error posting on LinkedIn:', error);
                //   }
                // console.log("-----------Linkedin------------",branddata.linkedintoken,",,,,,,,,,");
                // try {
                //     await Linekedin.PublishLinkedIn("hello", req.body.Content, 'https://www.instagram.com/dm29phase1/', Image, branddata.linkedinid, '"AQUTZw8zqjT0fveuLgZrU7frtXDsQqKk-5jTIhJlb_Z86W6_RhsE0xP_hmuzkFBSOTfD50OteHeZB0PrXd8EtK6Y0-OQMnChPtOb3wMwxnA6VZMDgz0pJu0oCdfEuAnHlzRN_UP6-3g2NQPsZ3PkgmkoC1NizXqvO0Td7RTDNnj_W8Q8qhsBl6i_wZHFYxymMqZhEWnLHl6hCRPOJUYtTC2pRDvWAoCKAe8YPjLh53l-cQNZifkQDVsITFtzpi6Ju7sTtZqcc7UW52x8hCRyZ_R7avKsaSww7j9jsiI7gjQGe5WYqTLEVB24ZNl4xg-VgXhFyV8Q562_s9BJozH02uZZ2cNdgw"').then((data) => {

                //         linkedinid = data.id;

                //     })
                // }
                // catch (err) {

                //     console.log("error in posting Linekedin post")
                //     console.log(err);
                // }

                const accessToken = 'AQXn8n-6zt0JpuEcsyxyhvzdAJvS6LgImYPKybq2UD8MdCo6AofkoHvRKGzcFuX0mFokoDgYkmqeBLIPbPA35EyXc5NPMkftdgPgsBvRX9irvkEXQRh0BS4b-FmKkLRCKv8QXWlYujHl93ZQcKGk2Zn4QJxObwwRn-JM60Ww3naI9JN6vspYICuPfaVGy4X9VUNJt36y0m-oBdgEGakQwj8G1Igl3RfIRgYdU0iHUcDeFyXYSCXDPkao31fiUa4Y1V12HZ5jS_rZkNVGTIO1gsMzr-UInmnnHNf0DSyGij1TasIUFRY75IpduYmK5lhZu085MnhvrEri1TUaqL89uBZsSIHIqQ';

                const postContent = {
                  author: 'urn:li:person:212672257',
                  lifecycleState: 'PUBLISHED',
                  specificContent: {
                    'com.linkedin.ugc.ShareContent': {
                      shareCommentary: {
                        text: 'Hello from Node.js!',
                      },
                      shareMediaCategory: 'NONE',
                    },
                  },
                  visibility: {
                    'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
                  },
                };                
                axios.post('https://api.linkedin.com/v2/ugcPosts', postContent, {
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                  },
                })
                .then(response => {
                  console.log('Posted successfully:', response.data);
                })
                .catch(error => {
                  console.error('Error posting on LinkedIn:', error);
                });



            }

            if (req.body.Platform.includes('LinkedIn')) {
                try {
                }
                catch (err) {
                    console.log("Linkedin posting error")
                }
            }
            var post = new Post({
                userid: req.body.userid,
                instapostid: instagrampostid,
                facebookpostid: facebookpostid,
                linkedinpostid: linkedinid,
                Createdat: new Date(),
                Scheduledat: new Date(),
                Status: "Live",
                Platform: req.body.Platform,
                Content: Content,
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
            res.json({ msg: "post has been uploaded succesfully", status: 1 });
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
exports.Post_To_All_SocialMedia_Scheduling = async (req, res) => {
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
            msg: "Send All Necessary and valid Details"
        })
    }
}

exports.Show_All_Post = async (req, res) => {
    if (req.body.userid && req.body.userid.match(/^[0-9a-fA-F]{24}$/)) {
        Post.find({
            userid: req.body.userid,
            Brand: req.body.brandId
        }, function (err, result) {
            if (!err) {
                res.json({
                    status: 1,
                    data: result
                });
            }
            else {
                res.send("internal server error");
            }
        })
    }
    else {
        res.json({
            status: 0,
            msg: "Please enter Valid Credentials"
        })
    }
}

exports.Show_Scheduled_Post = async (req, res) => {
    if (req.body.userid && req.body.userid.match(/^[0-9a-fA-F]{24}$/)) {
        Post.find({
            userid: req.body.userid,
            Status: "Scheduled"
        }, function (err, result) {
            if (!err) {
                res.json({
                    status: 1,
                    data: result
                });
            }
            else {
                res.send("internal server error");
            }
        })
    }
    else {
        res.json({
            status: 0,
            msg: "Please enter Valid Credentials"
        })
    }
}

exports.Show_Live_Post = async (req, res) => {
    if (req.body.userid && req.body.userid.match(/^[0-9a-fA-F]{24}$/)) {
        Post.find({
            userid: req.body.userid,
            Status: 'Live'
        }, function (err, result) {


            if (!err) {
                res.json({
                    status: 1,
                    data: result

                });


            }
            else {

                res.send("Internal Server Error");
            }
        })
    }
    else {

        res.json({


            status: 0,
            msg: "Please enter Valid Credentials"

        })
    }

}
async function finalizePost(igUserId, mediaContainerId,accesstoken) {
    console.log(accesstoken);
    let mediaContainerStatusEndpoint = `https://graph.facebook.com/${mediaContainerId}?fields=status_code,status&access_token=${accesstoken}`;
    try {
        let { data: mediaContainerStatus } = await axios.get(mediaContainerStatusEndpoint);
        let { status_code, status } = mediaContainerStatus;
        if (status_code === 'ERROR') {
                //Return here
            console.log('ERROR')
        }
        if (status_code !== 'FINISHED') {
            console.log('FINISHED')
            setTimeout(async () => {
                //Wait For 5seconds and recursively check for the status of the uploaded video
                await finalizePost(igUserId, mediaContainerId);
            }, 5000);
        } else {
            //The video has been published, finalize the post here
            try {
                let mediaPublishResponse = await axios.post(`https://graph.facebook.com/${igUserId}/media_publish?creation_id=${mediaContainerId}&access_token=${targetAccessToken}`);
                //More code omitted
            } catch (e) {

            }
        }
    } catch (e) {
        console.log(e.response.data)
    }
}
exports.Show_