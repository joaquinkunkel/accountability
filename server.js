///////////////////////////////////////////////////////////
////// DEPENDENCIES
///////////////////////////////////////////////////////////
var express = require('express');
var app = express();
var bp = require('body-parser');
var fs = require('fs');
var sgMail = require('@sendgrid/mail');
var path = require('path');
var schedule = require('node-schedule');
var cookieParser = require('cookie-parser');
var mongoose = require('mongoose');

///////////////////////////////////////////////////////////
////// GLOBAL VARIABLES
///////////////////////////////////////////////////////////
var port = 8000;
var API_KEY;
var TEMPERATURE_LOGS_PATH = 'data/places_data.json';
var FACILITIES_REPORTS_EMPTY_PATH = 'data/facilities_reports_empty.json';
var FACILITIES_REPORTS_PATH = 'data/facilities_reports_daily.json';
var TEMP_CODED_ARRAY = [{string:"freezing",num:1}, {string:"cold",num:2}, {string:"cool",num:3}, {string:"nice",num:4}, {string:"warm",num:5}, {string:"hot",num:6}];
var DAILY_REPORTS_RECIPIENT = 'mk4908@nyu.edu'; //change the address to 'nyuad.facilities@nyu.edu' if you want to send data to facilities

///// LOAD IN THE API KEY
fs.readFile('API_KEY.txt','utf-8',function(err,data){
  if (err) throw err;
  API_KEY = data.toString();
  //console.log('we have successfully read and stored our mailgun api key');
});

///// UTIL FUNCTION FOR MAPPING REPORTED TEMPERATURE VALUES FROM NUMBER TO STRING
function temp_map(number){
  for(var i = 0; i < TEMP_CODED_ARRAY.length;i++){
    if(TEMP_CODED_ARRAY[i].num === number){
      return TEMP_CODED_ARRAY[i].string;
    };
  };
};

///// SEND AN EMAIL FUNCTION
function sendMail(mail_recipient,report_string){
  console.log('sending an email!');
  
  var recipient = mail_recipient;
  var accountability_about_page = 'https://politicsofcode.biz:8016/about';
  var sender = 'NYUAD ACcountability <mk4908@nyu.edu>';
  var email_body = '';

  email_body +='Dear Madam or Sir,<br /><br />NYUAD community members have reported extreme temperatures in spaces around campus today and would like to see the air conditioning in spaces listed below checked and adjusted.</br /><br /><br />';
  email_body += report_string;
  email_body += '<i>This email was generated through the ACcountability project by Miha Klasinc and Joaquin Kunkel. ';
  //email_body +=' Our project serves as a reminder that exceedingly low AC temperatures not only have a negative impact of students\' well-being, but also result in economic loss and environmental damage.</i><br />';
  email_body += 'Find out more about the project at ' + accountability_about_page + '. ';
  email_body += 'If you have any questions or concerns, feel free to contact Miha or Joaquin at mk4908@nyu.edu or jek537@nyu.edu, respectively.</i><br /><br />';
  email_body += 'Kind regards,<br />ACcountability team';
  
  sgMail.setApiKey(API_KEY);
  var  msg = {
    to: recipient, //recipient, which is the nyuad.facilities
    from: 'NYUAD ACcountability <miha.klasinc@gmail.com>',
    subject: 'Facilities request: A/C temperature',
    html: email_body
  };
  sgMail.send(msg);
}

///// CONNECT TO MONGOOSE
/*mongoose.connect('mongodb://127.0.0.1/test');
var my_database = mongoose.connection;
my_database.on('error', console.error.bind(console, 'connection error:'));
my_database.on('openUri', function(){
  console.log("connections to the database successful!////////////////////////////////////////////////");
});

/*var mongoDB = 
    process.env.MONGOLAB_URI ||
    process.env.MONGODB_URI ||
    process.env.MONGOHQ_URL ||
    'mongodb://localhost/my_database';

mongoose.connect(mongoDB, {useMongoClient: true}, function(err){
    if (err) {
      console.log ('ERROR connecting' + err);
    } else {
      console.log ('Succeeded connected');
    }
});

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));*/

