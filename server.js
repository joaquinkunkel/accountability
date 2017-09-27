var express = require('express');
var app = express();
var port = 8000;
var bp = require('body-parser');
var fs = require('fs');
var sgMail = require('@sendgrid/mail');
//Define some initial callback functions
app.use(express.static('public'));

// parse application/x-www-form-urlencoded
app.use(bp.urlencoded({ extended: true }));
// parse application/json
app.use(bp.json());

app.get("/place-query", function (request, response, error){
  //console.log('user queried ', request.query.user_location_query); 
  var user = {}; //make an empty user object, define it here so you can add to it from different codeblocks 
  user.place = request.query.user_location_query;
  
  //load in the database
  fs.readFile('./data/places_dummy.json', function(error, data){
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

//route for user reports
app.post("/submit", function (request, response, error){
  //console.log('input', request.body);
  var user = request.body; //user object, define it here so you can add to it from different codeblocks
  var new_log = {}; //log object containing user's submit info -- newest log to be added to the database

  //read in the whole database
  fs.readFile('./data/places_dummy.json', function(error, data){
    var whole_file = JSON.parse(data); //once we have the data, we parse it as JSON
    //then we add our newly registered user to our array called "all users"
    var array = whole_file.all_places;
  
    for(i = 0; i < array.length; i++){
      if(array[i].name == user.user_location_report){ //find the location in the array for which the user wants to make a temperature report
        //Saving today's date into a variable
        var date = new Date();
        var today = String(date.getMonth() + "_" + date.getDate());
        //fill the newest log object with user report info and push it to the existing log array
        new_log.date = today;
        new_log.temp = parseInt(user.user_temperature); //++++++++++++++++++++++ string or number????
        array[i].logs.unshift(new_log);//push the new log to the beginning of the log array
        //console.log(current_logs);
        break;
      }
    };

    //then we write ALL of our data (in the variable 'whole_file')
    fs.writeFile('./data/places_dummy.json', JSON.stringify(whole_file), function(error){
      if(error){ //hopefully no error?
        console.log(error);
      }else{//success message!
        console.log('success! written new report',user);
      }
    });

  }); //end of read file

  //set up a threshold - if the temperature is below the threshold (i.e. the user says the space is being either freezing or cold) - send an email
  if(user.user_temperature < 3){
    //console.log('sending an email!');
    var api_key = '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';
    var recipient = 'nyuad.facilities@nyu.edu';
    var sender = 'NYUAD ACcountability <mk4908@nyu.edu>';
    var email_body = 'Dear Madam or Sir,<br /><br />a student has reported excessively low temperatures at the ' + user.user_location_report + 'and would like to file a request for the air conditioning in the space to be checked and adjusted.</br /><br /><br />'; 
    email_body += '<i>This email was generated through the ACcountability project by Miha Klasinc and Joaquin Kunkel. Our project serves as a reminder that exceedingly low AC temperatures not only have a negative impact of students\' well-being, but also result in economic loss and environmental pollution.</i>';

    sgMail.setApiKey(api_key);
    var  msg = {
    to: 'mk4908@nyu.edu', //recipient, which is the nyuad.facilities
    from: 'NYUAD ACcountability <mk4908@nyu.edu>',
    subject: 'Facilities request: AC temperature',
    html: email_body
    };
    sgMail.send(msg);
  };

  response.redirect('after_submission.html'); //redirect to after-submission page
});

//start listening on a port
app.listen(port, function(){
  console.log('server started on port',port);
});

