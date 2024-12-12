const {Brands} = require('../Database/Connection');
const Brand=Brands
const user = require('../Database/Connection').user;

const { get_boards } = require('../Controllers/Pinterest')
const axios = require('axios');

module.exports.AddNewBrand = async (req, res) => {
    console.log("req.body",req.body.mypic);
  
    // Image userid name
    try {
        if (req.body.name && req.body.userid && req.body.userid.match(/^[0-9a-fA-F]{24}$/)) {
         
            var name = req.body.name;
            var userid = req.body.userid;
            var newbrand = new Brand({

                userid: userid,
                name: name,
                facebookcredential: [],
                instagramid: "",
                instagramtoken: "",
                twitterid: "",
                twittertoken: "",
                linkedinid: "",
                linkedintoken: "",
                image: req.body.mypic,
                instagramcredential: []

            });

            var data = await newbrand.save();



            if (data) {
                var resultofupdate = await user.updateOne({ "_id": req.body.userid }, { $push: { "Brands": data._id } });

                res.json({ status: 1, mag: "Saved Succesfully" })


            } else {
                res.json({ status: 0, msg: "error with saving" })
            }
        } else {

            res.json({ status: 0, mag: "Give Valid Credentials" })
        }
    }
    catch (err) {

        console.log(err);
        res.json("Internal Servr Error watch logs for more information");
    }
};

module.exports.ShowAllBrands = async (req, res) => {
    console.log("brands req",req.body);
    try {
        if (req.body.userid && req.body.userid.match(/^[0-9a-fA-F]{24}$/)) {
            const InvitedBrandsData=[]
            const userRes= await user.find({_id:req.body.userid});
            console.log("userRes",userRes);
            if(userRes[0].invitedBy.length>0){
for(let i=0;i<userRes.invitedBy.length;i++){
    const brandData= await Brand.find({_id:userRes.invitedBy[i]});
    InvitedBrandsData.push(brandData[0]);
}
            }

            Brand.find({
                userid: req.body.userid
            }
        ).then( async (data) => {    
            console.log("data",data);

         data.map((item)=>{
                InvitedBrandsData.push(item);
            }
            )
                    res.json({ status: 1, data: InvitedBrandsData });

        }).catch((err) => {
           console.log(err);
                res.send("internal server error");
        
        });
        } else {
            res.json({ status: 0, msg: "Please enter Valid Credentials" })
        }
    }
    catch (err) {
        console.log(err);
        res.json("Internal Servr Error watch logs for more information");
    }
}

module.exports.UpdateBrand = async (req, res) => {
    try {
        var Image =  process.env.IMG_URL + req?.file?.filename;
        
        console.log(Image);
        switch (req.body.updateBrand) {
            case "save": if (req.body.name) {
                const updatedBrand = await Brand.updateOne({ _id: req.body._id }, { $set: { image: Image, name: req.body.name } })
                console.log(updatedBrand);
                if (updatedBrand.nModified > 0) {
                    res.json({ status: 1, message: "Brand updated successfully" });
                } else {
                    res.json({ status: 1, message: "Brand couldn't be updated" });
                }
            }
                break;
            case "subscription": if (req.body.type) {                
                var date = new Date(); // Now
                if(req.body.type=="2"){
                    date.setDate(date.getDate() + 365)
                    const updatedBrand = await Brand.updateOne({ _id: req.body._id }, { $set: { planName: "Yearly", planType: "Yearly", planPrice: "60", planExpiry: date.toISOString().split('T')[0] } })
                    console.log(updatedBrand);
                    if (updatedBrand.nModified > 0) {
                        res.json({ status: 1, message: "Brand updated successfully" });
                    } else {
                        res.json({ status: 1, message: "Brand couldn't be updated" });
                    }
                }else{
                    date.setDate(date.getDate() + 30)
                    const updatedBrand = await Brand.updateOne({ _id: req.body._id }, { $set: { planName: "Montly", planType: "Montly", planPrice: "5", planExpiry: date.toISOString().split('T')[0] } })
                    
                    if (updatedBrand.nModified > 0) {
                        res.json({ status: 1, message: "Brand updated successfully" });
                    } else {
                        res.json({ status: 1, message: "Brand couldn't be updated" });
                    }
                }
                // if (updatedBrand.nModified > 0) {
                //     res.json({ status: 1, message: "Brand updated successfully" });
                // } else {
                //     res.json({ status: 1, message: "Brand couldn't be updated" });
                // }
            }
                break;
            case "delete": const deleteBrand = await Brand.deleteOne({ _id: req.body._id })
                if (deleteBrand.deletedCount > 0) {
                    res.json({ status: 1, message: "Brand deleted successfully" });
                } else {
                    res.json({ status: 1, message: "Brand couldn't be deleted" });
                }
                break;
        }

    } catch (err) {
        console.log(err);
        res.json("Internal Servr Error watch logs for more information");
    }
}