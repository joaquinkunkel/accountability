var gps_data;
var distThreshold = 0.08; // in km
var gps_working;
var eligible_gps_array = [];
var optionList = [];
var thank_you = 0;
var info_active = 0;
var skipped = 0;
var bodyClone = $(".form-content").html();
var blankDisplayCard = $("#displaycard").html();
var locationInfoString = "Our form uses your coordinates to give you options that are close to you.";
var gps_case = 0;
var what = 0;

$(window).resize(function(){
	if($(window).width() <= 900){
		if(Math.abs(parseInt($("#displaycard").css("margin-right")) - Math.round($(window).width() * 0.2)) < 5){
			$("#displaycard").css("margin-right", "5%");
			$("#searchcard").css("margin-right", "5%");
		}
	}
	else{
		if(Math.abs(parseInt($("#displaycard").css("margin-right")) - Math.round($(window).width() * 0.05)) < 5){
			$("#displaycard").css("margin-right", "20%");
			$("#searchcard").css("margin-right", "20%");
		}
	}
});

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
	var options = {
			enableHighAccuracy: true,
			timeout: 5000,
			maximumAge: 0
	};

function makeEligiblePlaceArray(crd){
	eligible_gps_array = [];
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
				if(gps_case == 0){
					gps_case = 2;
					nextStep();
				}
			}
		}

		gps_working = 1;
		console.log("gps working!");
		var htmlString = '<option disabled selected value><p>Location</p></option>';

		eligible_gps_array.forEach(function(e){
			htmlString  += '<option value="' + e +'">' + e + '</option>';
		});
		console.log(htmlString);
		$('.user_location_report').html(htmlString);

	};

	function error(err) {
			skipped = 1;
			if(gps_case == 0){
				gps_case = 3;
				console.warn(`ERROR(${err.code}): ${err.message}`);
				nextStep();
			}
		};

		if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(success, error, options);
		}
		else {
				console.log("Geolocation is not supported by this browser.");
		}

}

function readGPSdata(){
	$.getJSON('data/campus_locations.json', function(data) {
			console.log('gps data file loaded!');
			gps_data = data;
			optionList = [];
			gps_data.forEach(function(e){
				var cluster = e.name;
				cluster.forEach(function(n){
					optionList.push(n);
				});
			});
			optionList.sort();
			console.log(optionList);
			gpsTrack();
	});
};

function isInList(location){
	for(var i = 0; i < optionList.length; i++){
		if(location == optionList[i]) return 1;
	}
}

function waitForUser(){
	$("#loadingfan").remove();
	$("#help_us").html("Location received.");
	$(".post-description").html("<button class='gotit'>Contribute to data</button>");
	$(".gotit").click(function(){
		$(this).remove();
		showForm();
	});
}

function searchCard(){
	$("body").css("background", "#edf5fc");
	$("video").remove();
	what = 1;
	$("#locationdisclaimer").html("");
	$(".before-visualization").html("");
	$(".sub-body").append("<div class='card' id='searchcard'></div>");
	if(gps_case < 2){
		$("#searchcard").append("<button class='backbutton'>back</button>");
	}
	$("#searchcard").append("<input name='user_location_query' class='user_location_query' list='locations' placeholder='Enter a location to visualize...'></input>");
	$("#searchcard").css("display", "flex");
	$("#searchcard").animate({opacity: '1'}, {queue: false, duration: 150});
	if($(window).width() <= 900){var marginRight = "5%";}
	else{var marginRight = "20%";}
	$("#searchcard").animate({"margin-right": marginRight}, {queue: false, duration: 200});
	//makeOptionList();
	spawnDisplayCard();
	$(".data_heading").html("<h1 class='emptycardheading'></h1><p id='emptycardp'></p>");

	if(what == 1){
		appendMatches("");
		$("#displaycard").css("background", "#8ca5cc");
		$(".emptycardheading").html("What place are you interested in?");
		$("#emptycardp").html("Click an option or start typing");
	}

	function appendMatches(x){
		$(".option_match").remove();
		for(var i = 0; i <= optionList.length; i++){
			var the_string = String(optionList[i]).toLowerCase();
			var theIndex = the_string.indexOf(String(x).toLowerCase());
			if(theIndex != -1 && the_string != "undefined"){
				console.log(x);
				$("#displaycard").append("<h2 class='option_match'>" + optionList[i] + "</h2>");
				$(".option_match").on("click", function(){
					prepareAndDisplay($(this).html());
				});
			}
		}
	};

	function prepareAndDisplay(location_input){
		$("input").css("border", "2px solid black");
		$("#displaycard").animate({opacity: '0'}, {duration: 150});
		$("#displaycard").animate({"margin-right": "0"}, 200, "linear", function(){
			$("#displaycard").remove();
			$(".emptycardheading").empty();
			$(".emptycardp").empty();
			$(".vis_options").remove();
			thank_you = 0;
			console.log(location_input);
			what = 0;
			$("#displaycard").css("background", "white");
			$(".option_match").remove();
			ajaxCall(location_input);
		});
	}

	$("input").click(function(){
		$(".caption").remove();
		$("svg").remove();
		$(".option_match").remove();
		$(".data_heading").html("<h1 class='emptycardheading'></h1><p id='emptycardp'></p>");
		$("#displaycard").css("background", "#8ca5cc");
		$(".data_heading").html("<h1 class='emptycardheading'>What place are you interested in?</h1><p id='emptycardp'>Click an option or start typing</p>");
		appendMatches($(this).val());
	});

	$("input").on("input", function(){
		appendMatches($(this).val());
		$("#emptycardp").empty();
			if($(this).val()){
				$(".emptycardheading").html($(this).val());
			} else {
				$(".data_heading").html("<h1 class='emptycardheading'>What place are you interested in?</h1><p id='emptycardp'>Click an option or start typing</p>");
			}

		if(isInList($(this).val())){
			$(this).css("border", "2px solid #50ef3b");
			var location_input = $('input').val();
			prepareAndDisplay(location_input);
		}

		else{
			$(this).css("border", "2px solid red");
		}
	});
	$(".backbutton").click(function(){
		$(".card").animate({opacity: '0'}, {duration: 150});
		$(".card").animate({"margin-right": "60%"}, 200, "linear", function(){
			homeScreen();
		});
	});
}

