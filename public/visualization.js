function preparePage(){
	d3.select(".before-visualization").remove();
};

function visualize(data){
	if(!$("#searchcard").length){
		searchCard();
	}
	spawnDisplayCard();
	function createDaysLogs(a){
		//Create an array of today's logs.
	 //The array stores subarrays of the form [temperature, count],
	 //where count is the number of times that temperature appeared on that day.
	 //"a" is an array of weekly logs
		var daysLogs = [
		[6, 0],
		[5, 0],
		[4, 0],
		[3, 0],
		[2, 0],
		[1, 0]
		];

		for(var i = a.length - 1; i >= 0; i--){
			var l = a[i];
			var split_date = l.date.split("_");
			if(todays_day == split_date[1] && todays_month == split_date[0]){ //Check if the date of l is within past week.
				console.log("Adding to daysLogs, date: ", split_date[1], "\ntemperature: ", Math.round(l.temp)-1);
				daysLogs[Math.round(l.temp)-1][1] = daysLogs[Math.round(l.temp) - 1][1] + 1;
			}
		}
		console.log(daysLogs);
		return daysLogs;
	};

	function createWeeklyLogs(all_logs){
		var logs = [];
		var temp_count = 0;
		var temp_count_2 = 0
		var already_added = [];


		for(var e = 0; e < all_logs.length; e++){

			var flag = 0;
			var l = all_logs[e];
			// console.log(l);
			var new_log = {};
			var split_date = l.date.split("_");
			split_date[0] = parseInt(split_date[0]);
			split_date[1] = parseInt(split_date[1]);
			// console.log(split_date);
			if(todays_month == split_date[0] && todays_day - split_date[1] < 7){ //Check if the date of l is within past week.
				// console.log("within week");
				//Check to see if the date is in already_added (we skip it if it is).
				for(i = 0; i < already_added.length; i++){
					// console.log("comparing current date to: ", already_added[i]);
					if(l.date == already_added[i]){
						flag = 1;
						break;
					}
				}

				if(!flag){ //If it hasn't yet been added
					//Compute the average of all temperatures for that date. We will add this av day temperature to the graph
					// console.log("not yet added, adding now: ", l.date);
					var day_avg = 0;
					temp_count_2 = 0;
					all_logs.forEach(function(my_log){
						if(my_log.date == l.date){
							// console.log(l.date);
							day_avg += parseInt(my_log.temp);
							temp_count_2++;
						}
					});

					day_avg = day_avg/temp_count_2;

					//Create a day average log and add it to our logs array.
					new_log.date = l.date;
					new_log.temp = day_avg;
					logs.push(new_log);
					// console.log(new_log);
					already_added.push(l.date);
				}
			}
		}

		return(logs);
	};

	function visualizeWeek(logs){

		//Width and height
		if($(window).width() <= 550) var w = $(window).width() * 0.8;
		else var w = 500;
		var h = 200;

		//Padding for axes and labels
		var yPadding = 25;
		var xPadding = 30;

		//Scales for axes and bar dimensions
		var yScale = d3.scaleLinear()
										 .domain([1, 6])
										 .range([5, h - 2*yPadding]);
		var yAxisScale = d3.scaleLinear()
										 .domain([1, 6])
										 .range([h - 2*yPadding, 5]);
		var xScale = d3.scaleLinear()
										.domain([0, logs.length])
										.range([xPadding, w-xPadding]);
		var xAxisScale = d3.scaleLinear()
										.domain([0, logs.length])
										.range([w-xPadding, xPadding]);


		display.select(".caption").remove();
		display.append("p")
			.classed("caption", true)
			.text("Here are the average daily temperatures we've registered the past week.")
			.style("padding-top", "15px")
			.style("font-weight", "bold");

		//D3 initialization
		//If there is already a visualization there, remove it to replace with new one.
		display.selectAll("svg").remove();

		var svg = display.append("svg")
											.attr("width", w)
											.attr("height", h)
											.style("margin-top", "10px");

		var yAxis = d3.axisLeft(yAxisScale)
									.tickValues([1, 2, 3, 4, 5, 6])
	                .tickFormat(function(d, i){ return temps[d-1]} );
		var xTicks = []
		for(var i = 0; i < logs.length; i++){
			xTicks.push(i);
		}

	  var xAxis = d3.axisBottom(xAxisScale)
									.tickValues(xTicks)
	                .tickFormat(function(d){ return months[logs[d].date.split("_")[0]] + " " + logs[d].date.split("_")[1] });

		svg.append("g")
				.attr("class", "axis")
				.attr("transform", "translate(" + 2*xPadding + "," + (yPadding) + ")") //to revert to proper translate: change 2*xPadding to xPadding.
				.call(yAxis)
				.select(".domain")
				.attr("stroke", "none");

		svg.append('text')
				.attr('class', 'yLabel')
				.attr('text-anchor', 'middle')
				.attr('x', -h/2)
				.attr('y', xPadding/2)
				.attr('transform', 'rotate(-90)')
				.text('Temperature');

		svg.append("g")
				.attr("class", "axis")
				.attr("transform", "translate(" + (-w/logs.length/2 + xPadding) +  "," + (h - yPadding) + ")")
				.call(xAxis)
				.select(".domain")
				.attr("stroke", "none");

		svg.selectAll(".tick")
				.select("line")
				.attr("stroke", "none");

		svg.selectAll("rect")
				.data(logs)
				.enter()
				.append("rect")
				.attr("x", function(d, i){
					return xScale(logs.length-i-1) + xScale(0);
				})
				.attr("y", function(d, i){
					return h - yPadding;
				})
				.attr("width", function(d, i){
					return (w - 2*xPadding)/logs.length - barPadding;
				})
				.transition().duration(function(d, i){
	        return 800 + (logs.length-i)*140;
	      })
				.attr("height", function(d, i){
					return yScale(d.temp);
				})
				.attr("y", function(d, i){
					return h - yScale(d.temp) - yPadding;
				})
				.attr("fill", function(d, i){
					return colors[Math.round(d.temp)-1];
				});
	};

	function visualizeDay(){

		//Width and height
		if($(window).width() <= 550) var w = $(window).width() * 0.8;
		else var w = 500;
		var h = 200;

		var yPadding = 25;
		var xPadding = 25;
		var day_data = createDaysLogs(all_logs);


		var yScale = d3.scaleLinear()
                     .domain([0, d3.max(day_data, function(d) { return d[1]; })])
                     .range([0, h - 2*yPadding]);
		var yAxisScale = d3.scaleLinear()
	                   .domain([0, d3.max(day_data, function(d) { return d[1]; })])
	                   .range([h - 2*yPadding, 0]);
		var xScale = d3.scaleLinear()
										.domain([0, 6])
										.range([xPadding, w-xPadding]);
		var xAxisScale = d3.scaleLinear()
										.domain([0, 6])
										.range([xPadding, w-xPadding]);

		display.select(".caption").remove();
		display.append("p")
			.classed("caption", true)
			.text("Here are the reports we have received from our users today.")
			.style("padding-top", "15px")
			.style("font-weight", "bold");

		display.selectAll("svg").remove();
		var svg = display.append("svg")
											.attr("width", w)
											.attr("height", h)
											.style("margin-top", "10px");

		var yAxis = d3.axisLeft(yAxisScale)
                  .ticks(d3.max(day_data, function(d) { return d[1]; }));

		var xAxis = d3.axisBottom(xAxisScale)
									.tickValues([1, 2, 3, 4, 5, 6])
									.tickFormat(function(d, i){return temps[d-1]});

		console.log(day_data);
		svg.append("g")
		    .attr("class", "axis")
				.attr("transform", "translate(" + 2*xPadding +  "," + yPadding + ")")
		    .call(yAxis)
				.select(".domain")
				.attr("stroke", "none");

		svg.append('text')
		    .attr('class', 'yLabel')
		    .attr('text-anchor', 'middle')
				.attr('x', -h/2)
		    .attr('y', xPadding/2)
		    .attr('transform', 'rotate(-90)')
		    .text('Number of reports');

		svg.append("g")
		    .attr("class", "axis")
				.attr("transform", "translate("+ (-w/day_data.length/2 + xPadding) + "," + (h - yPadding) + ")")
		    .call(xAxis)
				.select(".domain")
				.attr("stroke", "none");

		svg.selectAll(".tick")
				.select("line")
				.attr("stroke", "none");

		svg.selectAll("rect")
				.data(day_data)
				.enter()
				.append("rect")
				.attr("x", function(d, i){
					return xScale(i) + xScale(0);
				})
				.attr("y", function(d, i){
					return h - yPadding;
				})
				.attr("width", function(d, i){
					return (w - 2*xPadding)/day_data.length - barPadding;
				})
				.transition().duration(function(d, i){
					return 800 + i*140;
				})
				.attr("height", function(d, i){
					return yScale(d[1]);
				})
				.attr("y", function(d, i){
					return h - yScale(d[1]) - yPadding;
				})
				.attr("fill", function(d, i){
					return colors[i];
				});


	};

	function todays_avg(){
		for(i = 0; i < logs.length; i++){
			split_date = logs[i].date.split("_");
			// console.log(logs[i]);
			if(split_date[1] == todays_day){
				return logs[i].temp - 1;
			}
		}
		return 0;
	}

	//Store date, temp and colors information
	var current_date = new Date();
	var todays_month = current_date.getMonth();
	var todays_day = current_date.getDate();
	var temps = ["freezing", "cold", "cool", "nice", "warm", "hot"];
	var colors = [
		"#356fc6", //freezing
		"#3598c6", //cold
		"#35c6b5", //cool
		"#50ef3b", //nice
		"#f9d13e", //warm
		"#d66836"  //hot
	];
	var backgrounds = [
		"#edf0fc", //freezing
		"#edf6fc", //cold
		"#edfcfb", //cool
		"#edfced", //nice
		"#fcfbed", //warm
		"#fcf1ed"  //hot
	]
	var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	var place_name = data.place;
	var all_logs = data.logs;
	var logs = createWeeklyLogs(all_logs); //We will save weekly, monthly, or yearly logs in this array - depending on the function we call.

	//Compute the average temperature
	var temp_avg = 0;
	logs.forEach(function(log){
		temp_avg += parseInt(log.temp);
	});
	temp_avg = temp_avg/logs.length;

	//Variables for visualization
	var barPadding = 1;
	var display = d3.select("body").select(".sub-body").select("#displaycard");

	//If the thank you message is necessary i.e. if the user just posted some info.
	if(thank_you){

		if(data.logs[0].temp < 5 && data.logs[0].temp > 2){
			// display.select(".data_heading").append("h3")
			// 	.attr("class", "heading_name")
			// 	.text("Great news!")
			// 	.style("font-weight", "normal")
			// 	.style("margin", "10px auto")
			// 	.style("font-size", "1.8rem");

			display.select(".data_heading").append("p")
				.classed("confirmation", "true")
				.text("Great news! Seems like we don't need to notify NYUAD Facilities this time.");
			display.select(".data_heading").append("p")
				.classed("confirmation", "true")
				.style("margin-top", "-12px")
				.text("Let us know if the A/C is bothering you in the future - we'll let Facilities know about it.");
		}
	 else {
			// display.select(".data_heading").append("h3")
			// 	.attr("class", "heading_name")
			// 	.text("Thank you!")
			// 	.style("font-weight", "normal")
			// 	.style("margin", "10px auto")
			// 	.style("font-size", "1.8rem");

			display.select(".data_heading").append("p")
				.classed("confirmation", "true")
				.text("Thank you! We'll notify Facilities about the temperature there at the end of today.");

			display.select(".data_heading").append("p")
				.classed("confirmation", "true")
				.style("margin-top", "-12px")
				.text("Let us know if the A/C is bothering you in the future - we'll let Facilities know about it.");

		}
	}
	$('input:text').focus(
    function(){
        $(this).val('');
    });

	$("input").on("input", function(){
		if(isInList($(this).val())){
			$(this).css("border", "2px solid #50ef3b");
			var location_input = $('input').val();
			$("#displaycard").animate({"margin-right": "-1000px"}, 300, "linear", function(){
				$("#displaycard").remove();
				$(".vis_options").remove();
				ajaxCall(location_input);
				$(this).css("border", "2px solid black");
			})
			thank_you = 0;
			console.log(location_input);
		}
		else{
			$(this).css("border", "2px solid red");
		}
	});

	//Title, e.g. "Baraha is cold today."
	var verb =  place_name.endsWith("s") ? " feel " : " feels ";
	$(".data_heading").append("<h2 class='heading_name'></h2>");
	if(todays_avg()) $(".heading_name").html("The <span clas='heading_name_title' style='font-weight: bold; font-size: 2.2rem;'>" + place_name + "</span>" + verb + " <span class='heading_name_temp' style='font-weight: bold; font-size: 2.2rem;'>" + temps[Math.round(todays_avg())] + "</span>  today.")
	else $(".heading_name").html("<span class='heading_name_title'>" + place_name + "</span>");

	$("body").css("background", backgrounds[Math.round(todays_avg())]);
	//Subtitle ("Over the past...")

	display.select(".data_heading").append("p").classed(".description", "true")
		.text(function(d){
			var text_string = "";
			text_string+="Over the past week, users have reported its temperature as '" + temps[Math.round(temp_avg)] + "' on average."
			return(text_string);
		})
		.style("margin-top", "-10px")
		.style("opacity", "0.5");


	visualizeDay();
	$(".data_heading").append("<div class='vis_options'></div>");
	$(".vis_options").css("visibility", "visible");
	$(".vis_options").append("<button class='choosegraph' id='daily'>Day</button><button class='choosegraph' id='weekly'>Week</button>");
	$("#daily").css("color", "white");
	$("#daily").css("background", "black");
	$("#weekly").click(function(){
		$("#weekly").css("color", "white");
		$("#weekly").css("background", "black");
		$("#daily").css("color", "black");
		$("#daily").css("background", "transparent");
		visualizeWeek(logs);
	});
	$("#daily").click(function(){
		visualizeDay();
		$("#daily").css("color", "white");
		$("#daily").css("background", "black");
		$("#weekly").css("color", "black");
		$("#weekly").css("background", "transparent");
	});
	//Graph
	//TODO: Add options to switch from weekly, monthly.

};
