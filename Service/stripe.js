const Brand = require("../Database/Model/Brand");
const user = require("../Database/Model/User");
const User = require("../Database/Model/User");
const Plans = require("../Database/Model/Plans");
const express = require("express");
const app = express();

module.exports.GenerateKey = async (req, res) => {
    // Image userid name
    console.log("dheeraj111");
        const stripe = require('stripe')('sk_test_51N2iHTSBiundrGH2TYnS55J0hFdkgh0v92omGHYn3I5kuWhD8B5urDblO6d5wzA13skPv1UX2YGiDohEylq5MnmA00IXA1o2dp');
    try {
    await stripe.paymentIntents.create(
      {
        currency: "EUR",
          amount: 1999,
          automatic_payment_methods: { enabled: true },
      },
      function (err, paymentIntent) {
        if (err) {

          throw new Error(err);
        }
        res.send({
          clientSecret: paymentIntent.client_secret,
        });
      }
    );
  } catch (err) {
    console.log(err, "error occure");
  }
};

module.exports.UrlGenerate = async (req, res) => {
  // Image userid name
  console.log("dheeraj111");
      // const stripe = require('stripe')('sk_test_51N2iHTSBiundrGH2TYnS55J0hFdkgh0v92omGHYn3I5kuWhD8B5urDblO6d5wzA13skPv1UX2YGiDohEylq5MnmA00IXA1o2dp');
  try {
  // Set your secret key. Remember to switch to your live secret key in production.
  // See your keys here: https://dashboard.stripe.com/apikeys
  const stripe = require('stripe')('sk_test_51N2iHTSBiundrGH2TYnS55J0hFdkgh0v92omGHYn3I5kuWhD8B5urDblO6d5wzA13skPv1UX2YGiDohEylq5MnmA00IXA1o2dp');

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: 'price_1OF8USSBiundrGH29F6JxOam',
        quantity: 1,
      }
    ],
    mode: 'subscription',
    success_url: 'http://localhost:3000/',
    cancel_url: 'http://localhost:3000/',
  });
  console.log(session.url)
  res.send({
    url: session,
  });
  return session.url;
} catch (err) {
  console.log(err, "error occure");
}
};


