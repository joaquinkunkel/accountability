//An "error" or "fail" function
function itFailed(data){
	console.log("Failed");
	console.log(data);
}

//A "success" or "done" function
function itWorked(data){
	console.log("Worked !");

	var temp_info = JSON.parse(data);
	console.log(temp_info);
	visualize(data);

	//var htmlString = '';
	//htmlString += '<p> Most recently, people have reported that ' + temp_info.place + ' is level ' + temp_info.logs.temp + ' cold</p>';
	//$(htmlString).appendTo('.data_display');
}


function ajaxCall(query){
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

function visualize(dataset){
	var data = JSON.parse(dataset)
	var place_name = data.place;
	var logs = data.logs;

	console.log(place_name);

	var left_limit = data.logs[data.logs.length-1].date.split("_"); //The oldest date of the place's logs.
	var right_limit = data.logs[0].date.split("_"); //The most recent date of the place's logs.

	var w = $(window).width() <= 500 ? $(window).width() * 0.9 : 500;
	var h = 100;
	var barPadding = 1;

	//An array that will store [[date, temp], [date, temp], ...]:

	var display = d3.select("body").select(".contents").select(".data_display");

	display.append("h2")
		.text(place_name)
		.style("color", "white");

	display.selectAll("p")
		.data(data.logs)
		.enter()
		.append("p")
		.text(function(d){
			return("Date: " + d.date + "\t" + "Temperature: " + d.temp);
		})
		.style("color", "white");

	var svg = display.append("svg")
										.attr("width", w)
										.attr("height", h);

	svg.selectAll("rect")
			.data(logs)
			.enter()
			.append("rect")
			.attr("x", function(d, i){
				return i * (w / logs.length);
			})
			.attr("y", function(d, i){
				return h-d.temp *10;
			})
			.attr("width", function(d, i){
				return (w / logs.length) - barPadding;
			})
			.attr("height", function(d, i){
				return d.temp *10;
			})
			.attr("fill", "white")
			.on("mouseover", function(d){
				d3.select(this).classed("hover", true);
			})
			.on("mouseover", function(d){
				d3.select(this).classed("hover", false);
			});


};

function animateForm(){

  $("header").animate({margin: "0 auto"}, {duration: 200});
  $("video").css("visibility", "hidden");
  $(".contents").css("background", "linear-gradient(to bottom, #0f7fff 0%,#00c7ff 100%)");
  $("header").attr("class", "row");
  $("header").css("display", "block");
  $("#title").attr("class", "col-sm-4");
  $("form").attr("class", "col-sm-5");
  $("form").css("margin", "0 5px");
  $("header").css("padding-bottom", "30px");
  $("h1").css("margin", "0 5px");
  $(".msb").css("margin", ".67em 10px");
  $("header").css("justify-content", "center");

};



$(window).on('load',function(){
	console.log('we are set up!');
	var $submit_button = $('#gobutton');
	$submit_button.click(function(){
		var location_input = $('input[name="user_location_query"]').val();
		animateForm();
	  	//getJSON();
	  	ajaxCall(location_input);
	});
});

//old code that we may or may not use

/*var our_button = document.getElementById("gobutton");
our_button.addEventListener('click', function(){
  console.log("i am clicked");
  animateForm();
  //getPublicData();
  ajaxCall();
});*/
