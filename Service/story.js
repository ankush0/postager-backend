var user=require("../Database/Connection").user;
var Post = require("../Database/Connection").Posts
const Brand = require('../Database/Connection').Brands;
const axios = require('axios');
const {getGfsBucket} = require('../Database/Connection');
async function updateBrandIndb(brandId,date,res,media_id,platformArray ,fb_post_id,insta_post_id ,post_type){ 
  let formattedDate
  let formattedTime
  if(date!=undefined){
    const newdate = new Date(date);
    const unixTimestamp = Math.floor(newdate.getTime() / 1000);
    const date = new Date(unixTimestamp * 1000); 
    

    const dateFormatter = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });
formattedDate = dateFormatter.format(date);
    

    const timeFormatter = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
 formattedTime = timeFormatter.format(date);
    
    console.log(`Date: ${formattedDate}`);
    console.log(`Time: ${formattedTime}`);
    const response=await Brand.findByIdAndUpdate
    (brandId,     {
     $push: {
      'scheduledMedia.media_id':  media_id ,
      'scheduledMedia.platform':platformArray,
      'scheduledMedia.time' :[formattedDate,formattedTime],
     }
 },
 { new: true } 
)
if(response){
 console.log("media uplaoded succesfully");
 res.json({
     status: 1,
     msg: "media uploaded successfully"
 })}
 else {
   res.json({
     status: 0,
     msg: "error in Server"
 })
 }
    
}
else{
    const date = new Date(); 

    const dateFormatter = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });
   formattedDate = dateFormatter.format(date);
    
    
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
formattedTime = timeFormatter.format(date);
    
    console.log(`Date: ${formattedDate}`); 
    console.log(`Time: ${formattedTime}`); 
    const response=await Brand.findByIdAndUpdate
    (brandId,     {
     $push: {
         'media.media_id': media_id,
         'media.platform': platformArray,
         'media.time' :[formattedDate,formattedTime],
         "media.published_posts_id":             {
           "fb_post_id":fb_post_id,
           "insta_post_id":insta_post_id,
           "post_type": post_type
       }
     }
 },
 { new: true } 
)
if(response){
 console.log("media uplaoded succesfully");
 res.json({
     status: 1,
     msg: "media uploaded successfully"
 })}
 else {
   res.json({
     status: 0,
     msg: "error in Server"
 })
 }
}
      
}



const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

async function waitForMediaReady(containerId,accessToken) {
  const maxRetries = 10
  const delay = 10000
   for (let i = 0; i < maxRetries; i++) {
     const response = await axios.get(`https://graph.facebook.com/v17.0/${containerId}?fields=status_code&access_token=${accessToken}`);
     const status = response.data.status_code;
     if (status === 'FINISHED') {
       console.log('Media is ready to be published.');
       return true;
     }
     console.log(`Media not ready, retrying in ${delay / 1000} seconds...`);
     await new Promise(resolve => setTimeout(resolve, delay));
   }
   throw new Error('Media processing timed out.');
 }

