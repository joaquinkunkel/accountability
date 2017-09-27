console.log("it works");
var our_button = document.getElementById("gobutton");

our_button.addEventListener('click', function(){
  console.log("i am clicked");
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

//Parse the JSON file to import the data into this D3 script
  var data = [];
  d3.json("../data/places_dummy.json", function(error, data) {

    d3.select("body").select(".contents").select(".data_display").selectAll("h1")
      .data(data.all_places)
      .enter()
      .append("h1")
      .text(function(d){
        var input_text = $('input').val();
        if(input_text == d.name){
          return d.name + JSON.stringify(d.logs);
        }
      });

    });

});

//An "error" or "fail" function
function itFailed(data){
	console.log("Failed");
	console.log(data);
}

//A "success" or "done" function
function itWorked(data){
	console.log("Worked !");
	console.log(data);
}

var $submit_button = $('#gobutton');
$submit_button.click(function(){
	var location_input = $('input[name="user_location_query"]').val();
	//var link_url = '/dummy:' +

		$.ajax({
		url: '/place-query',
		data: {
			user_location_query: location_input
		},
		type: 'GET',
		//dataType: 'jsonp',
		error: itFailed,
		success: itWorked
	});

});