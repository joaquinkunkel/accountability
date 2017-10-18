var gps_data;
var distThreshold = 0.08; // in km
var gps_working;
var eligible_gps_array = [];
var thank_you = 0;
var info_active = 0;
var skipped = 0;
var bodyClone = $(".form-content").clone();

function itFailed(data){
	console.log("Failed");
	console.log(data);
}

//A "success" or "done" function
function itWorked(data){
	console.log('it worked!');
	var temp_info = JSON.parse(data);
	console.log('here is our data \n');
	console.log(temp_info);
	preparePage();
	visualize(temp_info);
}


function ajaxCall(location,temperature){
	console.log('sending ajax call to the server');
	console.log('our temperature is: ', temperature);
	$.ajax({
		url: '/submit',
		data: {
			user_location_report: location,
			user_temperature: temperature
		},
		type: 'POST',
		//dataType: 'jsonp',
		error: itFailed,
		success: itWorked
	});
	return false;
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

	if(info_active == 1) waitForUser();
	else{
		if(eligible_gps_array[0]){
			showForm();
		} else {
			skipped = 1;
			searchCard();
		}
	}

	gps_working = 1;
	console.log("gps working!");
	var htmlString = '<option disabled selected value><p>Location</p></option>';
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
		skipped = 1;
		searchCard();
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
			console.log(gps_data);
			gpsTrack();
	});
};

function makeOptionList(){
	optionList.forEach(function(option){
		$("datalist").append("<option value='" + option + "'>");
	});
};

var optionList = ["Art Gallery", "Experimental Research Building (ERB)", "Arts Center Sculpture Studio", "UNIX Lab", "Arts Center Piano Room", "Career Development Center (CDC)", "Library (general)", "Library Cafe", "Campus Center lobby", "Marketplace", "Convenience Store", "Fitness Center", "Swimming pool", "Arts Center (general)", "Arts Center IM Lab", "D2 Dining Hall", "D1 Dining Hall", "A2 classrooms", "A3 classrooms", "A4 classrooms", "A5 classrooms", "A5 Engineering Design Studio", "A6 classrooms"];

function isInList(location){
	for(var i = 0; i < optionList.length; i++){
		if(location == optionList[i]) return 1;
	}
}

function waitForUser(){
	$("#heading").html("<h1 id='help_us'>Location received.</h1>");
	$(".post-description").html("<button class='gotit'>Contribute to data</button>");
	$(".gotit").click(function(){
		$(this).remove();
		showForm();
	});
}
function showForm(){
	//makeOptionList();
	$("#heading").html("<h1 id='help_us'>How's the weather in there?</h1><span class='infobutton' id='areyoucoldinfo'>?</span>");
	$(".description").html(" ");
	$("#areyoucoldinfo").click(function(){
		if($(".description").html() == " ") $(".description").html('<span class="description-first-line">It can get quite cold in spaces around NYUAD campus.</span> <br>Fill out the form below and we can notify the facilities if the A/C is making you think twice about your clothing choices.');
		else $(".description").html(" ");
	})
	$("form").css("visibility", "visible");
	$("form").css("display", "block");
	$("form").animate({"opacity": "1"}, {duration: 500});
	$(".user_location_report").on("change", function(){
			$(".skipbutton").animate({"opacity": "0"}, 200, "linear", function(){
				$(this).remove();
				$("#how").css("display", "block");
				$("#how").animate({"opacity": "1"}, {duration: 1000});
			});
	});

	$(".selector").on('change', function(){
		if($(this).val() >= 3 && $(this).val() <= 4){
			$(".submitfield").html("<button class='submitbutton'>Submit</button>");
		}else{
			$(".submitfield")
			.html("<p class='warningmessage'>Looks like the A/C there needs to be fixed! Do you want us to notify facilities for you?</p><br/><button class='submitbutton'>Submit</button>");
		};
		$(".submitfield").animate({"opacity": "1"}, {duration: 800});
		$(".submitbutton").click(function(e){
			e.preventDefault();
			var location_input = $('select[name="user_location_report"]').val();
			var temperature_input = $('select[name="user_temperature"]').val();
			//console.log("Submit button clicked");
			//console.log(location_input);
				//getJSON();
				thank_you = 1;
				ajaxCall(location_input,temperature_input);
		});
		});

};

function searchCard(){
	$("#locationdisclaimer").html("");
	$(".before-visualization").html("");
	$(".sub-body").append("<div class='card' id='searchcard'></div>");
	$("#searchcard").append("<button class='backbutton'>back</button>");
	$("#searchcard").append("<input name='user_location_query' class='user_location_query' list='locations' placeholder='Search for a place...'><datalist id='locations'></datalist></input>");
	$("#searchcard").css("display", "flex");
	$("#searchcard").animate({opacity: '1'}, {duration: 150});
	$("#searchcard").animate({top: "75px"}, 200, "linear");
	makeOptionList();

	$("input").on("input", function(){
		if(isInList($(this).val())){
			$(this).css("border", "2px solid #50ef3b");
			var location_input = $('input').val();
			$("#displaycard").animate({opacity: '0'}, {duration: 150});
			$("#displaycard").animate({"margin-right": "60%"}, 200, "linear", function(){
				$("#displaycard").remove();
				$(".vis_options").remove();
				thank_you = 0;
				console.log(location_input);
				ajaxCall(location_input, );
			});
		}
		else{
			$(this).css("border", "2px solid red");
		}
	});
	$(".backbutton").click(function(){
		$(".card").animate({opacity: '0'}, {duration: 150});
		$(".card").animate({"margin-right": "60%"}, 200, "linear", function(){
			location.reload();
		});
	});
}

function homeScreen() {
	//Display and define home screen interface.//

	$(".skipbutton").click(function(){
		searchCard();
	});

	$("#locationinfo").click(function(){
		if(info_active == 0){
			info_active = 1;
			$(".description").html("If you wish to contribute temperature data to us, we'll appreciate you allowing your location on your browser or device for reliability reasons. We do not track our users -- geolocation is only used to make sure we receive information on the correct places. <br/> If you do not wish to share your location or help us out with your input, you can go directly to our data visualizations.");
		}else{
			info_active = 0;
		$(".description").html("");
		}
	});
	readGPSdata();
	$(".before-visualization").css("visibility", "visible");
	$(".before-visualization").css("display", "block");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
};

function welcomeScreen(){
	//Enter button --> on click:
	$(".sub-body").append("<button class='skipbutton' id='enterbutton'>How's the weather in there?</button><p id='locationdisclaimer'>We use geolocation for reliablity. <span id='more'> Learn more</span></p>");
	$("#enterbutton").click(function(){
		$('#welcome').remove();
		$('#enterbutton').remove();
		$('#calltoaction').remove();
		homeScreen();
	})
	//homeScreen();
}

$(window).on('load',function(){
  //console.log('hello there');
	//console.log('submission is good!');
	welcomeScreen();	//TODO: Only do this if it's the first time they visit. ELSE homeScreen();
	//homeScreen();
});