exports.Story_To_All_SocialMedia_Immediatly = async (req, res) => {
  console.log("req.body", req.body.storyData);
const media_id=[];
const fb_post_id=[];
const schedule_id=[]
const insta_post_id=[];
const platformArray=[]
const gfsBucket = await getGfsBucket();
req.body.Platform.forEach(element => {
  if(element.isChecked){
      platformArray.push(element.platform);
  }})
for (let i = 0; i < req.body.storyData.length; i++) {
  const base64Data =  req.body.storyData[i].data.split(",")[1];
 const as= await new Promise((resolve, reject) => {
  const uploadStream = gfsBucket.openUploadStream(req.body.brandId, {
metadata:{
  type:req.body.storyData[i].type
}
  });

  uploadStream.on("finish", () => {
      console.log("File successfully uploaded with ID:", uploadStream.id);
      if(req.body.storyData[i].type=="image")
      media_id.push({id:uploadStream.id, type:req.body.storyData[i].type});
      else media_id.push({id:uploadStream.id, type:req.body.storyData[i].type,thumbnail:req.body.storyData[i].thumbnail});
      resolve(uploadStream.id);
  });

  uploadStream.on("error", (err) => {
      console.error("Error uploading file:", err);
      reject(err);
  });

 
  uploadStream.end(Buffer.from(base64Data, "base64"));

 
});


}
    try {
        const brandData = await Brand.findById(req.body.Brand);  
        const instaId = brandData.instagramcredential.values().next().value;


if(req.body.Platform[1].isChecked){ //for instagram
  for (let i = 0; i < req.body.storyData.length; i++) {

      const s3Client = new S3Client({
          endpoint: "https://nyc3.digitaloceanspaces.com", // Replace with your region's endpoint
          region: "nyc3", // Replace with your region
          credentials: {
            accessKeyId: "DO00EVVGXTJMEVL3H9Y9", // Replace with your Spaces access key
            secretAccessKey: "3mGfu03NStDq9IlaXaVBoISUmpa/7xm7BiSvc4H0ir4", // Replace with your Spaces secret key
          },
        });
        const base64Data =  req.body.storyData[i].data.split(",")[1];
        const buffer = Buffer.from(base64Data, "base64");
  
if(req.body.storyData[i].type=="image"){
  const uploadParams = {
    Bucket: "postager2",
    Key: `${instaId}${i}.jpg`,
    Body: buffer,
    ACL: "public-read",
    ContentType: "image/jpeg", 
  };
  const command = new PutObjectCommand(uploadParams);
  const resultUpload = await s3Client.send(command);
  const publicUrl =
  `https://postager2.nyc3.digitaloceanspaces.com/${instaId}${i}.jpg`;
const res=await axios.post(`https://graph.facebook.com/v21.0/${instaId}/media`,
  {
    image_url:publicUrl,
media_type:'STORIES',
access_token:brandData.fbuseraccesstoken
  })
  await waitForMediaReady(res.data.id,brandData.fbuseraccesstoken);
  if( req.body.date==undefined){
  const res1=await axios.post(`https://graph.facebook.com/v21.0/${instaId}/media_publish`,
  {
    creation_id:res.data.id,
access_token:brandData.fbuseraccesstoken
  })
  console.log("image story publish result", res1.data);

  }
  else schedule_id.push(res.data.id)
}

  else{ //for video
    console.log("video reached");
    const uploadParams = {
      Bucket: "postager2",
      Key: `${instaId}${i}.mp4`,
      Body: buffer,
      ACL: "public-read",
      ContentType: "video/mp4", 
    };
    const command = new PutObjectCommand(uploadParams);
    const resultUpload = await s3Client.send(command);
    const publicUrl =`https://postager2.nyc3.digitaloceanspaces.com/${instaId}${i}.mp4`;
  const res=await axios.post(`https://graph.facebook.com/v21.0/${instaId}/media`,
    {
      video_url:publicUrl,
  media_type:'STORIES',
  access_token:brandData.fbuseraccesstoken
    })
    await waitForMediaReady(res.data.id,brandData.fbuseraccesstoken);
    if(req.body.date==undefined){
    const res1=await axios.post(`https://graph.facebook.com/v21.0/${instaId}/media_publish`,
    {
      creation_id:res.data.id,
  access_token:brandData.fbuseraccesstoken
    })
    console.log("video story publish result", res1.data);

  }
  else schedule_id.push(res.data.id)
}
}
}        
if(req.body.Platform[0].isChecked){ //for facebook
  const { facebookcredential } = brandData;
        const  pageid = facebookcredential.keys().next().value;
        const Content = req.body.Content;
        const accesstoken= facebookcredential.values().next().value;
    for (let i = 0; i < req.body.storyData.length; i++) {
        const s3Client = new S3Client({
            endpoint: "https://nyc3.digitaloceanspaces.com", // Replace with your region's endpoint
            region: "nyc3", // Replace with your region
            credentials: {
              accessKeyId: "DO00EVVGXTJMEVL3H9Y9", // Replace with your Spaces access key
              secretAccessKey: "3mGfu03NStDq9IlaXaVBoISUmpa/7xm7BiSvc4H0ir4", // Replace with your Spaces secret key
            },
          });
      
          const buffer = Buffer.from(
            req.body.storyData[i].data.replace(/^data:image\/jpeg;base64,/, ""),
            "base64"
          );
          const uploadParams = {
            Bucket: "postager2",
            Key: `${pageid}.jpg`,
            Body: buffer,
            ACL: "public-read", // Make it publicly accessible
            ContentType: "image/jpeg", // Or appropriate MIME type for the image
          };
          const command = new PutObjectCommand(uploadParams);
          const resultUpload = await s3Client.send(command);
         
  if(req.body.storyData[i].type=="image"){
        const publicUrl =
          `https://postager2.nyc3.digitaloceanspaces.com/${pageid}.jpg`;
        console.log("publicurl", accesstoken);
        const resultOfUnpublishedPhoto = await axios.post(
          `https://graph.facebook.com/v20.0/${pageid}/photos?`,
          {
            access_token: accesstoken,
            url: publicUrl,
            caption: Content,
            published: false // Do not post immediately
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        console.log("result", resultOfUnpublishedPhoto);

       
        if(req.body.date!=undefined){
          console.log("reached");
          const newdate = new Date(req.body.date);
          const unixTimestamp = Math.floor(newdate.getTime() / 1000);
       const resultOfPublishedStory= await axios.post(`https://graph.facebook.com/v20.0/${pageid}/photo_stories`, {
            photo_id:resultOfUnpublishedPhoto.data.id,
            photo_state:'SCHEDULED',
            scheduled_publish_time:unixTimestamp,
          
          
        }, {
          params: {
            access_token: accesstoken 
          }
        })
        console.log("resultOfPublishedStory of scheduled", resultOfPublishedStory.data);
        fb_post_id.push(resultOfPublishedStory.data.post_id)
      }
      else{
  
     const resultOfPublishedStory= await axios.post(`https://graph.facebook.com/v21.0/${pageid}/photo_stories`, {
          photo_id:resultOfUnpublishedPhoto.data.id,
      }, {
        params: {
          access_token: accesstoken 
        }
      })
      console.log("resultOfPublishedStory", resultOfPublishedStory.data.post_id);
      fb_post_id.push(resultOfPublishedStory.data.post_id)
      }
      }
    else {
      const newdate = new Date(req.body.date);
      const unixTimestamp = Math.floor(newdate.getTime() / 1000);
// POST request to start the video upload
const resultFromVideoStoryUpload=await axios.post(`https://graph.facebook.com/v21.0/${pageid}/video_stories`,{
      upload_phase: 'start',
 
    
}, {
  params: {
    access_token: accesstoken 
  }
})

const base64Video = req.body.storyData[i].data
const base64Data = base64Video.split(',')[1];
const buffer = Buffer.from(base64Data, 'base64');

const VIDEO_ID = resultFromVideoStoryUpload.data.video_id;
const headers = {
    'Authorization': `OAuth ${accesstoken}`,
    'Content-Type': 'application/octet-stream',
    'offset': 0, 
    'file_size': buffer.length,
    'published':false,
  };
     const url = `https://rupload.facebook.com/video-upload/v21.0/${VIDEO_ID}`; 
    const resu= await axios.post(url, buffer, { headers });
    console.log("resu", resu.data);

    const response = await axios.post(`https://graph.facebook.com/v21.0/${pageid}/video_stories`, {
        video_id: VIDEO_ID,
        upload_phase: 'finish',
        access_token: accesstoken ,
        video_state:'SCHEDULED',
        scheduled_publish_time:unixTimestamp,
      
      });
      console.log("response from story video", response.data.post_id);
      fb_post_id.push(response.data.post_id)


    }


    }
}
await updateBrandIndb(req.body.Brand,req.body.date,res,media_id,platformArray,fb_post_id,insta_post_id,req.body.storyData.length>1 ? "story_carousel" : "image");     
 
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

exports.Show_