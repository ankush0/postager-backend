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
      var lonnglivepagesurl='https://graph.facebook.com/v3.2/'+ req.body.facebookid+'/accounts?access_token='+longliveacesstoken;
      console.log(lonnglivepagesurl)
      const pagesdata=await axios.get(lonnglivepagesurl);
      let map = new Map();
      pagesdata.data.data.forEach(function (item, index) {
        // console.log("itemsis "+item)
        // console.log(item.id);
        // console.log("url "+req.body.fbpicture);
        map.set(item.id,item.access_token);
      });
      console.log(map);
  
       Brand.updateOne({
            "_id": req.body._id
        }, {
            'facebookcredential':map,
            'fbpicture':req.body.fbpicture
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