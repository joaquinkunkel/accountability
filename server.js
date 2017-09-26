var express = require('express');
var app = express();
var port = 8000;
var bp = require('body-parser');
var fs = require('fs');
//Define some initial callback functions

//An "error" or "fail" function
function itFailed(data){
	console.log("Failed");
	console.log(data);
}

//A "success" or "done" function
function itWorked(data){
	console.log("Worked !");
	console.log(data);
}

//A "completed" or "always" function
function finished(){
	console.log("I'm all finished");
}

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

app.get("/dummy",function(request,response,error){
  console.log('weve got an incoming ajax request');
  response.send('got job guys');
  console.log(request);
});

app.get("/place-query", function (request, response, error){
  console.log('--------------');
  console.log('user queried ', request.query.user_location_query);

  //first we read our file that is in the 'data' folder, and our file is called 'users.json'
  fs.readFile('./data/places.json', function(error, data){
    var whole_file = JSON.parse(data); //once we have the data, we parse it as JSON (because it's just text)

    var user = {};
    //then we add our newly registered user to our array called "all users"
    //(check the users.json file to see that it's the top level array!)
    var array = whole_file.all_places;
    user.place = request.query.user_location_query;
    for(i = 0; i < array.length; i++){
      if(array[i].name == user.place){
        console.log("match!");
        //PUSH THE OBJECT
        break;
      }else{
        console.log("no match");
      }
    }
  });

  //response
  response.send("hello thanks for searching");
});



app.post("/submit", function (request, response, error){
  console.log('input', request.body);

  var user = {};
  user.place = request.body.user_location_query;

  console.log('----------');
  console.log('output', user);

  fs.readFile('./data/places.json', function(error, data){
    var whole_file = JSON.parse(data); //once we have the data, we parse it as JSON (because it's just text)

    //then we add our newly registered user to our array called "all users"
    //(check the users.json file to see that it's the top level array!)
    var array = whole_file.all_places;

    for(i = 0; i < array.length; i++){
      if(array[i].name == user.place){
        console.log("match!");
        console.log("Information for today: ");
        var logs = array[i].logs;

        //Saving today's date into a variable
        var date = new Date();
        var today = String(date.getMonth() + "_" + date.getDate());
        console.log("today: ", today);

        //Extract all the temperatures for that given day
        for(j = 0; j < logs.length; j++){
          if(logs[j].date == today){
            console.log("Temperature: ", logs[j].temp);
          }
          else{
            break;
          }
        }
        //PUSH THE OBJECT
        break;

      }else{
        console.log("no match");
      }
    }

  });

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
