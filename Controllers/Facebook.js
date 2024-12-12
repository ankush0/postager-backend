const Brand = require("../Database/Connection").Brands;
const FormData = require("form-data");
const Post = require("../Database/Model/Posts");
var axios = require("axios");
const { resolve } = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { rejects } = require("assert");
function returnaccestoken(brandid) {
  return new Promise((resolve, rejects) => {
    user.findById(req.body.userid, function (err, result) {
      resolve(result);
      rejects(err);
    });
  });
}

exports.AddApikeysandTokenFacebook = async (req, res) => {
  try {
    if (
      req.body._id &&
      req.body.facebookid &&
      req.body.oauth_token &&
      req.body._id.match(/^[0-9a-fA-F]{24}$/)
    ) {
      //long lived user access token generted from short lived user access token(60 days validity)
      const long_lived_user_access_token = await axios.get(
        `https://graph.facebook.com/v20.0/oauth/access_token? grant_type=fb_exchange_token&client_id=${process.env.Facebook_Consumer_key}&client_secret=${process.env.Facebook_Consumer_Secret}&fb_exchange_token=${req.body.oauth_token}`
      );

      console.log(
        "obtained long_lived_user_access_token",
        long_lived_user_access_token.data
      );
      //long lived page access token generated from long lived user access token(infinite validity)
      const long_lived_pages_access_token = await axios.get(
        `https://graph.facebook.com/v20.0/${req.body.facebookid}/accounts?fields=name,picture,category,access_token&access_token=${long_lived_user_access_token.data.access_token}`
      );
      console.log(
        "obtained long_lived_pages_access_token",
        long_lived_pages_access_token.data
      );
      let map = new Map();
      long_lived_pages_access_token.data.data.forEach(function (item, index) {
        console.log("itemsis " + item);
        map.set(item.id, item.access_token,item.name);
      });

      const responseBrand = await Brand.updateOne(
        { _id: req.body._id },
        {
          facebookcredential: map,
          fbpicture:
            long_lived_pages_access_token.data.data[0].picture.data.url,
            fbname:long_lived_pages_access_token.data.data[0].name,
            fbuseraccesstoken: long_lived_user_access_token.data.access_token,
        }
      );

      console.log("the data is" + responseBrand.modifiedCount);
      if (responseBrand.modifiedCount === 1) {
        res.json({ Status: 1, msg: "Updated successfully" ,pageName:long_lived_pages_access_token.data.data[0].name});
      } else {
        res.json({ Status: 0, msg: "Not Updated/Don't try to Overwrite" });
      }
    } else {
      res.json({ status: 0, msg: "Send all Necessary Fields" });
    }
  } catch (err) {
    console.log(err);
    res.send({
      status: 0,
      msg: "Internal Server error check your credential and try again",
    });
  }
};
exports.Getallcomments = async (req, res) => {
  var access_token = req.body.access_token;
  var postid = req.body.postid;
  var getallcommenturl = `https://graph.facebook.com/v3.2/${postid}/comments?access_token=${access_token}`;
  try {
    const commentdata = await axios.get(getallcommenturl);
    console.log(commentdata);
    res.json({
      status: 1,
      msg: commentdata.data.data,
    });
  } catch (err) {
    console.log(err);
    res.json({ msg: 0, msg: "Internal Server Error" });
  }
};
exports.ReplyToComment = async (Req, res) => {};

exports.removeApikeyFacebook = async (req, res) => {
  try {
    if (req.body._id && req.body._id.match(/^[0-9a-fA-F]{24}$/)) {
      let map = new Map();
      map.set("", "");
      Brand.updateOne(
        {
          _id: req.body._id,
        },
        {
          facebookcredential: "",
          fbpicture: "",
        },
        function (error, response) {
          console.log(response);
          if (error) {
            console.log(error);
            res.json({
              status: 0,
              msg: "Internal Server Error check your credentials",
            });
          } else {
            if (response.nModified == 1) {
              res.json({ Status: 1, msg: "updated succesfully" });
            } else {
              res.json({ Status: 0, msg: "Not Updated/Dont tyr to Overwrite" });
            }
          }
          console.log(error);
        }
      );
    } else {
      res.json({ status: 0, msg: "Send all Necessary Fields" });
    }
  } catch (err) {
    console.log(err);
    res.send({
      status: 0,
      msg: "Internal Server error check your credential and try again",
    });
  }
};

exports.reels = async (Instagramid, accesstoken, Image, Content) => {
  console.log(Image);
  var base_url = "https://graph.facebook.com/v18.0/";
  var url =
    base_url +
    "me/video_reels?access_token=" +
    accesstoken +
    "&upload_phase=start";
  try {
    data = await axios.post(url);
    var post_id = data.data.video_id;
  } catch (error) {
    return error;
  }

  console.log("facebook id", post_id);

  if (post_id) {
    var post_publish_url =
      "https://rupload.facebook.com/video-upload/v18.0/" + post_id;
    var res = upload_hosted(
      post_publish_url,
      accesstoken,
      Image,
      post_id,
      Content
    );
    if (res) {
      return res;
    }
  }
};

function wait5sec(waitTime) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, waitTime);
  });
}

