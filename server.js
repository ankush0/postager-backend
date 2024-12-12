const express = require("express");
const parser = require("body-parser");
const User=require("./Database/Connection").user
const multer = require("multer");
const { getGfsBucket, Schedule } = require("./Database/Connection");
const app = new express();
const cors = require("cors");
// const cron = require("node-cron");
const schedule = require("./scheduler");
const startCronJob = require("./scheduler").startCronJob;
const cookieParser = require("cookie-parser");
const { ObjectId } = require("mongodb");
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const mg = mailgun.client({username: 'api', key:'5ceeac136c83a54cc40730eccac92986-f55d7446-627b498c'});
const fs = require("fs");
var LoginRoutes = require("./Router/Route");
const path = require("path");

const { default: axios } = require("axios");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { type } = require("os");

const Brand = require("./Database/Connection").Brands;

console.log(new Date());
app.get("/date", (req, res) => {
  res.send(new Date());
});

require("dotenv").config();
startCronJob();
app.use(cors());
app.options("*", cors());
app.use(cookieParser());
app.use(parser.json({ limit: "100mb" }));
app.use(
  parser.urlencoded({
    limit: "100mb",
    extended: true,
  })
);

let port = process.env.PORT;
if (port == null || port == "") {
  port = 4000;
}
app.listen(port);
app.use("/images", express.static("uploads"));
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const maxSize = 10 * 1000 * 1000;

var upload = multer({
  storage: storage,
  limits: { fileSize: 100000000000 },
  fileFilter: function (req, file, cb) {
    var filetypes = /jpeg|jpg|png|mp4/;
    var mimetype = filetypes.test(file.mimetype);
    var extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(
      "Error: File upload only supports the following filetypes - " + filetypes
    );
  },
}).single("mypic");

// app.post("/inviteTeam", async (req, res) => {
//   const inviteLink = `http://localhost:3000/invite?token=${req.body.brandId} ${req.body.email}`;
//   console.log("req.body", req.body,inviteLink);
//   mg.messages.create('sandboxf79d6ff37fac43dc9891e635ff0e4685.mailgun.org', {
//   	from: "Postager <mailgun@sandboxf79d6ff37fac43dc9891e635ff0e4685.mailgun.org>",
//   	to: [req.body.email],
//   	subject: "Invitation Link",
//   	text: "Testing some Mailgun awesomeness!",
//   	html: `
//      <p> Invitation to join their app!</p>
//       <p>
//         <a href="${inviteLink}" 
//            style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
//            Accept Invite
//         </a>
//       </p>
//     `,
//   })
//   .then(msg => console.log("mail message",msg)) // logs response data
//   .catch(err => console.log(err)); // logs any error
 
// });
app.post("/updateTeam", async (req, res) => {
  console.log("req.body", req.body.data.split(" ")[1]);
  const invitedUserEmail=req.body.data.split(" ")[1]
  const invitedUserDoc=await User.findOne({email:invitedUserEmail});
  console.log("invitedUserDoc",invitedUserDoc);
  const result=await User.findByIdAndUpdate(invitedUserDoc._id,{
    $push:{
      "invitedBy":req.body.data.split(" ")[0]
    }
  });

  // const document = await
  // Brand.findByIdAndUpdate(
  //   { _id:
  //     req.body.brandId },
  //   {
  //     $set: {
  //       "team": req.body.team,
  //     },
  //   },
  //   { new: true }

  // );
  // console.log("document", document);
  // if (document) {
  //   res.json({ status: 1, msg: "team updated successfully" });
  // }
  // else {
  //   res.json({ status: 0, msg: "error in server" });
  // }
});

