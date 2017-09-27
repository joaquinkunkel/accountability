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
	var all_logs = data.logs;
	var logs = [];

	var temps = ["", "Freezing", "Cold", "Cool", "Just right", "Warm", "Hot"];
	//Take only 7 elements from all_logs.

	function seven_logs(logs){
		var my_logs = []
		for(i = 0; i < 7; i++){
			my_logs.push(all_logs[i]);
		}
		return my_logs;
	};

	logs = all_logs.length <= 7 ? all_logs: seven_logs(all_logs);

	console.log(logs);

	var current_date = new Date();
	var temp_avg = 0; //Compute the average temperatures of a place.
	var temp_count = 0;
	var split_date = [];

	logs.forEach(function(log){
		split_date = log.date.split("_");
		if(current_date.getMonth() == split_date[0] && current_date.getDate() - split_date[1] < 7){
			console.log(temp_avg);
			temp_avg += parseInt(log.temp);

			temp_count++;
		}
	});

	temp_avg = temp_avg/temp_count;

	//console.log(temp_avg, "   ", temp_count);
	//console.log(place_name);

	var left_limit = data.logs[data.logs.length-1].date.split("_"); //The oldest date of the place's logs.
	var right_limit = data.logs[0].date.split("_"); //The most recent date of the place's logs.

	var w = $(window).width() <= 500 ? $(window).width() * 0.9 : 500;
	var h = 100;
	var barPadding = 1;

	//An array that will store [[date, temp], [date, temp], ...]:

	var display = d3.select("body").select(".contents").select(".data_display");

	var div = display.append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

	display.append("h2")
		.text(place_name)
		.style("color", "white");

	display.append("p")
		.text(function(d){
			return("Over the past week, the temperature at "+ place_name + " has been reported to be " + temps[Math.floor(temp_avg)] + " on average.");
		});
			/*
	display.selectAll("p")
		.data(data.logs)
		.enter()
		.append("p")
		.text(function(d){
			return("Date: " + d.date + "\t" + "Temperature: " + d.temp);
		})
		.style("color", "white");
*/

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
				//d3.select(this).classed("hover", true);
        div.transition()
            .duration(200)
            .style("opacity", .9);
				div.html(d.date + "<br/>"  + temps[d.temp])
						.style("left", (d3.event.pageX) + "px")
						.style("top", (d3.event.pageY - 28) + "px");
			})
			.on("mouseout", function(){
				div.transition()
						.duration(200)
						.style("opacity", 0);
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
