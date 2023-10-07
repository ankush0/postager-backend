const Brand = require("../Database/Model/Brand");
const user = require("../Database/Model/User");
const User = require("../Database/Model/User");
const Plans = require("../Database/Model/Plans");

module.exports.AddNewBrand = async (req, res) => {
    // Image userid name
    try {
        if (req.body.name && req.body.userid && req.body.userid.match(/^[0-9a-fA-F]{24}$/)) {
            var Image = 'https://node.postager.com/images/' + req.file.filename;
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
                image: Image,
                instagramcredential: []

            });

            var data = await newbrand.save();



            if (data) {
                var resultofupdate = await user.updateOne({ "_id": req.body._id }, { $push: { "Brands": data._id } });

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
    try {
        if (req.body.userid && req.body.userid.match(/^[0-9a-fA-F]{24}$/)) {
            Brand.find({
                userid: req.body.userid
            }, function (err, result) {
                if (!err) {
                    res.json({ status: 1, data: result });
                } else {
                    res.send("internal server error");
                }
            })
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
        console.log(req.body.updateBrand);
        switch (req.body.updateBrand) {
            case "save": if (req.body.name) {
                const updatedBrand = await Brand.updateOne({ _id: req.body._id }, { $set: { name: req.body.name } })
                console.log(updatedBrand);
                if (updatedBrand.nModified > 0) {
                    res.json({ status: 1, message: "Brand updated successfully" });
                } else {
                    res.json({ status: 1, message: "Brand couldn't be updated" });
                }
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

module.exports.fileupload = async (req, res) => {
    // Create a route to handle binary data uploads.
    // const serverfile = require('../server.js');
    // var upload = serverfile.upload

    // // upload();
}

module.exports.Plans = async (req, res) => {
    try {

        const result = await Plans.find({})
        console.log(result);
        // const { _id, ...result } = plans[0];
        res.send({
            status: 1,
            data: result
        })
        // res.json({ plans })
        // if (req.body.userid && req.body.userid.match(/^[0-9a-fA-F]{24}$/)) {
        //     Brand.find({
        //         userid: req.body.userid
        //     }, function (err, result) {
        //         if (!err) {
        //             res.json({ status: 1, data: result });
        //         } else {
        //             res.send("internal server error");
        //         }
        //     })
        // } else {
        //     res.json({ status: 0, msg: "Please enter Valid Credentials" })
        // }
    }
    catch (err) {
        console.log(err);
        res.send({
            status: 0,
            data: "Internal Servr Error watch logs for more information"
        });
    }
}



