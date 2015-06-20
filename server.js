var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var app = express();

var sendError = function(res, errorMessage) {
  res.send({
    'type': 'error',
    'message': errorMessage
  });
};

var parseTweets = function(body) {
  var $ = cheerio.load(body);

  var tweets = [];

  $('ol.stream-items li.stream-item').each(function(i, element) {
	    var id = $(this).attr('data-item-id');
	    var time = new Date();
	    var thumbnailurl = "";
	    var videourl = "";
	    
	    
	    if($(this).find("div[data-card-type='photo']").length > 0){
	    	thumbnailurl =  $('.media-thumbnail', this).attr('data-url');
	    }else if($(this).find("div[data-card2-type='animated_gif']").length > 0){
	    	thumbnailurl =  $('video', this).attr('poster');	    	
	    	videourl =  $('source', this).attr('video-src');
	    }else if($(this).find("div[data-card-name='player']").length > 0){
	    	videourl =  "https://twitter.com" + $('.js-macaw-cards-iframe-container', this).attr('data-full-card-iframe-url');
	    }
	    if($(this).find("div.content div.stream-item-header small.time a span")){
	    	time = $('.js-short-timestamp', this).attr('data-time');
	    }
	    var text = $('.js-tweet-text', this).text();
	    text = text.replace('â€¦', '');
	    text = text.trim();
	    if(typeof text != 'undefined' && text != null && text != ''){
		    tweets.push({
		      createdAt: parseInt(time, 10),
		      id: id,
		      text: text,
		      thumbnail: thumbnailurl,
		      video:videourl
		    });
	  	}
	  });

  return tweets;
};

var getTweets = function(res, id) {
  request({
    url: 'https://twitter.com/whatstrending' + (id === 'undefined' || id.length == 0 ? "" : "/" + id) 
  }, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var tweets = parseTweets(body);
      res.send({
        id: id,
        tweets: tweets
      });
    }
  });
};

var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

  // intercept OPTIONS method
  if ('OPTIONS' == req.method) {
    res.send(200);
  }
  else {
    next();
  }
};

app.use(allowCrossDomain);
app.get('/:id?', function(req, res){
  var id = req.params.id;
  var tweets = [];

  if (!id) {
	  tweets = getTweets(res, "");
  } else {
	  tweets = getTweets(res, id);
  }

});

var port = process.env.PORT || 3000;
app.listen(port);
