var express = require('express');
var app = express();
var port = 8000;
var bp = require('body-parser');
var fs = require('fs');
//Define some initial callback functions

app.use(express.static('public'));

// parse application/x-www-form-urlencoded
app.use(bp.urlencoded({ extended: true }));
// parse application/json
app.use(bp.json());

app.listen(port, function(){
  console.log('server started on port',port);
});

//this is called a route
//this specific route is for the endpoint submit
app.get("/place-query", function (request, response, error){
  console.log('--------------');
  console.log('user queried ', request.query.user_location_query);

  //first we read our file that is in the 'data' folder, and our file is called 'users.json'
  fs.readFile('./data/places_dummy.json', function(error, data){
    var whole_file = JSON.parse(data); //once we have the data, we parse it as JSON (because it's just text)

    var user = {};

    //response.header('Access-Control-Allow-Origin', "*");
    //response.writeHead(200, {'Content-Type': 'json'});

    //then we add our newly registered user to our array called "all users"
    //(check the users.json file to see that it's the top level array!)
    var array = whole_file.all_places;
    user.place = request.query.user_location_query;
    for(i = 0; i < array.length; i++){
      if(array[i].name == user.place){
        console.log("match!");
        //console.log(array[i].logs);
        user.logs = array[i].logs;
        response.send(JSON.stringify(user));
        //PUSH THE OBJECT
        return false;
      }else{
        console.log("no match");
      }
    }
  });

  //response
  //response.send("hello thanks for searching");
});



app.post("/submit", function (request, response, error){
  console.log('input', request.body);

  var user = request.body;
  var new_log = {};

  fs.readFile('./data/places_dummy.json', function(error, data){
    var whole_file = JSON.parse(data); //once we have the data, we parse it as JSON (because it's just text)

    //then we add our newly registered user to our array called "all users"
    //(check the users.json file to see that it's the top level array!)
    var array = whole_file.all_places;
    var prev_logs;

    for(i = 0; i < array.length; i++){
      //find the location in the array for which the user wants to place a report
      if(array[i].name == user.user_location_report){
        console.log("match!");
        console.log("Information for today: ");
        
        prev_logs = array[i].logs;
        //Saving today's date into a variable
        var date = new Date();
        var today = String(date.getMonth() + "_" + date.getDate());
        console.log("today: ", today);
        new_log.date = today;
        new_log.temp = user.user_temperature;

        //Extract all the temperatures for that given day
        /*for(j = 0; j < logs.length; j++){
          if(logs[j].date == today){
            console.log("Temperature: ", logs[j].temp);
          }
          else{
            break;
          }
        }*/
        //PUSH THE OBJECT
        //console.log(new_log);
        prev_logs.unshift(new_log);
        console.log(prev_logs);
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

  if(user.user_temperature > 3){
    console.log('we really need to do something about it!');
  };

  response.send("thanks for your submission love");

  // if(user.already_housed == 'on' || user.likes_cats == 'on' || user.owns_hotplate == 'on'){
  //   response.send('Sorry but you are not eligible for housing here.');
  // }else{ // IS IT YES OR NO???
  //   response.send('Congratulations! You are eligible for housing at NYU Abu Dhabi. You will enjoy life with campus cats and responsible cooking.');
  // }
});


app.get("/get-users", function(req, res, err){
  fs.readFile("./data/users.json", function(err, data){
    var obj = JSON.parse(data);

    res.json(obj);
  });
});
