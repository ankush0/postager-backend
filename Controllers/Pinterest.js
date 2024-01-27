const Brand=require('../Database/Model/Brand')
const axios=require('axios');
const fs = require('fs')
const path = require('path');

const { PINTEREST_API_URL } = require('../constants');


exports.AddApikeysandTokenPintrest = async (req, res) => {
try{
    if (req.body._id && req.body.Ptid && req.body.oauth_token && req.body._id.match(/^[0-9a-fA-F]{24}$/)) {

        let map = new Map();
        map.set(req.body.Ptid,req.body.oauth_token);
  
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

exports.post_to_pinterest = async (
    brandData,
    title,
    content,
    board,
    url,
    image
  ) => {
    const pinterest_access_token = getAccessToken(brandData);

    await axios.post(
      PINTEREST_API_URL,
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
          Authorization: `Bearer ${pinterest_access_token}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log('Posted to Pinterest Successfully')
};

exports.media_upload = async (brandData, fileName, pinData) => {
    const pinterest_access_token = getAccessToken(brandData);

    const { data } = await axios.post(
      "https://api.pinterest.com/v5/media",
      {
        media_type: "video",
      },
      {
        headers: {
           Authorization: `Bearer ${pinterest_access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const jsonPath = path.join(__dirname, '..', 'uploads', fileName);
    const uploadMetadata = new FormData();
    uploadMetadata.append('x-amz-date', data.upload_parameters['x-amz-date']);
    uploadMetadata.append('x-amz-signature', data.upload_parameters['x-amz-signature']);
    uploadMetadata.append('x-amz-security-token', data.upload_parameters['x-amz-security-token']);
    uploadMetadata.append('x-amz-algorithm', data.upload_parameters['x-amz-algorithm']);
    uploadMetadata.append('key', data.upload_parameters['key']);
    uploadMetadata.append('policy', data.upload_parameters['policy']);
    uploadMetadata.append('x-amz-credential', data.upload_parameters['x-amz-credential']);
    uploadMetadata.append('Content-Type', 'multipart/form-data');
    uploadMetadata.append('file', fs.readFileSync(jsonPath, 'utf-8'))

    const upload = await axios.post('https://pinterest-media-upload.s3-accelerate.amazonaws.com/', uploadMetadata)

    const uploadStatus = await axios.get(`https://api.pinterest.com/v5/media/${data['media_id']}`, {
        headers: {
            Authorization: `Bearer ${pinterest_access_token}`
        }
    })

    await axios.post(
        PINTEREST_API_URL,
        {
            title: pinData.title,
            description: pinData.content,
            board_id: pinData.board,
            media_source: {
                "source_type": "video_id",
                "cover_image_url": "https://picsum.photos/id/1/200/300",
                "media_id": uploadStatus.data["media_id"]
            },
        },
        {
            headers: {
                Authorization: `Bearer ${pinterest_access_token}`,
                "Content-Type": "application/json",
            },
        }
        );
}

exports.get_boards = async (req, res) => {
  if (req.body.userid && req.body.userid.match(/^[0-9a-fA-F]{24}$/)) {
    const brandData = await Brand.findById(req.body.Brand);
    const pinterest_access_token = getAccessToken(brandData);
    const response = await axios.get(`https://api.pinterest.com/v5/boards/`, {
      headers: {
        Authorization: `Bearer ${pinterest_access_token}`,
      },
    });
    res.json({ status: 1, data: response.data.items });
  } else {
    res.json({ status: 0, msg: "Please enter Valid Credentials" });
  }
};

function getAccessToken(brandData) {
    const { ptcredential } = brandData;
    const pinterest_access_token = ptcredential.values().next().value;
    return pinterest_access_token;
}
