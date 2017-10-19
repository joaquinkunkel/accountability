var fs = require('fs');
var TEMPERATURE_DATA_PATH = 'data/places_data.json';
var GPS_LOCATIONS_PATH = 'data/campus_locations.json';


function log_gps_locations(){
	fs.readFile(TEMPERATURE_DATA_PATH,function(error,data){
	  var my_data = JSON.parse(data);
	  var places_array = my_data.all_places;
	  console.log('here is our temp location data:');
	  for(var i = 0; i < places_array.length; i++){
	  	console.log(places_array[i].name);
	  };
	});	
	log_temperature_locations();
};


function log_temperature_locations(){
	fs.readFile(GPS_LOCATIONS_PATH,function(error,data){
	  var my_data = JSON.parse(data);
	  console.log('here is our gps location data:');
	  for(var i = 0; i < my_data.length; i++){
	  	console.log(my_data[i].name);
	  };
	});	
}

log_gps_locations();
