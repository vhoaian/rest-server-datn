var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send("<h1>RESTful API for the final-year project </h1>");
});

module.exports = router;