///////////////////////////////////////////////////////////
////// POST TO DAILY REPORTS DATABASE
///////////////////////////////////////////////////////////
function submit_facilities_report(report_location,report_temp){
  //console.log('here is what the user wants to post to facilities:',report_location, ' feels ', report_temp,' at the moment.');
  fs.readFile(FACILITIES_REPORTS_PATH,function(error,data){
    var reports = JSON.parse(data);
    var places_array = reports.all_places;
    for(var i = 0; i< places_array.length; i++){
      if(places_array[i].name === report_location){
        places_array[i].logs.push(report_temp);
      };
    };
    fs.writeFile(FACILITIES_REPORTS_PATH,JSON.stringify(reports),function(error){
      if(error) throw error;
      console.log('we have updated the facilities report database!');
    });
  });
};

///////////////////////////////////////////////////////////
////// COLELCT DAILY REPORTS
///////////////////////////////////////////////////////////
function collect_daily_reports(recipient){
  var report_recipient = recipient || 'mk4908@nyu.edu';
  var email_string = '';
  email_string += '<ul>';
    fs.readFile(FACILITIES_REPORTS_PATH,function(error,data){
        console.log('we are ready to collect reports for a new day!');
        function getSum(total, num) {
          return total + num;
        };
        var reports = JSON.parse(data);
        var places_array = reports.all_places;
        var facilities_report_counter = 0;
        for(var i = 0; i< places_array.length; i++){
          if(places_array[i].logs.length > 0){
            console.log('here are my facilities report logs:',places_array[i].logs);
            var counter_low_temp = 0;
            var counter_high_temp = 0;
            var high_temp_array = [];
            var low_temp_array = [];
            for(var j = 0; j < places_array[i].logs.length; j++){
              if(places_array[i].logs[j] < 3){
                counter_low_temp++;
                low_temp_array.push(places_array[i].logs[j]);
              }else if(places_array[i].logs[j] > 4){
                counter_high_temp++;
                high_temp_array.push(places_array[i].logs[j]);
              };
            };

            var ht_avg = high_temp_array.length === 0 ? undefined : temp_map(Math.round(high_temp_array.reduce(getSum) / counter_high_temp));
            var lt_avg = low_temp_array.length === 0 ? undefined : temp_map(Math.round(low_temp_array.reduce(getSum) / counter_low_temp));
            var object_sing_pl = places_array[i].name.slice(-1) === 's' ? 'are' : 'is';
            var subject_sing_pl = places_array[i].logs.length < 2 ? ' person has reported that ' : ' people have reported that ';
            //console.log(places_array[i].name);

            if(ht_avg && lt_avg){
              if(counter_high_temp > counter_low_temp){
                email_string += '<li>' + counter_high_temp + subject_sing_pl + places_array[i].name + ' ' + object_sing_pl + ' ' + ht_avg + ' on average </li><br />';
              }else{
                email_string += '<li>' + counter_low_temp + subject_sing_pl + places_array[i].name + ' ' + object_sing_pl + ' ' + lt_avg + ' on average </li><br />'; 
              }
              facilities_report_counter++;
            }else if(ht_avg || lt_avg){
              if(ht_avg){
                email_string += '<li>' + counter_high_temp + subject_sing_pl + places_array[i].name + ' ' + object_sing_pl + ' ' + ht_avg + ' on average </li><br />';
              }else{
                email_string += '<li>' + counter_low_temp + subject_sing_pl + places_array[i].name + ' ' + object_sing_pl + ' ' + lt_avg + ' on average </li><br />';
              }
              facilities_report_counter++;
            }
            //console.log('in ',places_array[i].name, ' the average high temperature is: ', ht_avg, ' and the avarage low temp is: ', lt_avg);
          };
        };
        email_string += '</ul>';
        console.log(email_string);
        if(facilities_report_counter > 0){
          console.log('we have enough reports, sending an email to facilities!');
          sendMail(report_recipient,email_string);
        }else{
          console.log('we are not going to notify facilities');
          //sendMail(report_recipient,email_string);
        }
  });
};

