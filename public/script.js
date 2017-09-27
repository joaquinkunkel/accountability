//An "error" or "fail" function
function itFailed(data){
	console.log("Failed");
	console.log(data);
}

//A "success" or "done" function
function itWorked(data){
	console.log("Worked !");

	var temp_info = JSON.parse(data);
	visualize(data);
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

	var temps = ["", "freezing", "cold", "cool", "just right", "warm", "hot"];
	var colors = ["", "black", "blue", "rgb(0, 255, 255)", "green", "yellow", "red" ];

	//logs = all_logs.length <= 7 ? all_logs: seven_logs(all_logs);
	var current_date = new Date();
	var temp_avg = 0; //Compute the average temperatures of a place.
	var temp_count = 0;
	var split_date = [];
	var day_avg;
	var temp_count_2 = 0
	var new_log = {};
	var already_added = [];
	var l = {};
	var flag = 0;
	var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

	todays_month = current_date.getMonth();
	todays_day = current_date.getDate();

	for(e = 0; e < all_logs.length; e++){
		flag = 0

		l = all_logs[e];
		new_log = {};
		split_date = l.date.split("_");
		if(todays_month == split_date[0] && todays_day - split_date[1] < 7){

			for(i = 0; i < already_added.length; i++){
				if(all_logs[e].date == already_added[i]){
					flag = 1;
					break;
				}
			}

			if(!flag){

				//Compute the average of all temperatures for that date.
				day_avg = 0;
				temp_count_2 = 0;
				all_logs.forEach(function(my_log){
					if(my_log.date == l.date){
						console.log(all_logs[e].date);
						day_avg += parseInt(my_log.temp);
						temp_count_2++;
					}
				});
				day_avg = day_avg/temp_count_2;

				//Add this average to our logs array.
				new_log.date = l.date;
				new_log.temp = day_avg;
				logs.push(new_log);

				already_added.push(l.date);
			}

		}
	}

	function todays_avg(){
		for(i = 0; i < logs.length; i++){
			split_date = logs[i].date.split("_");
			console.log(logs[i]);
			if(split_date[0] == todays_month && split_date[1] == todays_day){
				return logs[i].temp;
			}
		}
		return 0;
	}

	console.log(logs);


	logs.forEach(function(log){
		temp_avg += parseInt(log.temp);
	});
	temp_avg = temp_avg/logs.length;


	var w = $(window).width() <= 500 ? $(window).width() * 0.9 : 500;
	var h = 250;
	var barPadding = 1;

	var display = d3.select("body").select(".contents").select(".data_display");

	display.selectAll("svg").remove();
	display.selectAll("h2").remove();
	display.selectAll("p").remove();

	var div = display.append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

	display.append("h2")
		.text(function(d){
			if(todays_avg()){
				return(place_name + " is " + temps[Math.floor(todays_avg())] + " today.");
			}
			else{
				return(place_name);
			}
		})
		.style("margin-top", "60px");

	display.append("p")
		.text(function(d){
			return("Over the past week, the temperature at "+ place_name + " has been reported to be " + temps[Math.floor(temp_avg)] + " on average. Data for the past 7 days:");
		})


	var svg = display.append("svg")
										.attr("width", w)
										.attr("height", h)
										.style("margin-top", "30px");

	svg.selectAll("rect")
			.data(logs)
			.enter()
			.append("rect")
			.attr("x", function(d, i){
				return (logs.length-i-1) * (w / logs.length);
			})
			.attr("y", function(d, i){
				return h-d.temp*30 -25;
			})
			.attr("width", function(d, i){
				return (w / logs.length) - barPadding;
			})
			.attr("height", function(d, i){
				return d.temp *30;
			})
			.attr("fill", function(d){
				return"rgb(" + d.temp*10 + ", " + d.temp*30 + ", " + 255 + ")";
			})
			/*
			.on("mouseover", function(d){
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
			})
			*/;
	var texts = svg.selectAll("text")
				.data(logs)
				.enter();

	texts.append("text")
			.text(function(d, i){
				return months[d.date.split("_")[0]] + " " + d.date.split("_")[1];
			})
			.attr("x", function(d, i){
				return (logs.length-i-1) * w/logs.length + w/logs.length/4 - 10;
			})
			.attr("y", function(d){
				return h - 8;
			});

	texts.append("text")
			.text(function(d, i){
				return temps[(Math.floor(d.temp))];
			})
			.attr("x", function(d, i){
				return (logs.length-i-1) * w/logs.length + w/logs.length/4 - 10;
			})
			.attr("y", function(d){
				return h - d.temp*30 - 35;
			})
			.style("color", "white")
			.style("font-weight", "bold");

};

function animateForm(){

  $("h1").animate({"padding-top": "13px"}, {duration: 200});
  $("video").css("visibility", "hidden");
  $("header").css("background", "linear-gradient(to bottom, #0f7fff 0%,#00a1ff 100%)");
	$("header").css("box-shadow", "0px 2px 40px rgba(0, 0, 0, 0.3)");
	$("header").attr("class", "row");
	$("header").css("display", "block");
	$("header").css("padding", "30px auto");
	$(".contents").css("background", "white");
  $("#title").attr("class", "col-sm-4");
  $("form").attr("class", "col-sm-5");
  $("form").css("margin", "0 5px");
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
