const Brand=require('../Database/Model/Brand')
var axios=require('axios');
const { resolve } = require('path');
const { rejects } = require('assert');
function returnaccestoken(brandid){
return new Promise((resolve,rejects)=>{

user.findById(req.body.userid,function(err,result){
resolve(result)
rejects(err);
})


})


}

exports.AddApikeysandTokenFacebook = async (req, res) => {
try{
    if (req.body._id && req.body.facebookid && req.body.oauth_token && req.body._id.match(/^[0-9a-fA-F]{24}$/)) {
       var url='https://graph.facebook.com/v3.2/oauth/access_token?grant_type=fb_exchange_token&client_id='+process.env.Facebook_Consumer_key+'&client_secret='+process.env.Facebook_Consumer_Secret+'&fb_exchange_token='+req.body.oauth_token; 
      const response = await axios.get(url);
      
      console.log('the data is'+response.data);
      var longliveacesstoken=response.data.access_token;
      var lonnglivepagesurl='https://graph.facebook.com/v3.2/'+ req.body.facebookid+'/accounts?fields=access_token,id,name,about,category,website,picture&access_token='+longliveacesstoken;
    //   console.log(lonnglivepagesurl)
      const pagesdata=await axios.get(lonnglivepagesurl);
      let map = new Map();
    //   console.log(pagesdata.data.data[0].picture.data.url);
      pagesdata.data.data.forEach(function (item, index) {
        console.log("itemsis "+item)
        // console.log(item.id);
        // console.log("url "+req.body.fbpicture);
        map.set(item.id,item.access_token);
      });
      
  
       Brand.updateOne({
            "_id": req.body._id
        }, {
            'facebookcredential':map,
            'fbpicture':pagesdata.data.data[0].picture.data.url
        }, function (error, response) {
            if (error) {

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
exports.Getallcomments=async(req,res)=>{
    
var access_token=req.body.access_token;
var postid=req.body.postid;
var getallcommenturl= `https://graph.facebook.com/v3.2/${postid}/comments?access_token=${access_token}`
try{

    const commentdata=await axios.get(getallcommenturl);
    console.log(commentdata)
    res.json({
     'status':1,
     'msg':commentdata.data.data

    })



}
catch(err){

     console.log(err);
    res.json({"msg":0,'msg':"Internal Server Error"})

}



    
}
exports.ReplyToComment=async(Req,res)=>{

}

exports.removeApikeyFacebook = async (req, res) => {
    try{
        if (req.body._id && req.body._id.match(/^[0-9a-fA-F]{24}$/)) {
    
            let map = new Map();
            map.set("","");      
           Brand.updateOne({
                "_id": req.body._id
            }, {
                'facebookcredential':"",
                'fbpicture':""
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

exports.reels = async (Instagramid, accesstoken, Image, Content) => {
   
        console.log(Image);
        var base_url = 'https://graph.facebook.com/v18.0/'
        var url = base_url +'me/video_reels?access_token='+accesstoken+'&upload_phase=start'
        try {
            const data= await axios .post(url).catch((err) => {
              if(err.code=='ERR_BAD_REQUEST'){
                
                console.log("Bad Request happen check credentials");
              }
              else{
                console.log(err.code);
              }
            });
            var post_id = data.data.video_id;
        }catch(error) {
            console.error('Error creating the page id:', error);            
        }
    
        console.log("facebook id",post_id);
        
        if(post_id)
        {
            var post_publish_url = 'https://rupload.facebook.com/video-upload/v18.0/'+post_id;
            upload_hosted(post_publish_url,accesstoken,Image,post_id,Content);
        }  
    }
    
    
    function wait5sec (waitTime) {
    
        return new Promise ((resolve) => {
          setTimeout(() => {
            resolve(true);
          }, waitTime);
        });
        
      }
      
    
    async function upload_hosted (i,accesstoken,Image,post_id,Content) {
        await wait5sec(2000);  // wait function
        console.log("dk",accesstoken);

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: i,
            headers: { 
              'Authorization': 'OAuth '+accesstoken, 
              'file_url': Image
            }
          };
          
          axios.request(config)
          .then((response) => {
            var post_publish_url = 'https://graph.facebook.com/v17.0/me/video_reels?access_token='+accesstoken+'&video_id='+post_id+'&upload_phase=finish&video_state=PUBLISHED&description='+Content+'&title='+Content;
            media_publish(post_publish_url);
          })
          .catch((error) => {
            console.log(error);
          });
    }
      async function media_publish (i) {
        await wait5sec(50000);  // wait function
        console.log("dk");
        try {
            const data= await axios .post(i).catch((err) => {
            if(err.code=='ERR_BAD_REQUEST'){
                
                console.log(err.response,"Bad Request happen check credentials");
            }
            else{
                console.log(err.response);
            }
            });
            console.log("post success",data);
            return data.data.id;
        }catch(error) {
            console.error('Error creating the post:',error.response);
                
        }
    }
    

    exports.postToFb = async (pageid, Content, imagePath,accessToken) => {

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
    }