///////////////////////////////////////////////////////////
////// RESET DAILY REPORTS
///////////////////////////////////////////////////////////
function reset_daily_reports(){
    fs.readFile(FACILITIES_REPORTS_EMPTY_PATH,function(error,data){
      var my_data = JSON.parse(data);
      fs.writeFile(FACILITIES_REPORTS_PATH,JSON.stringify(my_data), function(error){
        console.log('we are ready to collect reports for a new day!');
      });
  });
};

app.use(cookieParser());
app.use(express.static('public'));
// parse application/x-www-form-urlencoded
app.use(bp.urlencoded({ extended: true }));
app.use(bp.json());

///////////////////////////////////////////////////////////
////// COLLECT DAILY RESPONSES EVERY DAY RIGHT BEFORE MIDNIGHT
///////////////////////////////////////////////////////////
var j = schedule.scheduleJob('58 23 * * *', function(){
  //READ IN THE DAILY REPORTS, PROCESS THAT, THEN SEND A COLLECTIVE EMAIL TO FACILITIES
  collect_daily_reports(DAILY_REPORTS_RECIPIENT);
});

///////////////////////////////////////////////////////////
////// DELETE COOKIES ROUTE (ONLY FOR DEBUGGING)
///////////////////////////////////////////////////////////
app.get("/delete-cookies",function(req,res,err){
  console.log('deleting cookie');
  res.clearCookie('reported_locations');
  res.send('thanks for deleting cookie!');
});

///////////////////////////////////////////////////////////
////// SEND TEST EMAIL
///////////////////////////////////////////////////////////
app.get("/send-test-mail",function(req,res,err){
  //console.log("we are sending a test email to ourselves");
  var test_recipient = 'miha.klasinc@gmail.com';
  //collect_daily_reports(test_recipient);
  collect_daily_reports();
  //sendMail(test_recipient);
  res.send("thanks! we're sending a test mail to mk4908@nyu.edu");
});

///////////////////////////////////////////////////////////
////// COLLECT DAILY REPORTS
///////////////////////////////////////////////////////////
app.get("/collect-daily-report",function(req,res,err){
  console.log('collecting daily reports');
  collect_daily_reports();
});

///////////////////////////////////////////////////////////
////// RESET DAILY REPORTS
///////////////////////////////////////////////////////////
app.get("/reset-daily-report",function(req,res,err){
  console.log('resetting daily reports');
  reset_daily_reports();
  res.send('thanks for resetting daily reports!');
});

///////////////////////////////////////////////////////////
////// INTERNAL API ROUTE -to check dataset
///////////////////////////////////////////////////////////
app.get("/check-dataset/:dataset",function(req,res,err){
  var query = req.params.dataset;
  var dataset_path;

  if(query === "temperature"){
    dataset_path = TEMPERATURE_LOGS_PATH;
  }else if(query === "facilities"){
    dataset_path = FACILITIES_REPORTS_PATH;
  }
  fs.readFile(dataset_path,function(error,data){
    var reports = JSON.parse(data);
    res.json(reports);
  });

});

