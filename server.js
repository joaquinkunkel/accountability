//dependencies
var express = require('express');
var app = express();
var bp = require('body-parser');
var fs = require('fs');
var sgMail = require('@sendgrid/mail');
var path = require('path');
var schedule = require('node-schedule');
var cookieParser = require('cookie-parser');
  /*-----------------------------------------------------------------
                            SET UP VARIABLES
  -------------------------------------------------------------------*/
var port = 8000;
var API_KEY;
var TEMPERATURE_LOGS_PATH = 'data/places_data.json';
var FACILITIES_REPORTS_EMPTY_PATH = 'data/facilities_reports_empty.json';
var FACILITIES_REPORTS_PATH = 'data/facilities_reports_daily.json';

//load in SendGrid API_KEY
/*fs.readFile('API_KEY.txt','utf-8',function(err,data){
  if (err) throw err;
  API_KEY = data.toString();
});
*/



function reset_daily_reports(){
    fs.readFile(FACILITIES_REPORTS_EMPTY_PATH,function(error,data){
      fs.writeFile(FACILITIES_REPORTS_PATH,JSON.stringify(data), function(error){
        console.log('we are ready to collect reports for a new day!');
      });
  });
};

var j = schedule.scheduleJob('5 23 * * *', function(){
  //console.log('every day at this time, we will check our daily database and write an email to the facilities');

  //READ IN THE DAILY REPORTS, PROCESS THAT, THEN SEND A COLLECTIVE EMAIL TO FACILITIES
  collect_daily_reports();
});


app.use(cookieParser());
app.use(express.static('public'));
// parse application/x-www-form-urlencoded
app.use(bp.urlencoded({ extended: true }));
app.use(bp.json());


//route for user queries
app.get("/place-query", function (request, response, error){
  console.log('we have received a request');
  //console.log('user queried ', request.query.user_location_query);
  var user = {}; //make an empty user object, define it here so you can add to it from different codeblocks
  user.place = request.query.user_location_query;

  //load in the database
  fs.readFile(TEMPERATURE_LOGS_PATH, function(error, data){
    if(error){throw error};
    var whole_file = JSON.parse(data); //once we have the data, we parse it as JSON
    var array = whole_file.all_places; //array of all campus locations and corresponding logs

    //match the queried location with the location in the database
    for(i = 0; i < array.length; i++){
      if(array[i].name == user.place){
        user.logs = array[i].logs; //array of temperature logs, starting with the most recent one
        response.send(JSON.stringify(user)); //send the full array of logs corresponding to the queried location to the user
      }
    }
  });

});

/*-----------------------------------------------------------------
          DELETE COOKIES ROUTE (debugging purposes only)
-------------------------------------------------------------------*/
app.get("/delete-cookies",function(req,res,err){
  console.log('deleting cookie');
  res.clearCookie('reported_locations');
  res.send('thanks for deleting cookie!');
});


/*-----------------------------------------------------------------
                          API ROUTE
-------------------------------------------------------------------*/
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

/*-----------------------------------------------------------------
                      SUBMITTED REPORTS
-------------------------------------------------------------------*/
app.post("/submit", function (request, response, error){
  request.setTimeout(0);
  //set up variables
  var user = request.body;
  var user_location = user.user_location_report;
  var location_match = false;

  var date = new Date();
  var today = String(date.getMonth() + "_" + (date.getDate()));

  var new_log = {};
  new_log.date = today;
  new_log.temp = parseInt(user.user_temperature);

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
      }
      new_cookie_value_obj.locations = prev_cookie_places;

    }else{
      console.log('previous cookie date is not valid anymore, time to reset the reported locations array');
      new_cookie_value_obj.locations = [user_location];
    };

  };

  response.cookie('reported_locations',new_cookie_value_obj);
  console.log(new_cookie_value_obj);
  console.log('////////////////////////////////////////////// \n');

  /*-----------------------------------FACILITIES REQUESTS DATABASE-------------------------------------*/
  fs.readFile(FACILITIES_REPORTS_PATH,function(error,data){

    var reports = JSON.parse(data);
    var places_array = reports.all_places;
    for(var i = 0; i< places_array.length; i++){

      if(places_array[i].name === user_location){
        places_array[i].logs.push(new_log.temp);
      };

    };

    fs.writeFile(FACILITIES_REPORTS_PATH,JSON.stringify(reports),function(error){
      if(error) throw error;
      console.log('we have updated the facilities report database!');
    });


  });


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

        array[i].logs.unshift(new_log);//push the new log to the beginning of the log array
        //console.log(current_logs);
        break;
      }
    };

    //then we write ALL of our data (in the variable 'whole_file')
    if(location_match){
      fs.writeFile(TEMPERATURE_LOGS_PATH, JSON.stringify(whole_file), function(error){
        if(error){ //hopefully no error?
          console.log(error);

        }else{//success message!
          console.log('success! written new report',user);
          //response.redirect('after_valid_submission.html');
        //  if(user.user_temperature < 3){
            //sendMail();
            //response.redirect('after_submission.html');
          //}else{
            //response.redirect('after_valid_submission.html');
          //}
        }
      });
    }else{
      console.log('nothing written to the database!');
      //response.redirect('after_invalid_submission.html');
    }

  }); //end of read file

  //set up a threshold - if the temperature is below the threshold (i.e. the user says the space is being either freezing or cold) - send an email
  function sendMail(){
    //console.log('sending an email!');
    var api_key = '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';
    var recipient = 'mk4908@nyu.edu';
    var sender = 'NYUAD ACcountability <mk4908@nyu.edu>';
    var email_body = 'Dear Madam or Sir,<br /><br />A student has reported excessively low temperatures at the ' + user.user_location_report + 'and would like to file a request for the air conditioning in the space to be checked and adjusted.</br /><br /><br />';
    email_body += '<i>This email was generated through the ACcountability project by Miha Klasinc and Joaquin Kunkel. Our project serves as a reminder that exceedingly low AC temperatures not only have a negative impact of students\' well-being, but also result in economic loss and environmental damage.</i>';

    sgMail.setApiKey(api_key);
    var  msg = {
    to: recipient, //recipient, which is the nyuad.facilities
    from: 'NYUAD ACcountability <mk4908@nyu.edu>',
    subject: 'Facilities request: AC temperature',
    html: email_body
    };
    sgMail.send(msg);
  }

   //redirect to after-submission page
});

//start listening on a port
app.listen(port, function(){
  console.log('server started on port',port);
});