app.post("/deleteFromFacebookScheduled", async function (req, res) {

  const gridfs = await getGfsBucket();
  let deleteIndex;
  const brand = await Brand.findOne({ _id: req.body.brandId });
  const doc = brand.scheduledMedia.media_id;
  const scheduledPostId = [];
  const updatedMediaArray = [];
  let isEmpty = false;

  for (let i = 0; i < doc.length; i++) {
    const arr = [];
    for (let j = 0; j < doc[i].length; j++) {
      if (!req.body.media_id.includes(doc[i][j].toString())) {
        arr.push(doc[i][j]);
      } else if (doc[i].length == req.body.media_id.length) {
        deleteIndex = i;
      }
    }
    if (arr.length == 0) isEmpty = true;
    const fb_post_id = [];
    for (
      let k = 0;
      k < brand.scheduledMedia.scheduledPostId[i].fb_post_id.length;
      k++
    ) {
      if (
        !req.body.postId.includes(
          brand.scheduledMedia.scheduledPostId[i].fb_post_id[k]
        )
      ) {
        fb_post_id.push(brand.scheduledMedia.scheduledPostId[i].fb_post_id[k]);
        console.log("fb_post_id", fb_post_id);
      }
    }
    if (fb_post_id.length != 0) {
      scheduledPostId.push({
        fb_post_id: fb_post_id,
        insta_post_id: brand.scheduledMedia.scheduledPostId[i].insta_post_id,
        post_type: brand.scheduledMedia.scheduledPostId[i].post_type,
      });
    }

    if (arr.length != 0) updatedMediaArray.push(arr);
  }

  const platformArray = [];
  const timeArray = [];
  if (isEmpty) {
    console.log("isEmpty", isEmpty);
    for (let i = 0; i < brand.scheduledMedia.platform.length; i++) {
      if (i != deleteIndex) {
        platformArray.push(brand.scheduledMedia.platform[i]);
        timeArray.push(brand.scheduledMedia.time[i]);
      } else console.log("inckuded");
    }
    for (let i = 0; i < req.body.media_id.length; i++) {
      // await gridfs.delete(req.body.media_id[i]);
    }
  } else {
    for (let i = 0; i < brand.scheduledMedia.platform.length; i++) {
      const insidePlatformArray = [];
      for (let j = 0; j < brand.scheduledMedia.platform[i].length; j++) {
        if (
          !(brand.scheduledMedia.platform[i] == "facebook" && i == deleteIndex)
        ) {
          insidePlatformArray.push(brand.scheduledMedia.platform[i][j]);
        }
        platformArray.push(insidePlatformArray);
        timeArray.push(brand.scheduledMedia.time[i]);
      }
    }
  }
  console.log(
    "updatedMediaid",
    updatedMediaArray,
    deleteIndex,
    scheduledPostId,
    platformArray,
    timeArray
  );

  if (deleteIndex != undefined) {
    await Brand.findByIdAndUpdate(
      { _id: req.body.brandId },
      {
        $set: {
          "scheduledMedia.media_id": updatedMediaArray,
          "scheduledMedia.platform": platformArray,
          "scheduledMedia.time": timeArray,
          "scheduledMedia.scheduledPostId": scheduledPostId,
        },
      }
    );
  } else {
    await Brand.findByIdAndUpdate(
      { _id: req.body.brandId },
      {
        $set: {
          "scheduledMedia.media_id": updatedMediaArray,
          "scheduledMedia.scheduledPostId": scheduledPostId,
        },
      }
    );
  }

  // const doc=await Brand .findById(req.body.brandId);
  const access_token = brand.facebookcredential.values().next().value;

  console.log("access_token during deletion", access_token);
  const result = await axios.post(
    `https://graph.facebook.com/v21.0/${req.body.postId}`,
    {
      access_token: access_token,
    }
  );
  if (result) {
    res.json({ status: 1, msg: "post deleted successfully" });
  } else {
    res.json({ status: 0, msg: "error in server" });
  }
});

