const Brand = require('../Database/Model/Brand')
var axios = require('axios');
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

    if (req.body._id && req.body.facebookid && req.body.oauth_token && req.body._id.match(/^[0-9a-fA-F]{24}$/)) {
        var url = 'https://graph.facebook.com/v3.2/oauth/access_token?grant_type=fb_exchange_toke' +
                'n&client_id=' + process.env.Facebook_Consumer_key + '&client_secret=' +
                process.env.Facebook_Consumer_Secret + '&fb_exchange_token=' + req.body.oauth_token;

        const response = await axios.get(url);

        console.log('the data is' + response.data);
        var longliveacesstoken = response.data.access_token;

        var lonnglivepagesurl = 'https://graph.facebook.com/v3.2/' + req.body.facebookid +
                '/accounts?access_token=' + longliveacesstoken;
        console.log(lonnglivepagesurl)
        const pagesdata = await axios
            .get(lonnglivepagesurl)
            .then();
        let map = new Map();

        await pagesdata
            .data
            .data
            .forEach(async function (item, index) {
                getinstagramid(item.id, item.access_token).then(function (value) {

                    var instagrampageid = value;
                    // if(instagrampageid != null){
                        let config = {
                            method: 'get',
                            maxBodyLength: Infinity,
                            url: 'https://graph.facebook.com/v13.0/'+value+'?fields=profile_picture_url&access_token='+longliveacesstoken,
                            headers: { }
                          };
                          let profileImage= new Map();

                          axios.request(config)
                          .then((response) => {
                            console.log("image",JSON.stringify(response.data.profile_picture_url));
                        //     profileImage.set(JSON.stringify(response.data.profile_picture_url));
                          
                        //   console.log("dk22233",profileImage);
                            // }
                            // console.log("the instagramid is " + JSON.stringify(instagrampageid));
                            if (instagrampageid != null) {
                                map.set(instagrampageid, longliveacesstoken);
                            }
                            

                            Brand.updateOne({
                                "_id": req.body._id
                            }, {
                                'instagramcredential': map,
                                'instagrampicture':JSON.stringify(response.data.profile_picture_url)
                            }, function (error, responc) {
                                console.log(responc);
                                
                                // if (response.nModified == 1) {

                                //     res.json({Status: 1, msg: "updated succesfully"})
                
                                // } else {
                                //     res.json({Status: 0, msg: "Not Updated/Dont tyr to Overwrite"})
                
                                // }

                            });
                        })
                        .catch((error) => {
                        profileImage="";
                        });
                });

            });
            res.json({Status: 1, msg: "updated succesfully"})
    }
     else {

        res.json({status: 0, msg: "Send all Necessary Fields"})
    }

}
exports.postToInsta = async (Instagramid, Content, Image,accesstoken) => {
    console.log("data");


    var base = 'https://graph.facebook.com/';
    var ping_adr = base + Instagramid + '/media?image_url=' + Image + '&caption=' + Content + '&access_token=' + accesstoken;
    const data= await axios
    .post(ping_adr).catch((err) => {
          if(err.code=='ERR_BAD_REQUEST'){
            
            console.log("Bad Request happen check credentials");
          }
          else{
            console.log(err.code);
          }
        });
    
console.log(data);
if(data){
    var container_ping_adr=base+Instagramid+'/media_publish?creation_id='+data.data.id+'&access_token=' + accesstoken;;
    console.log(container_ping_adr);
 
 const data2= await axios.post(container_ping_adr).catch((err)=>{
 
     console.log(err);
     
 });
 
 if(data2!=null){
    console.log("Posted on Instagram succesfull");
     return data2.data.id;
 
 }
 else{
 return null;
 }

}
else{
    return null;
}

  
}

exports.storyToInsta = async (Instagramid, accesstoken, Image) => {
   
    console.log(Image);
    var base_url = 'https://graph.facebook.com/v18.0/'
    var url = base_url + Instagramid + '/media?media_type=STORIES&caption=Hello World!&access_token='+accesstoken+'&image_url='+Image;
    try {
        const data= await axios .post(url).catch((err) => {
          if(err.code=='ERR_BAD_REQUEST'){
            
            console.log("Bad Request happen check credentials");
          }
          else{
            console.log(err.code);
          }
        });
        var post_id = data.data.id;
    }catch(error) {
        console.error('Error creating the post:', error.response.data);            
    }

    
    if(post_id)
    {
        var post_publish_url = base_url+Instagramid+'/media_publish?creation_id='+post_id+'&access_token=' + accesstoken;
        try {
                const data= await axios .post(post_publish_url).catch((err) => {
                if(err.code=='ERR_BAD_REQUEST'){
                    
                    console.log("Bad Request happen check credentials");
                }
                else{
                    console.log(err.code);
                }
                });
                return data.data.id;
        }catch(error) {
            console.error('Error creating the post:', error.response);
                
        }
    }  
}

exports.reelsToInsta = async (Instagramid, accesstoken, Image) => {
   
    console.log(Image);
    var base_url = 'https://graph.facebook.com/v18.0/'
    var url = base_url + Instagramid + '/media?media_type=REELS&caption=Hello World!&access_token='+accesstoken+'&video_url=https://8bittask.com/june/WhatsApp05.mp4';
    try {
        const data= await axios .post(url).catch((err) => {
          if(err.code=='ERR_BAD_REQUEST'){
            
            console.log("Bad Request happen check credentials");
          }
          else{
            console.log(err.code);
          }
        });
        var post_id = data.data.id;
    }catch(error) {
        console.error('Error creating the page id:', error);            
    }

    console.log(post_id);
    
    if(post_id)
    {
        var post_publish_url = base_url+Instagramid+'/media_publish?creation_id='+post_id+'&access_token=' + accesstoken;
        media_publish(post_publish_url);
  
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
    }  
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
            console.log(data);
            return data.data.id;
    }catch(error) {
        console.error('Error creating the post:',error.response);
            
    }
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