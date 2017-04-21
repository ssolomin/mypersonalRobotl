var Flint = require('node-flint');
var webhook = require('node-flint/webhook');
var express = require('express');
var bodyParser = require('body-parser');

var request = require("request");
var cron = require('node-cron'); 
    
var app = express();
app.use(bodyParser.json());

// flint options
var config = {
  webhookUrl: 'https://sparkbot-ssolomin.c9users.io/flint',
  token: 'YmYyMzQyODQtZGI2My00Y2E4LThlZmItM2U2MWZkNWEwM2I0OTA4Y2FmYzAtYTNj',
  port: 8080,
  removeWebhooksOnStart: false,
  maxConcurrent: 5,
  minTime: 50
};

// init flint
var flint = new Flint(config);
flint.start();

flint.hears('fuel', function(bot, trigger) {
  request("https://fuelcheck.nsw.gov.au/app/FuelPrice/ByLocation?latitude=-33.864&longitude=151.201&fuelType=P98&brands=7-Eleven&radius=400", function(error, response, body)
  {
    if(error) {
      console.log("Error: " + error);
    }
    console.log("Status code: " + response.statusCode);

    var text = body ;
    var i = 0;
    var string = "List of stations \r\n";
    var address = "";
    var price = "";
    for (i = 0; i <10; i++){
        address=text.match(/"Address":"([^"]+)",/g)[i];
        price=text.match(/"P98","Price":([^"]+)}/g)[i];
        string = string + price + address + "\r\n";
    
    }    
    bot.say(string);  
 
  });
  
});

flint.hears('fund', function(bot, trigger) {
  var string = "";
  var fundsize = "";
  var estimatedDefault = "";
   console.log("Begin");
  
  request("https://api.ratesetter.com.au/statistic/ValueOfProvisionFund", function(error, response, body)
  {
    if(error) {
      console.log("Error: " + error);
    }
    console.log("Status code: " + response.statusCode);

    var text = body ;
    console.log(text);
    fundsize=text.match(/{(.+)}/)[1];
    
    request("https://api.ratesetter.com.au/loans/stats/EstimatedDefaults", function(error, response, body)
    {
      if(error) {
        console.log("Error: " + error);
      }
      console.log("Status code: " + response.statusCode);

      var text = body ;
    
      console.log(text);
      estimatedDefault=text.match(/{(.+)}/)[1];
      console.log(fundsize);
      string = fundsize + "\r\n" + estimatedDefault;
      console.log(string);
      bot.say(string); 
 
    });
    
   });

    
});
//add flint event listeners

flint.on('spawn', function(bot) {
    cron.schedule('* * * * *', function(){
       console.log('running a task every minute');
       bot.say("Test each minute");
    });
  });

flint.on('message', function(bot, trigger, id) {
  flint.debug('"%s" said "%s" in room "%s"', trigger.personEmail, trigger.text, trigger.RoomTitle);
});

flint.on('initialized', function() {
  flint.debug('initialized %s rooms', flint.bots.length);
});

// define express path for incoming webhooks
app.post('/flint', webhook(flint));

// start express server
var server = app.listen(config.port, function () {
  flint.debug('Flint listening on port %s', config.port);
});

//schedule sending info 



// gracefully shutdown (ctrl-c)
process.on('SIGINT', function() {
  flint.debug('stoppping...');
  server.close();
  flint.stop().then(function() {
    process.exit();
  });
});