///////////////////////////////////////////////////////////
////// REPORTS SUBMIT ROUTE
///////////////////////////////////////////////////////////
app.post("/submit", function (request, response, error){
  request.setTimeout(0);
  //set up variables
  var user = request.body;
  var user_can_post = true;
  var notify_facilities = false;
  var user_location = user.user_location_report;
  var location_match = false;
  var res_obj = {};
  res_obj.place = user_location;
  res_obj.can_post = true;

  var date = new Date();
  var today = String(date.getMonth() + "_" + (date.getDate()));

  var new_log = {};
  new_log.date = today;
  new_log.temp = parseInt(user.user_temperature);
  if(new_log.temp > 4 || new_log.temp < 3){
    console.log('the user complained about the A/C');
    notify_facilities = true;
  };

/*------------------------------HANDLE COOKIES-----------------------------------*/
  //console.log('Pre request cookies: ', request.cookies);
  var location_cookie = request.cookies.reported_locations;
  var new_cookie_value_obj = {};
  new_cookie_value_obj.day = new_log.date;

  if (location_cookie === undefined){
    // no: set a new cookie
    console.log('the location cookie does not yet exist, we are creating a new one');
    new_cookie_value_obj.locations = [user_location];
  }
  else{
    //locations cookie exists, update it
    console.log('location cookie already exists');
    var prev_cookie_places = cookieParser.JSONCookies(location_cookie.locations);
    var prev_cookie_date = cookieParser.JSONCookies(location_cookie.day);

    if(prev_cookie_date === new_log.date){
      console.log('cookie date is still valid');

      if(prev_cookie_places.indexOf(user_location) < 0){
        //valid day, new place, you can post, write cookie
        console.log('the user has not reported about the location today, add it to locations array');
        prev_cookie_places.push(user_location);
      }else{
        //same day, but you already posted posted the place, you cannot do it again, no need to rewrite the cookie
        console.log('the user has already reported about the location today, try again tomorrow');
        user_can_post = false;
        res_obj.can_post = false;
      }
      new_cookie_value_obj.locations = prev_cookie_places;

    }else{
      console.log('previous cookie date is not valid anymore, time to reset the reported locations array');
      new_cookie_value_obj.locations = [user_location];
    };

  };

  response.cookie('reported_locations',new_cookie_value_obj);
  //console.log(new_cookie_value_obj);
  //console.log('////////////////////////////////////////////// \n');

   /*------------------------------FACILITIES DATABASE-----------------------------------*/
  if(user_can_post && notify_facilities){
    console.log('we are notifying facilities about the report!');
    submit_facilities_report(res_obj.place,new_log.temp);
  }else{
    console.log('we are not notifying facilities about the report');
  };
  

  /*------------------------------TEMPERATURE DATABASE-----------------------------------*/
    //read in the whole database
    fs.readFile(TEMPERATURE_LOGS_PATH, function(error, data){
      var whole_file = JSON.parse(data); //once we have the data, we parse it as JSON
      //then we add our newly registered user to our array called "all users"
      var array = whole_file.all_places;

      for(i = 0; i < array.length; i++){
        if(array[i].name == user.user_location_report){ //find the location in the array for which the user wants to make a temperature report
          //Saving today's date into a variable
          location_match = true; //we have a match, used later to update the database
          if(new_log.temp && user_can_post){
            array[i].logs.unshift(new_log);
          }else{
            console.log('we have caught a null value! : ', new_log, ' or the user already posted about this location!');
          };
          //push the new log to the beginning of the log array
          res_obj.logs = array[i].logs; //array of temperature logs, starting with the most recent one

          response.send(JSON.stringify(res_obj)); //send the full array of logs corresponding to the queried location to the user
          break;
        }
      };

      //then we write ALL of our data (in the variable 'whole_file')
      if(location_match){
        fs.writeFile(TEMPERATURE_LOGS_PATH, JSON.stringify(whole_file), function(error){
          if(error){ //hopeully no error?
            console.log(error);

          }else{//success message!
            console.log('we had a location match, we are rewriting the old report file');
            //res_obj.logs
          }
          console.log('////////////////////////////////////////////// \n');
        });

      }else{
        console.log('we do not have a location match, we are not rewriting anything!');
        console.log('////////////////////////////////////////////// \n');
      }
      
    }); //end of read file
    
   //redirect to after-submission page
});

///////////////////////////////////////////////////////////
////// START A SERVER
///////////////////////////////////////////////////////////
app.listen(port, function(){
  console.log('server started on port',port);
});
