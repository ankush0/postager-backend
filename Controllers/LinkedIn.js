const request = require('request');
const Brand=require('../Database/Model/Brand')
const validator = require('validator');
const axios = require('axios');
const querystring = require('querystring');

function getAccessToken(req) {
    console.log("code ",req.query);
    const { code ,state} = req.query;
    brandid=state;
    console.log("the brand id id "+brandid)
    console.log("the brand code ", code)
    const body = {
        grant_type: 'authorization_code',
        code:code,
        redirect_uri: "http://localhost:4000/api/v1/LinkedIn/callback",
            client_id: '77tahv0oyksnlz',
            client_secret: 'hIi8GEYB5i5OvozI'
    };

    // try {

    //     // Exchange the authorization code for an access token
    //     const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', querystring.stringify({
    //       grant_type: 'authorization_code',
    //       code: code,
    //       redirect_uri: process.env.TwitterRedirectURI,
    //         client_id: process.env.Twitterid,
    //         client_secret: process.env.TwitterSecret
    //     }));

    //     const { access_token } = tokenResponse.data;

    //     // Do something with the access_token
    //     console.log(access_token);

    //     res.send('Access token obtained successfully!');
    //   } catch (error) {
    //     console.error('Error obtaining access token:', error.message);
    //     res.status(500).send('Error obtaining access token');
    //   }

    return new Promise((resolve, reject) => {
        
        request.post({url:'https://www.linkedin.com/oauth/v2/accessToken', form: body }, (err, response, body) => 
        { 
           
        if(err) {
            reject(err);
            console.log(err);
        }
      var senddata={
     'body':JSON.parse(body),
     'brandid':brandid

      }
        resolve((senddata));
    }
    );
    });
}
function getLinkedinId(req,token) {
    console.log("come to get linkedin id")
    return new Promise((resolve, reject) => {
        const url = 'https://api.linkedin.com/v2/me';
        const headers = {
            'Authorization': 'Bearer ' + token,
            'cache-control': 'no-cache',
            'X-Restli-Protocol-Version': '2.0.0' 
        };

        request.get({ url: url, headers: headers }, (err, response, body) => {
            if(err) {
                reject(err);
            }
            resolve(JSON.parse(body).id);
        });
    });
}
function  publishContent(linkedinId, content,token) {
    const url = 'https://api.linkedin.com/v2/shares';
    const { title, text, shareUrl, shareThumbnailUrl } = content;
    const body = {
        owner: 'urn:li:person:' + linkedinId,
        subject: title,
        text: {
            text: text
        },
        content: {
            contentEntities: [{
                entityLocation: shareUrl,
                thumbnails: [{
                    resolvedUrl: shareThumbnailUrl
                }]
            }],
            title: title
        },
        distribution: {
            linkedInDistributionTarget: {}
        }
    };
    const headers = {
        'Authorization': 'Bearer AQVQ08DdU1uDszCsif5jUfzpOhtnme43dSy7j07cqbqRRJSJaQj8MHy0WiYdYRkIyjggt4jgOgt7q-wLnAAiNop3usDAF7NIMGiQFXpbZHUcHxfd1WOzOaJ7ziwVSkizdX8dw85dkjtPRMw7vdrTqVukNP7qx_LK_gAGFD_UR-CZg7rRzMSXnLyi5Xv6-eaNctEFnBIG5r9m1F9r8Uw_Rs-7V9WO86blXpTLqheX_4Kb5TVVy9-2uBZ6aTyCzfVPzT8DhgJ65bK0qTtKYlNcRnN5PHOSXPKsjQ_IutxREdHBph1UiyjZ2qISY2pNByDsUlvtHdhJPRGFYG1sUDC827AXWZTXSg',
        'cache-control': 'no-cache',
        'X-Restli-Protocol-Version': '2.0.0',
        'x-li-format': 'json'
    };

    return new Promise((resolve, reject) => {
        request.post({ url: url, json: body, headers: headers}, (err, response, body) => {
            if(err) {
                console.log(err);
                reject(err);
            }
            resolve(body);
        });
    });

}

exports.GetAuthLink = async (req, res) => {
   try{




    if (req.body.userid.match(/^[0-9a-fA-F]{24}$/)&&req.body.brandid.match(/^[0-9a-fA-F]{24}$/)) {
      
        // req.session.userid=req.body.userid;


        const state = req.body.brandid;
        const scope = encodeURIComponent(
            'r_liteprofile r_emailaddress w_member_social'
        );
        
        const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.Twitterid}&redirect_uri=${encodeURIComponent(
        process.env.TwitterRedirectURI
        )}&state=${state}&scope=${scope}`;
        res.send(url);

    } else {

      res.json({status: 0, mag: "check you Crendentials"})

    }
   }
   catch(err){

    console.log('error in getting auth link');
    console.log(err);
   }
}

exports.Callback = async (req, res) => {
    try{
    console.log(process.env.Twitterid);
    // if(!req.query.code) {
    //     console.log("i have been called at this time")
    //     res.send("Oops we did not get your code");
    //     return;
    // }
    // try {

    //     // Exchange the authorization code for an access token
    //     const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', querystring.stringify({
    //       grant_type: 'authorization_code',
    //       code: req.query.code,
    //       redirect_uri: "http://localhost:4000/api/v1/LinkedIn/callback",
    //         client_id: '77tahv0oyksnlz',
    //         client_secret: 'hIi8GEYB5i5OvozI'
    //     }));

    //     const { access_token } = tokenResponse.data;

    //     // Do something with the access_token
    //     console.log(access_token);

    //     res.send('Access token obtained successfully!');
    //   } catch (error) {
    //     console.error('Error obtaining access token:', error.message);
    //     res.status(500).send('Error obtaining access token');
    //   }
    try {



        const dataget = await getAccessToken(req);
      
       const data=dataget.body;
       console.log(data);
        // if(data.access_token) {
        //     req.session.token = data.access_token;
        //     req.session.authorized = true;
        
        // }
        const id= await getLinkedinId(req,data.access_token);
        console.log(id);
     var savedresponce=  await Brand.findByIdAndUpdate({'_id':dataget.brandid},{'linkedinid':id ,
            'linkedintoken': data.access_token},function(error,response){
             
            if(error){
         
         
             console.log(error);
            }
         
            if(!error){
         
             console.log("updated Document"+savedresponce)
            }
         
         });
if(savedresponce){

  console.log("we have saved the document succesfully")
}
        res.send(savedresponce);
    } catch(err) {
        console.log(err);
    }

}catch(err){

    console.log("error in gettiing  callback")
}
}

exports.PublishLinkedIn=async(title, text, url, thumb, id,token)=>{

   
    const errors = [];

    if(validator.isEmpty(title)) {
        errors.push({ param: 'title', msg: 'Invalid value.'});
    }
    if(validator.isEmpty(text)) {
        errors.push({ param: 'text', msg: 'Invalid value.'});
    }
    if(!validator.isURL(url)) {
        errors.push({ param: 'url', msg: 'Invalid value.'});
    }
    if(!validator.isURL(thumb)) {
        errors.push({ param: 'thumb', msg: 'Invalid value.'});
    }

    if(errors.length > 0) {
        res.json({ errors });
    } else {
        const content = {
            title: title,
            text: text,
            shareUrl: url,
            shareThumbnailUrl: thumb
        };

        try {
            const response = await publishContent( id, content,token);
            
          console.log("uploaded succesfully on linkedin")
          return response
        } catch(err) {
            console.log(err);
            console.log("can not upload succesfully on Linekedin");
        }
    }   




}