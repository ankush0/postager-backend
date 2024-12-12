const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const Brand = require('../Database/Connection').Brands;
var axios = require('axios');
const Schedule = require('../Database/Connection').Schedule
// const { resolve } = require('path');

async function getinstagramid(pageid, access_token) {
    var url = 'https://graph.facebook.com/v16.0/' + pageid + '?fields=instagram_bus' +
            'iness_account&access_token=' + access_token;
    const response = await axios.get(url);

    if (response.data.instagram_business_account) {
        return response.data.instagram_business_account.id

    } else {
        return null
    }

}

function getinstagramidImage(pageid, access_token) {
    var url = 'https://graph.facebook.com/v13.0/' + pageid + '?fields=profile_picture_url&access_token=' + access_token;
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'https://graph.facebook.com/v13.0/'+pageid+'?fields=profile_picture_url&access_token='+access_token,
        headers: { }
      };
      
      axios.request(config)
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        return null
      });
    

}

exports.AddApikeysandTokenInstagram = async (req, res) => {
    console.log("addapiinsta",req.body);
    try {
        console.log("instagram");
        const brandData = await Brand.findById(req.body.brandId)
    const { facebookcredential } = brandData;
    const pageid = facebookcredential.keys().next().value;

    const {fbuseraccesstoken}=brandData

  const resp=  await axios.get(`https://graph.facebook.com/v21.0/${pageid}?fields=instagram_business_account&access_token=${fbuseraccesstoken}`)
  console.log("hello",resp.data.instagram_business_account.id);
  const instaId=resp.data.instagram_business_account.id;

const responseImageUrl=await axios.get(`https://graph.facebook.com/v17.0/${instaId}?fields=profile_picture_url&access_token=${fbuseraccesstoken}`)
console.log("hello",responseImageUrl.data.profile_picture_url);
await Brand.updateOne({
    "_id": req.body.brandId
}, {
    'instagramcredential':{
        instaId:resp.data.instagram_business_account.id,
    instaProfileUrl:responseImageUrl.data.profile_picture_url
    }, 
}).then((response) => {
  console.log("insta credaintial added succesfully");

    
    }).catch((error) => {
        console.log(error);
        res.json({status: 0, msg: "Internal Server Error check your credentials"})
    })

res.json({status: 1, data:{
id:resp.data.instagram_business_account.id,
 url:responseImageUrl.data.profile_picture_url
}})
} catch (error) {
  res.json({status: 0, msg: "Internal Server Error check your credentials"})      
}
}
//for deleting imedia from digitalocean for cleanup
async function deleteObjectFromSpace(id, i,s3Client) {
    const deleteParams = {
      Bucket: "postager2", // Your Space name
      Key: `${id}${i}.jpg`, // The specific key (filename) you want to delete
    };
  
    // Create the delete command
    const deleteCommand = new DeleteObjectCommand(deleteParams);

    try {
      // Send the delete command
    
      const resultDelete = await s3Client.send(deleteCommand);
      console.log(`Successfully deleted ${id}${i}.jpg from Space:`, resultDelete);
    } catch (err) {
      console.error("Error deleting object from Space:", err);
    }
  }
exports.postToInsta = async (id,access_token,content,Image,res,brandData,date) => {
    console.log("postToInsta",date);
    const temp=[]
    const scheduledId=[]
    console.log(Image);
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
        Key: `${id}${i}.jpg`,
        Body: buffer,
        ACL: "public-read", 
        ContentType: "image/jpeg", 
      };
      const command = new PutObjectCommand(uploadParams);
      const resultUpload = await s3Client.send(command);
  
      console.log("accesstoken", access_token);
  
      const publicUrl =
        `https://postager2.nyc3.digitaloceanspaces.com/${id}${i}.jpg`;
    
const responsContainer=await axios.post(`https://graph.facebook.com/v21.0/${id}/media`,
    {
        image_url: publicUrl,
        caption:content,
        is_carousel_item: Image.length>1?true:false,
        access_token: access_token,
    })
    deleteObjectFromSpace(id,i,s3Client)
    console.log("responseContainer",responsContainer.data);
    if(Image.length==1){
        if(date==undefined){
        
    const publishResult=await axios.post(`https://graph.facebook.com/v21.0/${id}/media_publish`,
        {
            "creation_id": responsContainer.data?.id,
  "access_token":access_token
        } )
    console.log("publishInstaPhotoResult",publishResult);
    return responsContainer.data.id

    }

else{
      scheduledId.push(responsContainer.data.id)

}}
    else{
        temp.push(responsContainer.data.id)
       
    }

    }
  
    if(temp.length>0){
        const carousalContainer=await axios.post(`https://graph.facebook.com/v21.0/${id}/media`,
        {
            media_type: "CAROUSEL",
            children: temp,
            access_token: access_token,
            })
            
            console.log("carousalContainer",carousalContainer.data.id);
            //for unscheduled post
            if(date==undefined){
            const publishResult=await axios.post(`https://graph.facebook.com/v21.0/${id}/media_publish`,
        {
            "creation_id": carousalContainer.data.id,
    "access_token":access_token } )
        console.log("publishInstaPhotoCarosuselResult",publishResult.data);
        return publishResult.data.id
    }
    //for scheduled post
    else{
          
        scheduledId.push(carousalContainer.data.id)
        console.log("scheduledId",scheduledId);
    } }
        if(scheduledId.length>0){
            return scheduledId
        
            // const scheduleRes=await Schedule.findByIdAndUpdate
            // (brandData.schedule_id,     {
            //  $push: {
            //     post_id:scheduledId,
            //     platform:"instagram",
            //     post_time:date
            //  }
            // },
            // { new: true }) 
            // console.log("scheduleResponse",scheduleRes);
        }
     
   
}



