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
const Facebook = require("../Controllers/Facebook");

// constructor function to create a storage directory inside our project for all our localStorage setItem.
var localStorage = new LocalStorage('./Localstorage');

exports.Post_To_All_SocialMedia_Immidiatly = async (req, res) => {
    //    var date=new Date('2011-04-11T10:20:30Z')
    // console.log(req.body);
    try {

        var errorstaus = false;
        
        const errors = [];
          
        if (req.body.Platform && req.body.userid.match(/^[0-9a-fA-F]{24}$/) && req.body.Content && req.body.Brand && req.body.Brand.match(/^[0-9a-fA-F]{24}$/)) {
            // console.log(req.file);
            var userdata = await user.findById(req.body.userid, function (err, result) {

                if (err) throw err;
            })
            var branddata = await Brand.findById(req.body.Brand, function (err, result) {

                if (err) throw err;
            })        
            var Image =  process.env.IMG_URL + req?.file?.filename;
            // var Image =  'https://8bittask.com/june/WhatsApp05.mp4';
            // var Image = "https://8bittask.com/june/pinterest.png";
            const fs = require('fs').promises;
            const sharp = require('sharp');
            const BYTES_PER_MB = 1024 ** 2;

            // const Snapchat = require('snapchat');

// Create a new instance of the Snapchat class.
// const snapchat = new Snapchat({
//   username: 'Anvyo',
//   password: '96900659al'
// });

// // Post a new story.
// const story = await snapchat.postStory({
//   media: new Buffer(fs.readFileSync('image.jpg'))
// });

// // Get information about an existing story.
// const storyInfo = await snapchat.getStory(story.id);

            // paste following snippet inside of respective `async` function
            // const fileStats = await fs.stat("uploads/"+req?.file?.filename);
            // const fileSizeInMb = fileStats.size / BYTES_PER_MB;

            // const uploadedImagePath = "uploads/";

            // file_size = await sharp("uploads/"+req?.file?.filename)
            // .resize({ width: 800, height: 600 }) // Change the dimensions as needed
            // .toFile(uploadedImagePath, (err) => {
            //     if (err) {
            //         console.log(err+ ' : Failed to process the image' );
            //     }

            //     // console.log('Image uploaded and resized successfully' );
            //     });
            // console.log("size ",fileSizeInMb);
            // console.log('resize ',file_size)
            var Content = req.body.Content;
            var instagrampostid = "";
            var instagramMSG = "";
            var linkedinid = ""
            var currentPoststack = userdata.Posts;              

            if (req.body.Platform.includes("instagram")) {
                console.log("-----------Instagram------------");
                for (let [key, value] of branddata.instagramcredential) {
                    let containerParams = new URLSearchParams();
                    response = await Instagram.postToInsta(key, req.body.Content, Image, value);
                    if(response.code=='ERR_BAD_REQUEST'){
                        instagramMSG = response.response.data.error.message;
                    }else{
                        instagramMSG = "Posted on Instagram succesfull";
                    }
                    instagrampostid = response;
                    
                }
            }
            var facebookpostid = "";                
            var facebookMSG = "";

            if (req.body.Platform.includes("facebook")) {                
                console.log("-----------Facebook------------");
                for (let [key, value] of branddata.facebookcredential) {
                    // var pageid = key;
                    // var ACCESS_TOKEN = value;
                    response = await Facebook.postToFb(key, req.body.Content, Image, value);
                    // console.log(;
                    if(response?.id){                        
                        facebookpostid = response.id;
                        facebookMSG = "Posted on Facebook succesfull";
                    }else{                        
                        facebookMSG = response.error.message;
                    }
                    
                    // console.log(response);

                    
                }
            }
            console.log("facebookMSG",facebookMSG);

            var pinterestPostID = "";                
            var pinterestPostIDMSG = "";

            if (req.body.Platform.includes("Pinterest")) {
                console.log("-----------Pintrest------------");
                for (let [key, value] of branddata.ptcredential) {
                    let containerParams = new URLSearchParams();
                    var pageid = key;
                    var accesstoken = value;
                    try {
                        const response = await axios.post(
                            `https://api.pinterest.com/v5/pins`,
                            {
                                "title": req.body.title,
                                "description": req.body.Content,
                                "board_id": req.body.board,
                                "media_source": {
                                "source_type": "image_url",
                                "url": Image,
                                "link": req.body.url,
                                }
                            },
                            {
                            headers: {
                                Authorization: `Bearer ${accesstoken}`,
                                'Content-Type': 'application/json'
                            }
                            }
                        );
                            pinterestPostIDMSG = "Posted on Pintrest succesfull";
                        } catch (error) {
                            // console.log(error.response.data);
                            pinterestPostIDMSG = error.response.data.message;
                        }                    
                }
            }
            console.log("pinterestPostID",pinterestPostID);

            var twitterPostID = "";                
            var twitterPostIDMSG = "";

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


                    try {
                            
                            // You can use media IDs generated by v1 API to send medias!
                            const mediaId = await client.v1.uploadMedia('./uploads/'+req?.file?.filename);
                            const response = await client.v2.tweetThread([
                            // 'Hello, lets talk about Twitter!',
                            { text: req.body.Content, media: { media_ids: [mediaId] } },
                            // 'This thread is automatically made with twitter-api-v2 :D',
                            ]);
                            twitterPostIDMSG = "Posted on Twitter succesfull";
                            twitterPostID = response[0].data.id;
                        } catch (error) {
                            twitterPostIDMSG = error.data.error;
                            // pinterestPostIDMSG = error.response.data.message;
                        }  
                    

                        // try {
                            
                        //     // You can use media IDs generated by v1 API to send medias!
                        //     const mediaId = await client.v1.uploadMedia('uploads/WhatsApp05.mp4','./uploads/'+req?.file?.filename);
                        //     const response = await client.v2.tweetThread([
                        //     // 'Hello, lets talk about Twitter!',
                        //     { text: req.body.Content, media: { media_ids: [mediaId] } },
                        //     // 'This thread is automatically made with twitter-api-v2 :D',
                        //     ]);
                        //     twitterPostIDMSG = "Posted on Twitter succesfull";
                        //     twitterPostID = response[0].data.id;
                        // } catch (error) {
                        //     twitterPostIDMSG = error.data.error;
                        //     // pinterestPostIDMSG = error.response.data.message;
                        // }  

                    
                }else{
                    const { data: createdTweet } = await client.v2.tweet(req.body.Content);
                    console.log('Tweet', createdTweet.id, ':', createdTweet.text);
                }
            }

            if (req.body.Platform.includes("Linkedinn")) {
                console.log("-----------Linkedin------------");
                for (let [key, value] of branddata.linkdinCredential) {
                    console.log(value);
                    let containerParams = new URLSearchParams();
                    var pageid = key;
                    var accessToken = value;
                    try {
                        const response = await axios.get('https://api.linkedin.com/v2/organizations', {
                            headers: {
                                'Authorization': `Bearer ${accessToken}`
                            }
                        });
                
                        const organizationId = response.data.elements[0].id; // Assuming you want the first organization's ID
                        res.send(`Organization ID: ${organizationId}`);
                    } catch (error) {
                        console.error(error);
                        res.status(500).send('Error fetching organization ID');
                    }
                    
//   const postUrl = 'https://api.linkedin.com/v2/me';
                      
//   const headers = {
//     'Authorization': `Bearer ${accessToken}`,
//     'Content-Type': 'application/json',
//   };

  
//   try {
//     const response = await axios.get(postUrl, { headers });
//     console.log('Posted to LinkedIn:', response.data);
//   } catch (error) {
//     console.error(error);
//   }

//   Posted to LinkedIn: {
//     localizedLastName: 'A',
//     profilePicture: { displayImage: 'urn:li:digitalmediaAsset:C4D03AQGrcjPfsctuTw' },
//     firstName: {
//       localized: { en_US: 'Hero' },
//       preferredLocale: { country: 'US', language: 'en' }
//     },
//     vanityName: 'hero-a-b865391ba',
//     lastName: {
//       localized: { en_US: 'A' },
//       preferredLocale: { country: 'US', language: 'en' }
//     },
//     localizedHeadline: 'PHP Developer at SSAK Solution Services - India',
//     id: 'EUabXZ8XKN',
//     headline: {
//       localized: { en_US: 'PHP Developer at SSAK Solution Services - India' },
//       preferredLocale: { country: 'US', language: 'en' }
//     },
//     localizedFirstName: 'Hero'
//   }
// const postContent = {
                    //     author: 'urn:li:person:EUabXZ8XKN', // Your LinkedIn member ID
                    //     lifecycleState: 'PUBLISHED',
                    //     specificContent: {
                    //       'com.linkedin.ugc.ShareContent': {
                    //         shareCommentary: {
                    //           text: req.body.Content,
                    //         },
                    //         shareMediaCategory: 'NONE',
                    //       },
                    //     },
                    //     visibility: {
                    //       'com.linkedin.ugc.MemberNetworkVisibility': 'CONNECTIONS',
                    //     },
                    //   };
                      
                    //   const postUrl = 'https://api.linkedin.com/v2/me';
                      
                    //   const headers = {
                    //     'Authorization': `Bearer ${accessToken}`,
                    //     'Content-Type': 'application/json',
                    //   };

                      
                    //   try {
                    //     const response = await axios.get(postUrl, { headers });
                    //     console.log('Posted to LinkedIn:', response.data);
                    //   } catch (error) {
                    //     console.error(error);
                    //   }
                      
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
            res.json({ msg: instagramMSG+","+facebookMSG+","+pinterestPostIDMSG+","+twitterPostIDMSG, status: 1 });
            
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