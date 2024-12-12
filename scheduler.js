// queue.js
const Brand = require("./Database/Connection").Brands;
const dayjs = require("dayjs");
require('dayjs/locale/en');

const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.locale('en');
dayjs.extend(customParseFormat);
const queue = [];
let platfromId;
const { default: axios } = require("axios");
const cron = require("node-cron");
let cronJob;
async function getAllDocs() {
  const user = await Brand.find();
  const SchedulePostsArray = user.map((item) => {
    return {
      objectId: item._id,
      media: item.scheduledMedia,
      fbId: item.facebookcredential.keys().next().value,
      fb_access_token: item.facebookcredential.values().next().value,
      instaId: item.instagramcredential.values().next().value,
    };
  });

  console.log("SchedulePostsArray", SchedulePostsArray);

  console.log(user);
  for (let i = 0; i < SchedulePostsArray.length; i++) {
    const media = SchedulePostsArray[i].media;

    for (let j = 0; j < media.scheduledPostId.length; j++) {
      let element = null;
      element = media.scheduledPostId[j];
      queue.push({
        documentId: SchedulePostsArray[i].objectId,
        fb_post_id: element.fb_post_id.length != 0 ? element.fb_post_id : null,
        insta_post_id:
        element.insta_post_id.length != 0 ? element.insta_post_id : null,
        post_time: media.time[j][1],
        post_date: media.time[j][0],
        fb_access_token: SchedulePostsArray[i].fb_access_token,
        fbId: SchedulePostsArray[i].fbId,
        instaId: SchedulePostsArray[i].instaId,
        post_type: element.post_type,
      });
    }
  }
  console.log("date", queue);
}
function startCronJob() {
  // Stop any existing cron j
  console.log("Starting cron job...");
  if (cronJob) {
    cronJob.stop();
    console.log("Existing cron job stopped.");
  }

  // Start a new cron job
  cronJob = cron.schedule("*/5 * * * * *", () => {
    // Runs every 5 seconds for example

    console.log("Cron job running. Current queue:");

    // Perform actions based on queue items
    if (queue.length > 0) {
      for (let i = 0; i < queue.length; i++) {
        const postTime = queue[i].post_time.trim();
        const postDate = queue[i].post_date.trim();
        const dateWithoutWeekday = postDate.replace(/^([a-zA-Z]+,?\s)/, '').trim();
        console.log("postDate:", postDate); // Should print: "Sunday, December 1"
console.log("postTime:", postTime); 

        const combinedDateTime = dayjs(
          `${dateWithoutWeekday} ${postTime}`,
          "MMMM D, YYYY h:mm A" ,
          true
        );
        console.log("Is valid:", combinedDateTime.isValid());
        const unixTimestampPost= combinedDateTime.unix();
        const unixTimestampNow = Math.floor(Date.now() / 1000);
        console.log("unixTimestampPost", unixTimestampPost);
        
        console.log("unixTimestampNow ", unixTimestampNow);
        if (unixTimestampNow >= unixTimestampPost) {
          console.log("time is less than unix now")
          if (queue[i].insta_post_id != null) {
            postToInstagram(
              queue[i].insta_post_id,
              queue[i].fb_access_token,
              queue[i].instaId,
              queue[i].post_time,
              queue[i].post_date,
             queue[i].documentId,
             queue[i].post_type,
             queue[i].fb_post_id           
            );
            queue.shift();
          }
        }
      }
      console.log("Processing item:");
      // Add logic to process items here
    } else {
      console.log("Queue is empty.");
    }
  });
  console.log("New cron job started.");
}
// Function to add an item to the queue and trigger onChange callback
function addToQueue(item) {
  queue.push(item);
  console.log(`Added "${item}" to the queue. Current queue:`, queue);
}
async function postToInstagram(
  post_id_array,
  access_token,
  instaId,
  post_time,
  post_date,
  documentId,
  post_type,
  fb_post_id

) {
  try {
    for (let i = 0; i < post_id_array.length; i++) { 
    const publishResult = await axios.post(
      `https://graph.facebook.com/v21.0/${instaId}/media_publish`,
      {
        creation_id: post_id_array[i],
        access_token: access_token,
      }
    );
    console.log("instagramPostresult", publishResult.data);
  }

    //deleting and updating the document

    let index=null;
    const brand = await Brand.findOne({ _id:documentId});
    const media = brand.scheduledMedia;
    for (let i = 0; i < media.scheduledPostId.length; i++) {
      for(let j=0;j<media.scheduledPostId[i].insta_post_id.length;j++){
      if (media.scheduledPostId[i].insta_post_id[j] == post_id_array[0]) {
        index = i;
        break;
      }
    }
    }
  const finalArray=[]
  const temp_media_id=[]
  const media_id=[]
  const platform=[]
  const scheduledPostId=[]
  const time=[]

  for(let j=0;j<media.scheduledPostId.length;j++){
if(j!=index){
media_id.push(media.media_id[j])
platform.push(media.platform[j])
scheduledPostId.push(media.scheduledPostId[j])
time.push(media.time[j])

}
else temp_media_id.push(media.media_id[j])

  }
  finalArray.push({
    media_id:media_id,
    platform:platform,
    scheduledPostId:scheduledPostId,
    time:time
  })
  const updatedBrand = await Brand.findOneAndUpdate(
    { _id:
      documentId 
    },
    {
      scheduledMedia: finalArray[0],
    },
    { new: true }
  );


    console.log("Element(s) removed successfully");
    console.log("updating published media......")
    await Brand.findByIdAndUpdate(
      documentId,
      {
        $push: {
          "media.media_id":  temp_media_id,
          "media.platform":fb_post_id ==null ? ["instagram"]:[ "facebook", "instagram"],
          "media.time": [post_date, post_time],
          "media.published_posts_id": {
            fb_post_id:fb_post_id ==null ? [] : fb_post_id,
            insta_post_id: post_id_array,
            post_type: post_type
          },
        },
      },
      { new: true }
    );
  } catch (error) {
    console.error("Error removing element:", error.response.data);
  }
}
startCronJob();
// Other queue functions
function removeFromQueue() {
  return queue.shift();
}

function getQueue() {
  return [...queue];
}

getAllDocs();
module.exports = { addToQueue, removeFromQueue, getQueue, startCronJob };