app.post("/deleteFromFacebook", async (req, res) => {
  const gridfs = await getGfsBucket();
  let deleteIndex;
  const brand = await Brand.findOne({ _id: req.body.brandId });
  const doc = brand.media.media_id;
  const published_posts_id = [];

  const updatedMediaArray = [];
  for (let i = 0; i < doc.length; i++) {
    const arr = [];
    for (let j = 0; j < doc[i].length; j++) {
      if (!req.body.media_id.includes(doc[i][j].toString())) {
        arr.push(doc[i][j]);
      } else if (doc[i].length == req.body.media_id.length) {
        deleteIndex = i;
      }
    }

    const fb_post_id = [];
    for (
      let k = 0;
      k < brand.media.published_posts_id[i].fb_post_id.length;
      k++
    ) {
      if (
        !req.body.postId.includes(
          brand.media.published_posts_id[i].fb_post_id[k]
        )
      ) {
        fb_post_id.push(brand.media.published_posts_id[i].fb_post_id[k]);
        console.log("fb_post_id", fb_post_id);
      }
    }

    if (fb_post_id.length != 0) {
      published_posts_id.push({
        fb_post_id: fb_post_id,
        insta_post_id: brand.media.published_posts_id[i].insta_post_id,
        post_type: brand.media.published_posts_id[i].post_type,
      });
    }

    if (arr.length != 0) updatedMediaArray.push(arr);
  }
  const platformArray = [];
  const timeArray = [];
  if (updatedMediaArray.length != 0) {
    for (let i = 0; i < brand.media.platform.length; i++) {
      for (let j = 0; j < brand.media.platform[i].length; j++) {
        if (i != deleteIndex) {
          platformArray.push(brand.media.platform[i]);
          timeArray.push(brand.media.time[i]);
        }
      }
    }
  }
  console.log(
    "updatedMediaid",
    updatedMediaArray,
    deleteIndex,
    published_posts_id,
    platformArray,
    timeArray
  );
  if (deleteIndex != undefined) {
    await Brand.findByIdAndUpdate(
      { _id: req.body.brandId },
      {
        $set: {
          "media.media_id": updatedMediaArray,
          "media.platform": platformArray,
          "media.time": timeArray,
          "media.published_posts_id": published_posts_id,
        },
      }
    );
  } else {
    await Brand.findByIdAndUpdate(
      { _id: req.body.brandId },
      {
        $set: {
          "media.media_id": updatedMediaArray,
          "media.published_posts_id": published_posts_id,
        },
      }
    );
  }

  // const doc=await Brand .findById(req.body.brandId);
  const access_token = brand.facebookcredential.values().next().value;
  console.log("access_token during deletion", access_token);
  const result = await axios.post(
    `https://graph.facebook.com/v20.0/${req.body.postId}`,
    {
      access_token: access_token,
    }
  );
  if (result) {
    res.json({ status: 1, msg: "post deleted successfully" });
  } else {
    res.json({ status: 0, msg: "error in server" });
  }
  for (let i = 0; i < doc.media.media_id.length; i++) {
    await gridfs.delete(ObjectId(req.body.media_id[i]));
  }
  Brand.deleteMany({ brandId: req.body.brandId });
});
//for fetching social id's from db
app.post("/api/v1/getSocialId", async (req, res) => {
  console.log("req.body", req.body);
  const document = await Brand.findById(req.body.brandId);
  console.log("document", document);
  res.json({ data: document });
});
//upload for video
const uploadVideo = multer({
  dest: "uploads/",
  limits: { fieldSize: 100000000000 },
});
async function waitForMediaReady(containerId, accessToken) {
  const maxRetries = 10;
  const delay = 20000;
  for (let i = 0; i < maxRetries; i++) {
    const response = await axios.get(
      `https://graph.facebook.com/v17.0/${containerId}?fields=status_code&access_token=${accessToken}`
    );
    const status = response.data.status_code;
    if (status === "FINISHED") {
      console.log("Media is ready to be published.");
      return true;
    }
    console.log(`Media not ready, retrying in ${delay / 1000} seconds...`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  throw new Error("Media processing timed out.");
}
async function updateBrandIndb(
  brandId,
  date,
  res,
  media_id,
  platformArray,
  fb_post_id,
  insta_post_id,
  post_type,
  schedule_id
) {
  let formattedDate;
  let formattedTime;
  if (date != undefined) {
    const newdate = new Date(date);
    const unixTimestamp = Math.floor(newdate.getTime() / 1000);
    const convertedDate = new Date(unixTimestamp * 1000);

    const dateFormatter = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    formattedDate = dateFormatter.format(convertedDate);

    const timeFormatter = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
    formattedTime = timeFormatter.format(convertedDate);

    console.log(`Date: ${formattedDate}`);
    console.log(`Time: ${formattedTime}`);

    const response = await Brand.findByIdAndUpdate(
      brandId,
      {
        $push: {
          "scheduledMedia.media_id": media_id,
          "scheduledMedia.platform": platformArray,
          "scheduledMedia.time": [formattedDate, formattedTime],
          "scheduledMedia.scheduledPostId": {
            fb_post_id: fb_post_id,
            insta_post_id: schedule_id,
            post_type: post_type,
          },
        },
      },
      { new: true }
    );

    console.log(response);
    if (response) {
      console.log("media uplaoded succesfully");
      res.json({
        status: 1,
        msg: "media uploaded successfully",
      });
    } else {
      res.json({
        status: 0,
        msg: "error in Server",
      });
    }
  } else {
    const date = new Date();

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

    const response = await Brand.findByIdAndUpdate(
      brandId,
      {
        $push: {
          "media.media_id": media_id,
          "media.platform": platformArray,
          "media.time": [formattedDate, formattedTime],
          "media.published_posts_id": {
            fb_post_id: fb_post_id,
            insta_post_id: insta_post_id,
            post_type: post_type,
          },
        },
      },
      { new: true }
    );
    if (response) {
      console.log("media uplaoded succesfully");
      res.json({
        status: 1,
        msg: "media uploaded successfully",
      });
    } else {
      res.json({
        status: 0,
        msg: "error in Server",
      });
    }
  }
}
app.post("/fetchMediaHistory", async (req, res) => {
  const document = await Brand.findById(req.body.brandId);
  const mediaArray = [];
  const updatedMediaArray = [];
  console.log("document in history", document);
  for (let i = 0; i < document.media.media_id.length; i++) {
    const arr = [];
    for (let j = 0; j < document.media.media_id[i].length; j++) {
     console.log("looping...")
      if(document.media.media_id[i][j].type=="video") arr.push({type:"video"});
      else {
      const result = await getMediafromDbHistory(
        document.media.media_id[i][j]
      );
      
      arr.push(result);
    }
    }
    mediaArray.push({
      media: arr,
      platform: document.media.platform[i],
      time: document.media.time[i][1],
      date: document.media.time[i][0],
      published_posts_id: document.media.published_posts_id[i],
      media_id: document.media.media_id[i],
    });
    console.log("mediaArray", mediaArray);
  }
  console.log("raeched");
  res.json({ data: mediaArray });

});
app.post("/fetchScheduledMedia", async (req, res) => {
  const document = await Brand.findById(req.body.brandId);
  const mediaArray = [];
  const updatedMediaArray = [];
  console.log("document in history", document);
  for (let i = 0; i < document.scheduledMedia.media_id.length; i++) {
    const arr = [];
    for (let j = 0; j < document.scheduledMedia.media_id[i].length; j++) {
      console.log("media_id", document.scheduledMedia.media_id[i][j]);
      if(document.media.media_id[i][j].type=="video") arr.push({type:"video"});
      else{
      const result = await getMediafromDbHistory(
        document.scheduledMedia.media_id[i][j]
      );
      console.log("result", result);
      arr.push(result);
    }
    }
    mediaArray.push({
      media: arr,
      platform: document.scheduledMedia.platform[i],
      time: document.scheduledMedia.time[i][1],
      date: document.scheduledMedia.time[i][0],
      scheduledPostId: document.scheduledMedia.scheduledPostId[i],
      media_id: document.scheduledMedia.media_id[i],
    });
  }
  res.json({ data: mediaArray });
});

async function getMediafromDbHistory(fileId) {
  try {
    //console.log("media_id", fileId);
    const gfsBucket = await getGfsBucket();

    //console.log("fileId", fileId);
    // Check if file exists
    const files = await gfsBucket.find({ _id: fileId }).toArray();
    console.log("returned", );
    if(files[0].metadata.type=="video"){
      return({
      type: files[0].metadata.type,
    });
  
}
    //  console.log("files", files);
    if (!files || files.length === 0) {
      return res.status(404).send("File not found");
    }
    return new Promise((resolve, reject) => {
      // Read the file as a buffer
      const chunks = [];
      const downloadStream = gfsBucket.openDownloadStream(fileId);

      downloadStream.on("data", (chunk) => {
        chunks.push(chunk);
      });

      downloadStream.on("end", () => {
        const fileBuffer = Buffer.concat(chunks);
        const base64String = fileBuffer.toString("base64");

        //console.log("base64String", base64String);
        // Send Base64 string as response

        resolve({
          data: base64String,
          type: files[0].metadata.type,
        });
      });

      downloadStream.on("error", (err) => {
        console.error("Error occurred while reading file:", err);
        // res.status(500).send("An error occurred while reading the file.");
        reject(err);
      });
    });
  } catch (error) {
    console.error("Error fetching file from database:", error);
    // res.status(500).send("An error occurred while retrieving the file.");
  }
}


app.get("/videoStream/:id", async (req, res) => {
  console.log("videoStream");
  try {
    
    const gfsBucket = await getGfsBucket(); // Replace with your GridFS bucket instance
console.log("gfsBucket",req.params.id);
    // Get file metadata
    const file = await gfsBucket.find({ _id: new ObjectId(req.params.id) }).next();
if (!file) {
  console.log("retuend from file not found");
  return res.status(404).send("File not found");

}

    const range = req.headers.range;
    if (!range) {
      return res.status(416).send("Requires Range header");
    }

    // Get video file size and parse range
    const videoSize = file.length;
    const CHUNK_SIZE = 1048576; // 1MB
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

    // Headers
    const contentLength = end - start + 1;
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": "video/mp4",
    });

    // Stream video chunk
    const downloadStream = gfsBucket.openDownloadStream( new ObjectId(req.params.id), {
      start,
      end: end + 1,
    });
    downloadStream.pipe(res);

    downloadStream.on("error", (err) => {
      console.error("Stream error:", err);
      res.status(500).send("Error streaming video");
    });
  } catch (error) {
    console.error("Error fetching video:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/uploadVideo", uploadVideo.array("video"), async (req, res) => {
  const videoArray = JSON.parse(req.body.video);
  const Platform = JSON.parse(req.body.Platform);
  const media_id = [];
  const scheduledId = [];
  const fb_post_id = [];
  const insta_post_id = [];
  const platformArray = [];

  try {
    //for media uplaod to db
    const gfsBucket = await getGfsBucket();

    for (let i = 0; i < videoArray.length; i++) {
      const base64Data = videoArray[i].data.replace(
        /^data:video\/mp4;base64,/,
        ""
      );
      const as = await new Promise((resolve, reject) => {
        const uploadStream = gfsBucket.openUploadStream(req.body.brandId, {
          metadata: {
            type: "video",
            chunkSizeBytes: 1048576, 
          },
        });

        uploadStream.on("finish", () => {
          console.log("File successfully uploaded with ID:", uploadStream.id);
          media_id.push({id:uploadStream.id,thumbnail:videoArray[i].thumbnail,type:"video"});
          resolve(uploadStream.id);
        });

        uploadStream.on("error", (err) => {
          console.error("Error uploading file:", err);
          reject(err);
        });

        uploadStream.end(Buffer.from(base64Data, "base64"));
      });
    }
    Platform.forEach((element) => {
      if (element.isChecked) {
        platformArray.push(element.platform);
      }
    });
  } catch (error) {
    console.error("Error uploading video:", error);
    throw new Error(error);
  }
  //for instagram
  try {
    if (Platform[1].isChecked) {
      const idArray = [];
      const document = await Brand.findById(req.body.brandId);
      const instaId = document.instagramcredential.values().next().value;
      for (let i = 0; i < videoArray.length; i++) {
        console.log("videoArray", i);

        const base64Video = videoArray[i].data;
        const base64Data = base64Video.split(",")[1];
        const buffer = Buffer.from(base64Data, "base64");
        const s3Client = new S3Client({
          endpoint: "https://nyc3.digitaloceanspaces.com", // Replace with your region's endpoint
          region: "nyc3", // Replace with your region
          credentials: {
            accessKeyId: "DO00EVVGXTJMEVL3H9Y9", // Replace with your Spaces access key
            secretAccessKey: "3mGfu03NStDq9IlaXaVBoISUmpa/7xm7BiSvc4H0ir4", // Replace with your Spaces secret key
          },
        });

        const uploadParams = {
          Bucket: "postager2",
          Key: `${instaId}${i}.mp4`,
          Body: buffer,
          ACL: "public-read", // Make it publicly accessible
          ContentType: "video/mp4",
        };
        const command = new PutObjectCommand(uploadParams);
          await s3Client.send(command);
        const publicUrl = `https://postager2.nyc3.digitaloceanspaces.com/${instaId}${i}.mp4`;
        console.log("publicUrl", publicUrl);

        const res = await axios.post(
          `https://graph.facebook.com/v21.0/${instaId}/media`,
          {
            media_type: "REELS",
            is_carousel_item: videoArray.length > 1 ? true : false,
            video_url: publicUrl,
            access_token: document.fbuseraccesstoken,
            share_to_feed: "TRUE",
          }
        );
        console.log("response", res.data);
        await waitForMediaReady(res.data.id, document.fbuseraccesstoken);
        if (videoArray.length == 1) {
          if (req.body.date == undefined) {
            const response = await axios.post(
              `https://graph.facebook.com/v20.0/${instaId}/media_publish`,
              {
                creation_id: res.data.id,
                access_token: document.fbuseraccesstoken,
              }
            );
            console.log("result of single video post", response.data);
            insta_post_id.push(response.data.id);
          } else scheduledId.push(res.data.id);
        }

        idArray.push(res.data.id);
      }
      if (videoArray.length > 1) {
        const response = await axios.post(
          `https://graph.facebook.com/v21.0/${instaId}/media`,
          {
            media_type: "CAROUSEL",
            children: idArray,
            access_token: document.fbuseraccesstoken,
          }
        );

        console.log("response of carosusel container", response.data);
        if (req.body.date == undefined) {
          await waitForMediaReady(response.data.id, document.fbuseraccesstoken);
          const res = await axios.post(
            `https://graph.facebook.com/v21.0/${instaId}/media_publish`,
            {
              creation_id: response.data.id,
              access_token: document.fbuseraccesstoken,
            }
          );
          console.log("result of multiple video post", res.data);
          insta_post_id.push(res.data.id);
        } else scheduledId.push(carousalContainer.data.id);
      }
    }
    if (Platform[0].isChecked) {
      //for facebook
      const base64Video = videoArray[0].data;
      const scheduledId = [];
      const base64Data = base64Video.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      const document = await Brand.findById(req.body.brandId);
      const PAGE_ID = document.facebookcredential.keys().next().value;
      const PAGE_ACCESS_TOKEN = document.facebookcredential.entries().next()
        .value[1];
      const s3Client = new S3Client({
        endpoint: "https://nyc3.digitaloceanspaces.com",
        region: "nyc3",
        credentials: {
          accessKeyId: "DO00EVVGXTJMEVL3H9Y9",
          secretAccessKey: "3mGfu03NStDq9IlaXaVBoISUmpa/7xm7BiSvc4H0ir4",
        },
      });

      try {
        const uploadParams = {
          Bucket: "postager2",
          Key: `${PAGE_ID}.mp4`,
          Body: buffer,
          ACL: "public-read",
          ContentType: "video/mp4",
        };

        const command = new PutObjectCommand(uploadParams);
        const resultUpload = await s3Client.send(command);

        // Send POST request to Facebook Graph API
        const response1 = await axios.post(
          `https://graph-video.facebook.com/v20.0/${PAGE_ID}/videos`,
          {
            file_url: `https://postager2.nyc3.digitaloceanspaces.com/${PAGE_ID}.mp4`,
            access_token: PAGE_ACCESS_TOKEN,
            published: req.body.date == undefined ? true : false,
          }
        );
        console.log("fbResponse", response1.data);

        if (req.body.date != undefined) {
          const newdate = new Date(req.body.date);
          const unixTimestamp = Math.floor(newdate.getTime() / 1000);
          console.log("unixTimestamp", unixTimestamp);
          const postData = {
            access_token: PAGE_ACCESS_TOKEN,
            attached_media: JSON.stringify([{ media_fbid: response1.data.id }]),
            scheduled_publish_time: unixTimestamp, // Unix timestamp
            published: false,
            unpublished_content_type: "SCHEDULED",
          };

          try {
            const response2 = await axios.post(
              `https://graph.facebook.com/v20.0/${PAGE_ID}/feed`,
              postData
            );

            console.log("Scheduled video post:", response2.data);
            return response2.data; // Contains the post ID and other info
          } catch (error) {
            console.error("Error scheduling video post:", error.response.data);
          }
        } else fb_post_id.push(response1.data.id);
      } catch (error) {
        console.error(
          "Error uploading video:",
          error.response ? error.response.data : error.message
        );
        res.status(500).json({ error: "Failed to upload video to Facebook" });
      }
    }
    await updateBrandIndb(
      req.body.brandId,
      req.body.date,
      res,
      media_id,
      platformArray,
      fb_post_id,
      insta_post_id,
      "video",
      scheduledId
    );
  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).json({ error: "Failed to upload video" });
  }
});

//Upload for reels
const storage2 = multer.memoryStorage();
const uploadReel = multer({
  storage: storage2,
  limits: { fieldSize: 100000000000 },
});

app.post("/uploadReel", uploadReel.array("video"), async (req, res) => {
  const videoArray = JSON.parse(req.body.video);
  const Platform = JSON.parse(req.body.Platform);
  const media_id = [];
  const scheduledId = [];
  const platformArray = [];
  const fb_post_id = [];
  const insta_post_id = [];

  try {
    //for media uplaod to db
    const gfsBucket = await getGfsBucket();

    for (let i = 0; i < videoArray.length; i++) {
      const base64Data = videoArray[i].data.replace(
        /^data:video\/mp4;base64,/,
        ""
      );
      const as = await new Promise((resolve, reject) => {
        const uploadStream = gfsBucket.openUploadStream(req.body.brandId, {
          metadata: {
            type: "video",
          },
        });

        uploadStream.on("finish", () => {
          console.log("File successfully uploaded with ID:", uploadStream.id);
          media_id.push({id:uploadStream.id,type:'video',thumbnail:videoArray[i].thumbnail});
          resolve(uploadStream.id);
        });

        uploadStream.on("error", (err) => {
          console.error("Error uploading file:", err);
          reject(err);
        });

        uploadStream.end(Buffer.from(base64Data, "base64"));
      });
    }
    Platform.forEach((element) => {
      if (element.isChecked) {
        platformArray.push(element.platform);
      }
    });
  } catch (error) {
    console.error("Error :", error);
    res.status(500).json({ error: "Failed to upload video to GridFS" });
  }
  try {
    if (Platform[1].isChecked) {
      const document = await Brand.findById(req.body.brandId);
      const instaId = document.instagramcredential.values().next().value;
      for (let i = 0; i < videoArray.length; i++) {
        console.log("videoArray", i);

        const base64Video = videoArray[i].data;

        const base64Data = base64Video.split(",")[1];
        const buffer = Buffer.from(base64Data, "base64");
        const s3Client = new S3Client({
          endpoint: "https://nyc3.digitaloceanspaces.com", // Replace with your region's endpoint
          region: "nyc3", // Replace with your region
          credentials: {
            accessKeyId: "DO00EVVGXTJMEVL3H9Y9", // Replace with your Spaces access key
            secretAccessKey: "3mGfu03NStDq9IlaXaVBoISUmpa/7xm7BiSvc4H0ir4", // Replace with your Spaces secret key
          },
        });

        const uploadParams = {
          Bucket: "postager2",
          Key: `${instaId}${i}.mp4`,
          Body: buffer,
          ACL: "public-read", // Make it publicly accessible
          ContentType: "video/mp4",
        };
        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);
        const publicUrl = `https://postager2.nyc3.digitaloceanspaces.com/${instaId}${i}.mp4`;
        const res = await axios.post(
          `https://graph.facebook.com/v21.0/${instaId}/media`,
          {
            media_type: "REELS",
            is_carousel_item: videoArray.length > 1 ? true : false,
            video_url: publicUrl,
            access_token: document.fbuseraccesstoken,
            share_to_feed: "TRUE",
          }
        );
        console.log("response", res.data);
        await waitForMediaReady(res.data.id, document.fbuseraccesstoken);
        if (req.body.date == undefined) {
          const response = await axios.post(
            `https://graph.facebook.com/v20.0/${instaId}/media_publish`,
            {
              creation_id: res.data.id,
              access_token: document.fbuseraccesstoken,
            }
          );
          console.log("result of single video post", response.data);
          insta_post_id.push(response.data.id);
        } else scheduledId.push(response.data.id);
      }
    }
    if (Platform[0].isChecked) {
      //for facebook
      const base64Video = videoArray[0].data;

      const base64Data = base64Video.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      // const videoBuffer = req.file.buffer;
      // const fileSize = req.file.size; // Get the file size in bytes
      const document = await Brand.findById(req.body.brandId);

      console.log(
        "pageid",
        document.facebookcredential.entries().next().value[1]
      );
      const PAGE_ID = document.facebookcredential.keys().next().value;
      const PAGE_ACCESS_TOKEN = document.facebookcredential.entries().next()
        .value[1];
      console.log("PAGE_ID", PAGE_ID);
      console.log("PAGE_ACCESS_TOKEN", PAGE_ACCESS_TOKEN);
      const resultRequest = await axios.post(
        `https://graph.facebook.com/v20.0/${PAGE_ID}/video_reels`,
        {
          upload_phase: "start",
          access_token: `${PAGE_ACCESS_TOKEN}`,
        }
      );
      console.log("resultRequest", resultRequest.data);
      const VIDEO_ID = resultRequest.data.video_id; // Replace with the video ID received from Step 1
      console.log("VIDEO_ID", VIDEO_ID);

      // Step 2: Prepare headers for the video upload
      const headers = {
        Authorization: `OAuth ${PAGE_ACCESS_TOKEN}`,
        "Content-Type": "application/octet-stream", // Set content type to binary
        offset: 0, // Start from the first byte
        file_size: fileSize, // Total file size in bytes
      };

      const url = `https://rupload.facebook.com/video-upload/v20.0/${VIDEO_ID}`; // Replace with actual video ID

      const response = await axios.post(url, buffer, { headers });
      console.log("response", response.data);
      if (req.body.date != undefined) {
        const newdate = new Date(req.body.date);
        const unixTimestamp = Math.floor(newdate.getTime() / 1000);
        const reelPublishResult = await axios.post(
          `https://graph.facebook.com/v20.0/${PAGE_ID}/video_reels`,
          {
            access_token: PAGE_ACCESS_TOKEN,
            video_id: VIDEO_ID,
            upload_phase: "finish",
            video_state: "SCHEDULED",
            scheduled_publish_time: unixTimestamp,
          }
        );
        fb_post_id.push(reelPublishResult.data.id);
        console.log("reelPublishResult with scehdule", reelPublishResult.data);
      } else {
        const reelPublishResult = await axios.post(
          `https://graph.facebook.com/v20.0/${PAGE_ID}/video_reels`,
          {
            access_token: PAGE_ACCESS_TOKEN,
            video_id: VIDEO_ID,
            upload_phase: "finish",
            video_state: "PUBLISHED",
          }
        );
        console.log(
          "reelPublishResult without schedule",
          reelPublishResult.data
        );
        fb_post_id.push(reelPublishResult.data.id);
      }

      // Step 4: Handle Facebook response
      if (response.status === 200) {
        // Success, respond back to the client
        res.json({
          message: "Video reel uploaded successfully",
          response: response.data,
        });
      } else {
        // Something went wrong with the upload
        res.status(response.status).json({
          error: "Failed to upload video reel",
          details: response.data,
        });
      }
    }
    await updateBrandIndb(
      req.body.brandId,
      req.body.date,
      res,
      media_id,
      platformArray,
      scheduledId
    );
  } catch (error) {
    // Handle any errors
    console.error("Error uploading reel:", error);
    res.status(500).json({
      error: "An error occurred while uploading the video reel to Facebook",
    });
  }
});

app.use(upload);
app.use("/api/v1", LoginRoutes);

app.post("/uploadProfilePicture", function (req, res, next) {
  console.log(req.body);

  // upload(req,res,function(err) {   console.log(req.body.name);         if(err)
  // {             res.send(err)         }         else {              SUCCESS,
  // image successfully uploaded             res.send("Success, Image uploaded!")
  // }     })
});

app.get("/image/:name", function (req, res) {
  console.log("i have got the request to show images");

  var myLog = path.join(__dirname, "uploads/", req.params.name);

  if (fs.existsSync(myLog)) {
    console.log("file exists");
    res.sendFile(path.join(__dirname, "uploads/", req.params.name));
  } else {
    res.statusCode = 302;
    res.setHeader(
      "Location",
      "https://images.pexels.com/photos/133081/pexels-photo-133081.jpeg?auto=compress" +
        "&cs=tinysrgb&w=300"
    );
    res.end();
  }
});

app.get("/file", function (req, res) {
  res.sendFile(__dirname + "/new.html");
});

app.get("/gettheclientdata", function (req, res) {
  res.send(JSON.stringify(req.session));
});