async function upload_hosted(i, accesstoken, Image, post_id, Content) {
  await wait5sec(20000); // wait function

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: i,
    headers: {
      Authorization: "OAuth " + accesstoken,
      file_url: Image,
    },
  };

  axios
    .request(config)
    .then((response) => {
      var post_publish_url =
        "https://graph.facebook.com/v17.0/me/video_reels?access_token=" +
        accesstoken +
        "&video_id=" +
        post_id +
        "&upload_phase=finish&video_state=PUBLISHED&description=" +
        Content +
        "&title=" +
        Content;
      var res = media_publish(post_publish_url);
      if (res) {
        return res;
      }
    })
    .catch((error) => {
      return error;
    });
}

async function media_publish(i) {
  await wait5sec(50000); // wait function
  console.log("dk");
  try {
    data2 = await axios.post(i);
    return data2.data.id;
  } catch (error) {
    return error;
  }
}

exports.postToFb = async (pageid, Content, imagePath, accessToken) => {
  try {
    const response = await axios.post(`https://graph.facebook.com/me/photos`, {
      url: imagePath,
      access_token: accessToken,
    });

    return response.data;
  } catch (error) {
    return error.response ? error.response.data : error.message;
  }

  // var data = "";
  // var base = 'https://graph.facebook.com/';
  // var ping_adr = base + Instagramid + '/media?image_url=' + Image + '&caption=' + Content + '&access_token=' + accesstoken;
  // try {
  //     data = await axios.post(ping_adr);
  // } catch (error) {
  //     return error;
  // }

  // var container_ping_adr=base+Instagramid+'/media_publish?creation_id='+data.data.id+'&access_token=' + accesstoken;
  // try {
  //     data2 = await axios.post(container_ping_adr);
  //     return data2.data.id;
  // } catch (error) {
  //     return error;
  // }
};
//called from post.js
exports.postToFacebook = async (
  pageid,
  Image,
  Content,
  accesstoken,
  date
) => {
  console.log("reached...............");
  try {
    const photoIds = [];
    for (let i = 0; i < Image.length; i++) {
  

    const s3Client = new S3Client({
      endpoint: "https://nyc3.digitaloceanspaces.com", // Replace with your region's endpoint
      region: "nyc3", // Replace with your region
      credentials: {
        accessKeyId: "DO00EVVGXTJMEVL3H9Y9", // Replace with your Spaces access key
        secretAccessKey: "3mGfu03NStDq9IlaXaVBoISUmpa/7xm7BiSvc4H0ir4", // Replace with your Spaces secret key
      },
    });

    const buffer = Buffer.from(
      Image[i].replace(/^data:image\/jpeg;base64,/, ""),
      "base64"
    );
    const uploadParams = {
      Bucket: "postager2",
      Key: "abcdef.jpg",
      Body: buffer,
      ACL: "public-read", 
      ContentType: "image/jpeg", 
    };
    const command = new PutObjectCommand(uploadParams);
    const resultUpload = await s3Client.send(command);
    console.log("pageid", pageid);

    console.log("accesstoken", accesstoken);

    const publicUrl =
      "https://postager2.nyc3.digitaloceanspaces.com/abcdef.jpg";
    console.log("publicurl", accesstoken);
    const result = await axios.post(
      `https://graph.facebook.com/v20.0/${pageid}/photos?`,
      {
        access_token: accesstoken,
        url: publicUrl,
        caption: Content,
        published: Image.length>1 || date!=undefined?false:true, 
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("result of single post", result.data);
    photoIds.push(result.data.id);
    if(date==undefined && Image.length==1){
      return photoIds
    }
  }
  
//for scheduled post

    if(date!=undefined){
      const newdate = new Date(date);
      

const unixTimestamp = Math.floor(newdate.getTime() / 1000);
console.log("unixTimestamp", unixTimestamp);
console.log("photoIds", photoIds.map(id => ({ media_fbid: id })));
      const postResult = await axios.post(
        `https://graph.facebook.com/v20.0/${pageid}/feed?`,
        {
          access_token: accesstoken,
          attached_media: photoIds.map(id => ({ media_fbid: id })), 
        published: false,
        unpublished_content_type: "SCHEDULED",
          scheduled_publish_time: unixTimestamp
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log("scheduled post result:", postResult.data.id);
      return [postResult.data.id]
    }
    else {
      console.log("reached in undefined date")
  const postResult = await axios.post(
    `https://graph.facebook.com/v20.0/${pageid}/feed?`,
    {
      access_token: accesstoken,
      attached_media: photoIds.map(id => ({ media_fbid: id })), 
      message: "This is a multi-photo post", 
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  console.log("Multi-photo post result:", postResult.data.id);
  return [postResult.data.id];
}

  } catch (err) {
    console.log("facebook inside function error", err.response.data);
  }
  

  // if (facebookdata) {
  //   await Post.findByIdAndUpdate(postid, {
  //     facebookpostid: facebookdata.data.id,
  //     Status: "Live",
  //   });
  //   console.log(
  //     `Post with id ${facebookdata.data.id} has been uploaded succesfully on Facebook`
  //   );
  // } else {
  //   console.log(`Post with id ${postid} could not be posted on Facbeook`);
  // }
};
exports.getAccessToken = (brandData) => {
  const { facebookcredential } = brandData;
  const fb_access_token = facebookcredential.values().next().value;
  return fb_access_token;
};

exports.getFbId = (brandData) => {
  const { facebookcredential } = brandData;
  const fb_id = facebookcredential.keys().next().value;

  return fb_id;
};
