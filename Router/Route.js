const express = require("express");
const router = express.Router();
const Brand = require("../Service/brand.js");
const LoginService = require("../Service/login.service.js");
const ScheduleService = require("../Service/schedule.service.js");
const Post = require("../Service/post.js");
const Story = require("../Service/story.js");
const Reels = require("../Service/reels.js");
const LoginServiceNew = require("../Service/new.login.js");
const Stripe = require("../Service/stripe");
const Team = require("../Service/team");
const Linkedin = require("../Controllers/LinkedIn");
const Youtube = require("../Controllers/Youtube");
const Pinterest = require("../Controllers/Pinterest");
const Twitter = require("../Controllers/Twitter")
const Facebook = require('../Controllers/Facebook');
const Instagram = require('../Controllers/Instagram');
var auth = require('../Service/auth');

router.post('/Signin', LoginService.Login);
router.post('/googleLogin', LoginService.googleLogin);

router.post('/Signup', LoginService.Signup);
router.post('/VerifyCode', LoginService.VerifyCode);
router.post('/NewPassward', LoginService.NewPassward);
router.post('/ForgotPassward', LoginService.ForgetPassward);

router.post('/ProfileUpdate', LoginService.UpdateAccount);  //--By Shahzama

router.post('/Post_To_All_SocialMedia_Scheduling', LoginService.Post_To_All_SocialMedia_Scheduling)




router.post('/Post_To_All_SocialMedia_Scheduling_Post', ScheduleService.Post_To_All_SocialMedia_Scheduling_Post)
router.post('/post/schedule', ScheduleService.Post_Scheduling)





router.post('/Post_To_All_SocialMedia_Immediatly', Post.Post_To_All_SocialMedia_Immidiatly);
router.post('/Story_To_All_SocialMedia_Immediatly', Story.Story_To_All_SocialMedia_Immediatly)
router.post('/Reels_To_All_SocialMedia_Immediatly', Reels.Reels_To_All_SocialMedia_Immediatly)
router.post('/Show_All_Post', LoginService.Show_All_Post);
router.post('/Show_Scheduled_Post', LoginService.Show_Scheduled_Post);
router.post('/Show_Live_Post', LoginService.Show_Live_Post);

router.post('/fileupload', LoginServiceNew.fileupload)

// router.post('/Facebook/Create',auth,LoginService.CreateFacebookPost);
// router.post('/Instagram/Create',auth,LoginService.CreateInstagramPost);

// router.post('/Twiter/Create',auth,LoginService.CreateTweeterPost);
// only used in testing purpose


// ----------->>>>>>>><<<<<<<<<------------------//
router.post('/stripe/generate/clientSecret', Stripe.GenerateKey);
router.post('/stripe-url', Stripe.UrlGenerate);

router.post('/AddNewBrand', Brand.AddNewBrand);
router.post('/ShowAllBrands', Brand.ShowAllBrands);
router.post('/UpdateBrand', Brand.UpdateBrand);

router.get('/Plans', LoginServiceNew.Plans);  

// router.post('/GetAuthLink/Linkedin', Linkedin.GetAuthLink);
// router.get('/LinkedIn/callback', Linkedin.Callback);

// router.post('/GetAuthLink/Pinterest', Pinterest.GetAuthLink);
// router.get('/Pinterest/callback', Pinterest.Callback);

router.get('/GetAuthLink/Twitter', Twitter.GetAuthLink);
router.get('/twitter/callback', Twitter.Callback);

router.post('/AddApikeysandTokenFacebook', Facebook.AddApikeysandTokenFacebook);
router.post('/removeApikeyFacebook', Facebook.removeApikeyFacebook);

router.post('/AddApikeysandTokenInstagram', Instagram.AddApikeysandTokenInstagram);
router.post('/removeApikeyInstagram', Instagram.removeApikeyInstagram);


router.post('/AddApikeysandTokenPintrest', Pinterest.AddApikeysandTokenPintrest);
router.post('/getPinterestBoards', Pinterest.get_boards)


router.post('/AddTwitterToken', Twitter.AddTwitterToken);
router.post('/removeTwitterToken', Twitter.removeTwitterToken);

router.post('/AddLinkdinToken', Linkedin.AddLinkdinToken);
router.post('/removeLinkdinToken', Linkedin.removeLinkdinToken);

router.post('/AddYouTubeToken', Youtube.AddYouTubeToken);
router.post('/removeYouTubeToken', Youtube.removeYouTubeToken);


router.post('/removeApikeyPintrest', Pinterest.removeApikeyPintrest);

router.post('/GetallComment', Facebook.Getallcomments)
router.get('/Addnewuser')
// router.post('ReplyToComment',Facebook)
router.post('/sendMail', Team.sendMail);
router.post('/team', Team.team);

module.exports = router;