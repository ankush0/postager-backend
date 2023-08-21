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
    const date = new Date(2023, 0, 1, 18, 05, 00);
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
    // console.log(date);
    try {

        var errorstaus = false;
        if (req.body.Platform && req.body.userid.match(/^[0-9a-fA-F]{24}$/) && req.body.Content && req.body.Brand && req.body.Brand.match(/^[0-9a-fA-F]{24}$/)) {
            console.log(req.file);
            var userdata = await user.findById(req.body.userid, function (err, result) {

                if (err) throw err;
            })
            var branddata = await Brand.findById(req.body.Brand, function (err, result) {

                if (err) throw err;
            })


            // var Image = 'https://node.postager.com/images/' + req.file.filename;
            var Image = "https://node.postager.com/images/mypic-1676888953156.jpg";
            // console.log(photopath);
            // console.log(Image);
            // var Instagramid=req.body.Instagramid;
            var Content = req.body.Content;
            var facebookpostid = "";
            var instagrampostid = "";
            var linkedinid = ""

            var currentPoststack = userdata.Posts;



            if (req.body.Platform.includes("LinekedIn")) {

                try {
                    await Linekedin.PublishLinkedIn("hello", req.body.Content, 'https://www.instagram.com/dm29phase1/', Image, branddata.linkedinid, branddata.linkedintoken).then((data) => {

                        linkedinid = data.id;

                    })
                }
                catch (err) {

                    console.log("error in posting Linekedin post")
                    console.log(err);
                }



            }
            if (req.body.Platform.includes("facebook")) {
                console.log("-----------Facebook------------");
                var base = 'https://graph.facebook.com/'

                // try {

                    // console.log(branddata);
                    for (let [key, value] of branddata.facebookcredential) {
                        // console.log(key + " = " + value);
                        var pageid = key;
                        var accesstoken = value;
                        var ping_adr = base + pageid + '/photos?url=' + Image + '&message=' + Content + '&access_token=' + accesstoken;
                        // console.log(ping_adr);
                        const facebookdata = "";
                         // axios
                         //    .post(ping_adr)
                         //    .catch(err => {
                         //        if (err.code == "ERR_BAD_REQUEST") {
                         //            console.log("bad request in Facebook for " + err);
                         //            console.log(err);


                         //        }

                         //    })
                        const FB = require('fb');

                        const ACCESS_TOKEN =  accesstoken;
                        // console.log(Image);
                        FB.setAccessToken(ACCESS_TOKEN);
                        FB.api(
                         `/${pageid}/photos`,
                         'POST',
                         { "message": Content,url: Image },
                         function (response) {
                          if (response.error) {
                           console.log('error occurred: ' , response.error)
                           return;
                          }
                          console.log('successfully posted to page!');
                         }
                        );

                        // try {
                        //     const response = await axios.post(
                        //       `https://graph.facebook.com/${pageid}/videos`,
                        //       {
                        //         file_url: 'https://8bittask.com/may/Video2023-06-07.mp4',
                        //         caption: Content,
                        //         access_token: ACCESS_TOKEN
                        //       }
                        //     );
                        //     console.log('Video posted successfully:', response.data);
                        //   } catch (error) {
                        //     console.error('Error posting video:', error.response.data);
                        //   }

                        // try {
                        //     const response = await axios.post(
                        //       `https://graph.facebook.com/v13.0/${pageid}/video_reels`,
                        //       {
                        //         description: 'CUTE_ANIMALS',
                        //         access_token: ACCESS_TOKEN,
                        //         upload_phase:'start',
                        //         video_id:'204594872479079',
                        //         video_stat:'PUBLISHED'
                        //       }
                        //     );
                        //     console.log('Video start:', response.data);
                        //   } catch (error) {
                        //     console.error('Error posting video:', error.response.data);
                        //   }
                        // const uploadStartUri = `https://graph.facebook.com/${pageid}/video_reels`;
                        // try {
                        //     const response = await axios.post(
                        //       uploadStartUri,
                        //       {
                        //         upload_phase: 'start',
                        //         access_token: ACCESS_TOKEN,
                        //       }
                        //     );
                        //     console.log('id get successfully:', response.data);
                        //   } catch (error) {
                        //     console.error('Error posting video id:', error.response.data);
                        //   }
                        // const initiateUploadResponse = await axios.post(
                        //                               uploadStartUri
                        //                             );

                        // const { video_id, upload_url } = initiateUploadResponse.data;
                        // console.log(response.data.upload_url);
                        //                         const options = {
                        //                             maxBodyLength: Infinity,
                                                    
                        //                           };
                                                  // var upload_url = "https://rupload.facebook.com/video-upload/1464879000949030";
                        // const uploadResponse = await fetch(upload_url, options)
                        //     .then((res) => res.json())
                        //     .catch((err) =>
                        //       console.error(
                        //         "Error uploading binary for Facebook Reels",
                        //         upload_url,
                        //         options,
                        //         err
                        //       )
                        //     );


                        // console.log(options);

                        // try {
                        //     const response = await axios.post(
                        //       upload_url,
                        //       options,
                        //       { 
                        //         headers: {
                        //       Authorization: `OAuth ${ACCESS_TOKEN}`,
                        //       file_url: 'http://8bittask.com/may/Video2023-06-07.mp4',
                        //     } }
                        //     );
                        //     console.log('Video posted successfully:', response.data);
                        //   } catch (error) {
                        //     console.error('Error posting video:', error.response.data);
                        //   }

                        //   const title = "Super Title";
                        //     const description = "Best Reel ever";
                        //     const basePublishReelsURI = `https://graph.facebook.com/${pageid}/video_reels`;

                        //       try {
                        //     const response = await axios.post(
                        //       basePublishReelsURI,
                        //       {
                        //         upload_phase: 'finish',
                        //         access_token: ACCESS_TOKEN,
                        //         video_id:video_id,
                        //         title:'204594872479079',
                        //         video_state:'PUBLISHED',
                        //         description:description
                        //       }
                        //     );
                        //     console.log('Video posted successfully:', response.data);
                        //   } catch (error) {
                        //     console.error('Error posting video:', error.response.data);
                        //   }

                            // const publishReelsResponse = await fetch(basePublishReelsURI, {
                            //     method: "POST",
                            //   })
                            //     .then((res) => res.json())
                            //     .catch((err) =>
                            //       console.error("Error publishing for Facebook Reels:", basePublishReelsURI, err)
                            //     );
                          // const apiUrl = `https://graph.facebook.com/${pageid}/videos?access_token=${ACCESS_TOKEN}`;

                          //   axios
                          //     .post(apiUrl, {
                          //       media_url: 'https://node.postager.com/images/file.mp4',
                          //       caption: caption,
                          //       content_category: 'VIDEO_CREATOR',
                          //     })
                          //     .then((response) => {
                          //       console.log('Reels post created successfully:', response.data);
                          //     })
                          //     .catch((error) => {
                          //       console.error('Error creating Reels post:', error.response.data);
                          //     });
                        // axios
                        //   .post(ping_adr, {
                        //     // headers: {
                        //     //   Authorization: 'Bearer ' + auth.token,
                        //     //   'access-token': auth.token,
                        //     // },
                        //   })
                        //   .then(({ data }) => {
                        //     console.log(data.data);
                        //     facebookdata= data;
                        //   })
                        //   .catch((err) => {
                        //     console.log(err);
                        //   })
                        // if (facebookdata) {

                        //     facebookpostid = facebookdata.data.id;
                        //     console.log("Posted Succesfully on Facebook");
                        // }
                        // else {
                        //     facebookpostid = null;
                        // }

                    }

                // }
                // catch (err) {

                //     console.log("error in getting Facebook post");
                // }


            }

            if (req.body.Platform.includes("Instagram")) {

                        // console.log('Error posting to Instagram');
                // try {
                console.log(branddata);
                
                    for (let [key, value] of branddata.instagramcredential) {
                        console.log(key);
                         let containerParams = new URLSearchParams();
                         var pageid = key;
                        var accesstoken = value;
                        // let mediaContainerUrl = `https://graph.facebook.com/${key}/media`;
                        // containerParams.append('media_type', 'REELS'); //Notice here
                        // containerParams.append('video_url', 'https://8bittask.com/may/347246348_252671940592084_8632416240467003201_n.mp4');
                        // containerParams.append('thumb_offset', 'http://8bittask.com/may/347246348_252671940592084_8632416240467003201_n.mp4');
                        // containerParams.append('access_token', value);
                        // try {
                        //     let mediaContainerResponse = await axios.post(mediaContainerUrl, containerParams);
                        //     let { id: mediaContainerId } = mediaContainerResponse.data;
                        //     let mediaContainerStatusEndpoint = `https://graph.facebook.com/${mediaContainerId}?fields=status_code,status&access_token=${accesstoken}`;
                        //     try {
                        //         let { data: mediaContainerStatus } = await axios.get(mediaContainerStatusEndpoint);
                        //         let { status_code, status } = mediaContainerStatus;
                        //         console.log(status);
                        //         if (status_code === 'ERROR') {
                        //                 //Return here
                        //             console.log('ERROR')
                        //         }

                        //     console.log(mediaContainerResponse.data.id);
                        //         if (status_code === 'FINISHED') {
                        //             console.log('FINISHED 123')
                        //             setTimeout(async () => {
                        //                 //Wait For 5seconds and recursively check for the status of the uploaded video
                        //                 await finalizePost(pageid, mediaContainerId);
                        //             }, 5000);
                        //         } else {
                        //             //The video has been published, finalize the post here
                        //             try {
                        //                 let mediaPublishResponse = await axios.post(`https://graph.facebook.com/${pageid}/media_publish?creation_id=${mediaContainerResponse.data.id}&access_token=${accesstoken}`);
                        //                 //More code omitted
                        //             } catch (e) {

                        //             }
                        //         }
                        //     } catch (e) {
                        //         console.log("hh",e)
                        //     }
                        // } catch (e) {
                        //     console.log('Error posting to Instagram');
                        //     console.log(e);
                        // }
                           try {
                                // Upload the image to Instagram
                                console.log(encodeURIComponent(Image));

                                const uploadResponse = await axios.post(
                                  `https://graph.instagram.com/me/media?image_url=${Image}&access_token=${accesstoken}`
                                );

                                const mediaId = uploadResponse.data.id;
                                // Create a story using the uploaded media
                                // const storyResponse = await axios.post(
                                //   `https://graph.instagram.com/me/stories?access_token=${accesstoken}`,
                                //   {
                                //     media_id: mediaId,
                                //     caption: "caption"
                                //   }
                                // );

                                console.log(mediaId);
                                console.log('Story posted successfully:', uploadResponse.data);
                              } catch (error) {

                                console.error('Error posting to Instagram Story:', error.response.data);
                              }
                        // instagrampostid = await Instagram.postToInsta(key
                        //     , req.body.Content, Image, value
                        // );
                    }
                //     console.log('Video posted successfully:', instagrampostid);
                // }
                // catch (err) {

                //     console.log("Instagram posting error")
                // }
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
                res.json({
                    status: 0,
                    msg: "check your Credentials or internal server error"

                })


            }

        })




        if (userdata) {

            if (userdata.facebookid && userdata.facebooktoken && userdata.Instagramid && userdata.Instagramtoken) {
                // console.log(photopath);

                // var Instagramid=req.body.Instagramid;
                var Content = req.body.Content;



                var currentPoststack = userdata.Posts;

                var Content = req.body.Content;
                var Image = 'http://localhost:4000/images/' + req.file.filename;

                var base = 'https://graph.facebook.com/'

                var post = new Post({

                    userid: req.body.userid,
                    instapostid: "",
                    facebookpostid: "",
                    Createdat: new Date(),
                    Scheduledat: req.body.Date,
                    Status: "Scheduled",
                    Platform: req.body.Platform,
                    Brand: req.body.Brand


                });

                var postsave = await post.save();

                currentPoststack.push(postsave._id);
                console.log(req.body.userid);

                await user.findByIdAndUpdate(req.body.userid, { "Posts": currentPoststack }, function (err, docs) {

                    if (err) {
                        console.log(err)
                    }
                    else {
                        console.log("User Post has been  Updated");
                    }

                });

                const date = new Date(req.body.Date).toJSON();



                if (req.body.Platform.includes("Facebook")) {
                    localStorage.setItem("Facebook" + postsave._id, "Facebook Post Scheduled at " + date + "current timing" + new Date());
                    schedule.scheduleJob(date, async function () {
                        console.log("Facebook executing function has been called")

                        posttoFacebookScheduled(userdata.facebookid, Image, Content, userdata.facebooktoken, postsave._id)


                    })
                }

                if (req.body.Platform.includes("Instagram")) {


                    localStorage.setItem("Instagram" + postsave._id, "Instagram Post Scheduled at " + date + "current timing" + new Date());
                    const job = schedule.scheduleJob(date, function (y) {

                        console.log("Instagram Scheduled function is Executing now");
                        postToInstaScheduled(userdata.Instagramid, Content, Image, userdata.Instagramtoken, postsave._id);

                    });
                }




                res.json({
                    code: 1,
                    msg: "post has been Scheduled  succesfully"
                });


            }
            else {
                res.json({
                    status: 0,
                    msg: "you have not saved valid Credential saved in database"

                })

            }

        }
        else {

            res.json({
                status: 0,
                msg: "check your Credential User does not exist"

            })

        }




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
            userid: req.body.userid
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