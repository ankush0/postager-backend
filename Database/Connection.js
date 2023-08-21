const mong = require("mongoose");
require("dotenv").config();
mong.connect(process.env.DB_LINK, function (err, client) {
  console.log("Connected successfully to server");
});
module.exports = mong;