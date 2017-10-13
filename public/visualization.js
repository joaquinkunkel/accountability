function preparePage(){
	d3.select(".before-visualization").remove();
};

function visualize(data){

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
				console.log("Adding to daysLogs, date: ", split_date[1], "\ntemperature: ", Math.ceil(l.temp)-1);
				daysLogs[Math.ceil(l.temp)-1][1] = daysLogs[Math.ceil(l.temp) - 1][1] + 1;
			}
		}
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

		//D3 initialization
		//If there is already a visualization there, remove it to replace with new one.
		display.selectAll("svg").remove();
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
					return h-(Math.ceil(d.temp))*30 -25;
				})
				.attr("width", function(d, i){
					return (w / logs.length) - barPadding;
				})
				.attr("height", function(d, i){
					return (Math.ceil(d.temp)) *30;
				})
				.attr("fill", function(d){
					return colors[Math.ceil(d.temp)];
				});

		var texts = svg.selectAll("text")
					.data(logs)
					.enter();

		texts.append("text")
				.text(function(d, i){
					return months[d.date.split("_")[0]] + " " + d.date.split("_")[1];
				})
				.attr("x", function(d, i){
					return (logs.length-i-1) * w/logs.length + w/logs.length/2 - 30;
				})
				.attr("y", function(d){
					return h - 8;
				});

		texts.append("text")
				.text(function(d, i){
					return temps[(Math.ceil(d.temp))];
				})
				.attr("x", function(d, i){
					return (logs.length-i-1) * w/logs.length + w/logs.length/2 - 30;
				})
				.attr("y", function(d){
					return h - (Math.ceil(d.temp))*30 - 35;
				})
				.style("font-weight", "normal")
				.style("font-size", "1.2rem")
				.style("opacity", "0.6");;
	};

	function visualizeDay(){
		var day_data = createDaysLogs(all_logs);

		var yScale = d3.scaleLinear()
                     .domain([0, d3.max(day_data, function(d) { return d[1]; })])
                     .range([0, h - 45]);

		display.selectAll("svg").remove();
		var svg = display.append("svg")
											.attr("width", w)
											.attr("height", h)
											.style("margin-top", "30px");
		svg.selectAll("rect")
				.data(day_data)
				.enter()
				.append("rect")
				.attr("x", function(d, i){
					return (day_data.length-i-1) * (w / day_data.length);
				})
				.attr("y", function(d, i){
					return h - yScale(d[1]) - 25;
				})
				.attr("width", function(d, i){
					return (w / day_data.length) - barPadding;
				})
				.attr("height", function(d, i){
					return yScale(d[1]);
				})
				.attr("fill", function(d, i){
					return colors[i+1];
				});

		var texts = svg.selectAll("text")
					.data(day_data)
					.enter();

		texts.append("text")
				.text(function(d, i){
					return temps[d[0]];
				})
				.attr("x", function(d, i){
					return (day_data.length-i-1) * (w / day_data.length) + (w / day_data.length)/2 -20;
				})
				.attr("y", function(d){
					return h - 8;
				});

		texts.append("text")
				.text(function(d, i){
					return d[1] == 1 ? d[1] + " report" : d[1] + " reports";
				})
				.attr("x", function(d, i){
					return (day_data.length-i-1) * (w / day_data.length) + (w / day_data.length)/2 -30;
				})
				.attr("y", function(d){
					return h - yScale(d[1]) - 31;
				})
				.style("font-weight", "normal")
				.style("font-size", "1.2rem")
				.style("opacity", "0.6");

	};

	function todays_avg(){
		for(i = 0; i < logs.length; i++){
			split_date = logs[i].date.split("_");
			// console.log(logs[i]);
			if(split_date[1] == todays_day){
				return logs[i].temp;
			}
		}
		return 0;
	}

	//Store date, temp and colors information
	var current_date = new Date();
	var todays_month = current_date.getMonth();
	var todays_day = current_date.getDate();
	var temps = ["", "freezing", "cold", "cool", "just right", "warm", "hot"];
	var colors = ["",
		"#356fc6", //freezing
		"#3598c6", //cold
		"#35c6b5", //cool
		"#50ef3b", //just right
		"#f9d13e", //warm
		"#d66836"  //hot
	];
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
	var w = $(window).width() <= 500 ? $(window).width() * 0.9 : 500;
	var h = 250;
	var barPadding = 1;
	var display = d3.select("body").select(".sub-body").select(".data_display");

	//Title, e.g. "Baraha is cold today."
	display.select(".data_heading").append("h2")
		.text(function(d){
			if(todays_avg()){
				return(place_name + " is " + temps[Math.ceil(todays_avg())] + " today.");
			}
			else{
				return(place_name);
			}
		})
		.style("margin-top", "50px")

	//Subtitle ("Over the past...")
	display.select(".data_heading").append("p")
		.text(function(d){
			return("Over the past week, the temperature at "+ place_name + " has been reported to be " + temps[Math.ceil(temp_avg)] + " on average. Data for the past 7 days:");
		})
	$(".vis_options").append("<button class='choosegraph' id='daily'>Daily</button><button class='choosegraph' id='weekly'>Weekly</button>");
	$("#weekly").click(function(){visualizeWeek(logs)});
	$("#daily").click(function(){visualizeDay()});
	//Graph
	//TODO: Add options to switch from weekly, monthly or yearly graphs.

};
