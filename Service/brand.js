const Brand = require("../Database/Model/Brand");
const user = require("../Database/Model/User");
const User = require("../Database/Model/User");
const axios = require('axios');

module.exports.AddNewBrand = async (req, res) => {
    // Image userid name
    try {
        if (req.body.name && req.body.userid && req.body.userid.match(/^[0-9a-fA-F]{24}$/)) {
            var Image =  process.env.IMG_URL + req.file.filename;
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
        console.log("llll",req.body.updateBrand);

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

module.exports.pinterestBrands = async (req, res) => {
    try {
        if (req.body.userid && req.body.userid.match(/^[0-9a-fA-F]{24}$/)) {

            // try {
                var branddata = await Brand.findById(req.body.Brand, function (err, result) {

                    if (err) throw err;
                })
                for (let [key, value] of branddata.ptcredential) {
                    let containerParams = new URLSearchParams();
                    var pageid = key;
                    var accesstoken = value;
                    const response = await axios.get(
                    `https://api.pinterest.com/v5/boards/`,
                    {
                        headers: {
                        Authorization: `Bearer ${accesstoken}`
                        }
                    }
                    );
                    console.log(response.data.items);
                    res.json({ status: 1, data: response.data.items });
                    console.log('Boards retrieved successfully!');
                    // console.log(response.data.items[0].id);
                    // var board_id = response.data.items[0].id;
                }
            // } catch (error) {
            //     console.error('Error retrieving boards:', error.response.data);
            // }
            // Brand.find({
            //     userid: req.body.userid
            // }, function (err, result) {
            //     console.log(result);
            //     if (!err) {
            //         res.json({ status: 1, data: result });
            //     } else {
            //         res.send("internal server error");
            //     }
            // })
        } else {
            res.json({ status: 0, msg: "Please enter Valid Credentials" })
        }
    }
    catch (err) {
        console.log(err);
        res.json("Internal Servr Error watch logs for more information");
    }
}