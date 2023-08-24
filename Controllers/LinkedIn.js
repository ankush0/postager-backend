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

exports.AddLinkdinToken = async (req, res) => {
try{
    if (req.body._id && req.body.linkdinid && req.body.oauth_token && req.body._id.match(/^[0-9a-fA-F]{24}$/)) {

        let map = new Map();
        map.set(req.body.linkdinid,req.body.oauth_token);
        console.log(map);
  
       Brand.updateOne({
            "_id": req.body._id
        }, {
            'linkdinCredential':map,
            'linkdinPicture':req.body.linkdinPicture
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

exports.removeLinkdinToken = async (req, res) => {
    try{
        if (req.body._id && req.body._id.match(/^[0-9a-fA-F]{24}$/)) {
    
            let map = new Map();
            map.set("","");      
           Brand.updateOne({
                "_id": req.body._id
            }, {
                'linkdinCredential':"",
                'linkdinPicture':""
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