exports.storyToInsta = async (Instagramid, accesstoken, Image, Content) => {
   
    console.log(Image);
    var base_url = 'https://graph.facebook.com/v18.0/'
    var url = base_url + Instagramid + '/media?media_type=STORIES&caption='+Content+'&access_token='+accesstoken+'&image_url='+Image;
    try {
        data = await axios.post(url);
        var post_id = data.data.id;
    } catch (error) {
        return error;
    }
    
    if(post_id)
    {
        var post_publish_url = base_url+Instagramid+'/media_publish?creation_id='+post_id+'&access_token=' + accesstoken;
        try {
            data2 = await axios.post(post_publish_url);
            return data2.data.id;
        }catch(error) {
            return error;
                
        }
    }  
}

exports.reelsToInsta = async (Instagramid, accesstoken, Image, Content) => {
   
    // console.log(Image);
    var base_url = 'https://graph.facebook.com/v18.0/'
    var url = base_url + Instagramid + '/media?media_type=REELS&caption='+Content+'&access_token='+accesstoken+'&video_url='+Image;
    
    try {
        data = await axios.post(url);
    } catch (error) {
        return error;
    }
    console.log(data.data.id);
    var container_ping_adr=base_url+Instagramid+'/media_publish?creation_id='+data.data.id+'&access_token=' + accesstoken;
    var res = media_publish(container_ping_adr);
    if(res){
        return res;
    }
    // console.log(post_id);
    
    // if(post_id)
    // {
    //     var post_publish_url = base_url+Instagramid+'/media_publish?creation_id='+post_id+'&access_token=' + accesstoken;
    //     media_publish(post_publish_url);
  
        // console.log(result);
        // setInterval(
            // media_publish(post_publish_url)
            // , 3000);

        // try {
        //         const data= await axios .post(post_publish_url).catch((err) => {
        //         if(err.code=='ERR_BAD_REQUEST'){
                    
        //             console.log(err,"Bad Request happen check credentials");
        //         }
        //         else{
        //             console.log(err);
        //         }
        //         });
        //         // console.log(data);
        //         return data.data.id;
        // }catch(error) {
        //     console.error('Error creating the post:', error.response);
                
        // }
    // }  
}


function wait5sec (waitTime) {

    return new Promise ((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, waitTime);
    });
    
  }
  
async function media_publish (i) {
    await wait5sec(50000);  // wait function
    try {
        data2 = await axios.post(i);
        return data2.data.id;
    } catch (error) {
        console.log(error);
        return error;
    }

    // console.log("dk");
    // try {
    //     const data= await axios .post(i).catch((err) => {
    //     if(err.code=='ERR_BAD_REQUEST'){
            
    //         console.log(err.response,"Bad Request happen check credentials");
    //     }
    //     else{
    //         console.log(err.response);
    //     }
    //     });
    //     console.log(data);
    //     return data.data.id;
    // }catch(error) {
    //     return error;
            
    // }
}

exports.removeApikeyInstagram = async (req, res) => {
    try{
        if (req.body._id && req.body._id.match(/^[0-9a-fA-F]{24}$/)) {
    
            let map = new Map();
            map.set("","");      
           Brand.updateOne({
                "_id": req.body._id
            }, {
                'instagramcredential':"",
                'instagrampicture':""
            }, function (error, response) {
                console.log(response);
                if (error) {
                    console.log(error);
                    res.json({status: 0, msg: "Internal Server Error check your credentials"})
                } else {
                    if (response.nModified == 1) {
    
                        res.json({Status: 1, msg: "updated succesfully"})
    
                    } else {
                        res.json({Status: 0, msg: "Not Updated/Dont tyr to Overwrite"})
    
                    }
                }
                console.log(error);
    
            });
    
        } else {
    
            res.json({status: 0, msg: "Send all Necessary Fields"})
        }
    }
    catch(err){
    console.log(err);
    res.send({status: 0, msg: "Internal Server error check your credential and try again"});
    
    }
}