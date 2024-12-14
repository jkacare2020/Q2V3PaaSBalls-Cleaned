const rateLimit = require("express-rate-limit");

const imageProcessLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each user to 30 requests per windowMs
  keyGenerator: (req, res) => req.user.uid, // Rate limit per user
  message:
    "Too many image processing requests from this user, please try again later.",
});

module.exports = imageProcessLimiter;
