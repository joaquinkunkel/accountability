var gps_data;
var distThreshold = 0.08; // in km
var gps_working;
var eligible_gps_array = [];
var thank_you = 0;
/* AJAX */

function itFailed(data){
	console.log("Failed");
	console.log(data);
}

//A "success" or "done" function
function itWorked(data){
	var temp_info = JSON.parse(data);
	console.log('here is our data \n');
	console.log(temp_info);
	preparePage();
	visualize(temp_info);
}


function ajaxCall(query){
	console.log('sending ajax call to the server');
	$.ajax({
	url: '/place-query',
	data: {
		user_location_query: query
	},
	type: 'GET',
	//dataType: 'jsonp',
	error: itFailed,
	success: itWorked
});

};

//GPS

function degreesToRadians(degrees) {
  return degrees * Math.PI / 180;
}

function distanceInKm(lat1, lon1, lat2, lon2) {
  var earthRadiusKm = 6371;

  var dLat = degreesToRadians(lat2-lat1);
  var dLon = degreesToRadians(lon2-lon1);

  lat1 = degreesToRadians(lat1);
  lat2 = degreesToRadians(lat2);

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return earthRadiusKm * c;
}



function gpsTrack(){

	var gps_dist_array = [];

	var options = {
	  enableHighAccuracy: true,
	  timeout: 5000,
	  maximumAge: 0
	};

function makeEligiblePlaceArray(crd){
  gps_data.forEach(function(e,i){
    var computed_dist = distanceInKm(crd.latitude,crd.longitude,e.lat,e.lon);
    if(computed_dist < distThreshold){
      //console.log(`You seem to be close to: ${e.name}`);
      if(e.name.length > 1){
        e.name.forEach(function(el){
          eligible_gps_array.push(el);
        });
      }else{
        eligible_gps_array.push(e.name[0]);
      };
    };
  });

  console.log("Close to: " + eligible_gps_array);
}

function success(pos) {
	var crd = pos.coords;
	makeEligiblePlaceArray(crd);
	console.log(eligible_gps_array);
	if(eligible_gps_array[0]){
  	showForm();
	} else {
		ajaxCall("Arts Center (general)");
	}
  gps_working = 1;
  console.log("gps working!");
  var htmlString = '<option disabled selected value><p>Select a place</p></option>';
  /*console.log('Your current position is:');
  console.log(`Latitude : ${crd.latitude}`);
  console.log(`Longitude: ${crd.longitude}`);
  console.log(`More or less ${crd.accuracy} meters.`);*/
  eligible_gps_array.forEach(function(e){
  	htmlString  += '<option value="' + e +'">' + e + '</option>';
  });
  console.log(htmlString);
  $('.user_location_report').html(htmlString);

};

	function error(err) {
		ajaxCall("Arts Center (general)");
	  console.warn(`ERROR(${err.code}): ${err.message}`);
	};

	if (navigator.geolocation) {
	    navigator.geolocation.getCurrentPosition(success, error, options);
	} else {
	    console.log("Geolocation is not supported by this browser.");
	}

}

function readGPSdata(){
	$.getJSON('data/campus_locations.json', function(data) {
	    console.log('gps data file loaded!');
	    gps_data = data;
	    gpsTrack();
	});
};

function makeOptionList(){
  optionList.forEach(function(option){
    $("datalist").append("<option value='" + option + "'>");
  });
};

function isValidGPS(location){
  gps_data.forEach(function(e,i){
    var computed_dist = distanceInKm(crd.latitude,crd.longitude,e.lat,e.lon);
    if(computed_dist < distThreshold){
      //console.log(`You seem to be close to: ${e.name}`);
      if(e.name.length > 1){
        e.name.forEach(function(el){
          eligible_gps_array.push(el);
        });
      }else{
        eligible_gps_array.push(e.name);
      };
    };
  });

  console.log(eligible_gps_array);
}

var optionList = ["Library (general)", "Library Cafe", "Campus Center lobby", "Marketplace", "Convenience Store", "Fitness Center", "Swimming pool", "Arts Center (general)", "Arts Center IM Lab", "D2 Dining Hall", "D1 Dining Hall", "A2 classrooms", "A3 classrooms", "A4 classrooms", "A5 classrooms", "A5 Engineering Design Studio", "A6 classrooms"];

function isInList(location){
	for(var i = 0; i < optionList.length; i++){
		if(location == optionList[i]) return 1;
	}
}

function showForm(){
  //makeOptionList();
  $("#heading").html("<h1 id='help_us'>Are you cold?</h1><span id='infobutton'>Why?</span>");
  $(".description").html(" ");
  $("#infobutton").click(function(){
		if($(".description").html() == " ") $(".description").html("By filling out this two-step form, you are contributing to estimated temperature data to make sure people around NYUAD receive updated, more accurate information about their favorite places.");
		else $(".description").html(" ");
	})
  $("form").css("visibility", "visible");
  $("form").animate({"opacity": "1"}, {duration: 500});
  $(".user_location_report").on("change", function(){
      $("#how").animate({"opacity": "1"}, {duration: 1000});
  });

  $(".selector").on('change', function(){
    if($(this).val() >= 3 && $(this).val() <= 4){
      $(".submitfield").html("<button class='submitbutton'>Submit</button>");
    }else{
      $(".submitfield")
      .html("<p class='warningmessage'>Looks like the A/C there needs to be fixed! Do you want us to notify facilities for you?</p><br/><button class='yesbutton'>Yes, please notify facilities.</button><button class='submitbutton'>No, just submit</button>");
    }
    $(".submitfield").animate({"opacity": "1"}, {duration: 800});
    $(".submitbutton").click(function(){
      var location_input = $('select[name="user_location_report"]').val();
      //console.log("Submit button clicked");
      //console.log(location_input);
        //getJSON();
				thank_you = 1;
        ajaxCall(location_input);
    });
    });

};

$(window).on('load',function(){
  //console.log('hello there');
	//console.log('submission is good!');
	$(".skipbutton").click(function(){
		console.log("calling ajax on arts center lobby");
		ajaxCall("Arts Center (general)");
	});
	$("#infobutton").click(function(){
		if($(".description").html() == " ") $(".description").html("If you wish to contribute temperature data to us, we'll appreciate you allowing your location on your browser or device for reliability reasons. We do not track our users -- geolocation is only used to make sure we receive information on the correct places. <br/> If you do not wish to share your location or help us out with your input, you can go directly to our data visualizations.");
		else $(".description").html(" ");
	});
	readGPSdata();
});
