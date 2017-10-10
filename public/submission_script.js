var gps_data;
var distThreshold = 0.08; // in km

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

function success(pos) {
  var crd = pos.coords;
  var eligible_gps_array = [];
  var htmlString = '';
  /*console.log('Your current position is:');
  console.log(`Latitude : ${crd.latitude}`);
  console.log(`Longitude: ${crd.longitude}`);
  console.log(`More or less ${crd.accuracy} meters.`);*/
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
  eligible_gps_array.forEach(function(e){
  	htmlString  += '<option value="' + e +'">';
  });
  console.log(htmlString);
  $(htmlString).appendTo('#valid_locations');

};

	function error(err) {
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

$(window).on('load',function(){
	//console.log('submission is good!');
  $("form").animate({"opacity": "1"}, {duration: 500});
	readGPSdata();
});

$(".where").on('input', function(){
  $(".how").animate({"opacity": "1"}, {duration: 1000});
});

$(".selector").on('change', function(){
  if($(this).val() >= 3 && $(this).val() <= 4){
    $(".submitfield").html("<button class='submitbutton'>Submit</button>");
  }else{
    $(".submitfield")
    .html("<p class='warningmessage'>Looks like the A/C there needs to be fixed! Do you want us to notice facilities for you?</p><br/><button class='yesbutton'>Yes, please notify facilities.</button><button class='submitbutton'>No, just submit</button>");
  }
  $(".submitfield").animate({"opacity": "1"}, {duration: 80});

});
