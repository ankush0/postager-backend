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

exports.AddApikeysandTokenPintrest = async (req, res) => {
try{
    if (req.body._id && req.body.Ptid && req.body.oauth_token && req.body._id.match(/^[0-9a-fA-F]{24}$/)) {

        let map = new Map();
        map.set(req.body.Ptid,req.body.oauth_token);
        console.log(map);
  
       Brand.updateOne({
            "_id": req.body._id
        }, {
            'ptcredential':map,
            'ptpicture':req.body.ptpicture
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

exports.removeApikeyPintrest = async (req, res) => {
    try{
        if (req.body._id && req.body._id.match(/^[0-9a-fA-F]{24}$/)) {
    
            let map = new Map();
            map.set("","");      
           Brand.updateOne({
                "_id": req.body._id
            }, {
                'ptcredential':"",
                'ptpicture':""
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

exports.post_to_pintrest = async (
    accessToken,
    title,
    content,
    board,
    url,
    image
  ) => {
    await axios.post(
      `https://api.pinterest.com/v5/pins`,
      {
        title: title,
        description: content,
        board_id: board,
        media_source: {
          source_type: "image_base64",
          content_type: image.startsWith("data:image/png;base64") ? "image/png" : "image/jpeg" ,
          data: image.replace("data:image/png;base64,", "").replace("data:image/jpeg;base64,"),
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log('Posted to Pinterest Successfully')
  };