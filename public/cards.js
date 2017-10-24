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

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