function spawnDisplayCard(){
	$("#displaycard").remove();
	$(".sub-body").append("<div class='card' id='displaycard'><div class='data-display'><div class='data_heading'></div></div></div>");
	$("#displaycard").html(blankDisplayCard);
	$("#displaycard").css("background", "white");
	$("#displaycard").css("box-shadow", "box-shadow: 0 3px 4px rgba(0, 0, 0, 0.1)");
	$("#displaycard").css("display", "block");
	if($(window).width() <= 900){
		var marginRight = "5%";
	}
	else var marginRight = "20%";
	$("#displaycard").animate({"margin-right": marginRight}, {queue: false, duration: 150});
	$("#displaycard").animate({opacity: 1}, {queue: false, duration: 200});
}

function showForm(){
	//makeOptionList();
	$("#loadingfan").remove();
	$(".description").html(" ");
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

	$("#dontsee").click(function(){
		$(this).css("cursor", "normal");
		$(this).html("You can submit about public spaces on campus close to your current location.<br/>If you believe we've ommitted a place, please fill our <a href='https://docs.google.com/forms/d/e/1FAIpQLSewEI4cNMiTnzc-MjdARza71soV97PNKUMXcjs9NIPjm11pMA/viewform?usp=sf_link'>request form</a>.")
	});
	$(".selector").on('change', function(){
		$("#dontsee").html("Don't see your location listed here?");
		if($(this).val() >= 3 && $(this).val() <= 4){
			$(".submitfield").html("<button class='submitbutton'>Submit</button>");
		}else{
			$(".submitfield")
			.html("<p id='lookslike'>Looks like the A/C there needs to be fixed. We will notify facilities about this.</p><br/><button class='submitbutton'>Submit</button>");
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

function homeScreen() {
	//Display and define home screen interface.//
	if(!($("video").length)) $("body").append('<video autoplay loop muted id="background"><source src="./backgroundvid.mp4" type="video/mp4"></video>');
	$("body").css("background", "none");
	what = 0;
	$(".form-content").html(bodyClone);
	$("#more").on("click", function(){
		$(".disclaimer").html(locationInfoString);
	});
	$(".skipbutton").click(function(){
		skipped = 1;
		gps_case = 1;
		nextStep();
		});

	$("#locationinfo").click(function(){
		if(info_active == 0){
			info_active = 1;
			$(".description").html(locationInfoString);
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

function nextStep(){
	$(".before-visualization").html("");
	if(gps_case == 1){ //user clicked skip button
		searchCard();
	}
	else if(gps_case == 2){ //user is not close to any place
		$("#displaycard").css("top", "55px");
		spawnDisplayCard();
		$(".data_heading").append("<h1 class='emptycardheading' style='color: #f9aa0c !important'>Uh oh!</h1>");
		$(".data_heading").append("<p>You don't seem to be close to any of the locations at NYU Abu Dhabi we have registered. No worries; we'll take you directly to look at temperature reports around campus instead.</p>")
		$(".data_heading").append("<button class='skipbutton' id='oklocation'>Continue</button>");

	}
	else if(gps_case == 3){ //user denied or browser blocked
		$("#displaycard").css("top", "55px");
		spawnDisplayCard();
		$(".data_heading").append("<h1 class='emptycardheading' style='color: #d63f1d !important'>Brrr!</h1>");
		$(".data_heading").append("<p>You can only submit a report if you allow us to track your location on NYUAD campus. If you want to submit a temperature report, please change your settings, reload the page, and allow us to track your location.</p>")
		$(".data_heading").append("<button class='skipbutton' id='oklocation'>Continue</button>");

	}
	$("#oklocation").click(function(){
		$("#displaycard").animate({"margin-right": "0"}, 200);
		$("#displaycard").animate({opacity: '0'}, {duration: 150});
		$("#displaycard").animate({"margin-right": "0"}, 200, "linear", function(){
			$("#displaycard").css("top", "138px");
			searchCard();
		});
	});
}

function welcomeScreen(){
	$(".sub-body").append("<div id='welcome'><div id='firstheading'><h1>Is it cold in there?</h1><p class='description'>It can get quite cold in spaces around NYUAD's campus.<br/>Enter our form and we can notify Facilities if the A/C is making you think twice about your clothing choices.</p></div><div id='enterdiv'><button class='skipbutton' id='enterbutton'>Enter</button></div></div><p class='disclaimer'>We use geolocation for reliablity.<span id='more'>more</span></p>");
	$("#more").on("click", function(){
		$(".disclaimer").html("We use geolocation for reliablity." + locationInfoString);
	});
	$("#enterbutton").click(function(){
		$(".disclaimer").html("We use geolocation for reliablity.<span id='more'>more</span>");
		$('#welcome').remove();
		$('#enterbutton').remove();
		$('#calltoaction').remove();
		homeScreen();
	})
};


$(window).on('load', function(e){
  //console.log('hello there');
	//console.log('submission is good!');
	welcomeScreen();
});
