console.log("it works");
var our_button = document.getElementById("gobutton");

our_button.addEventListener('click', function(){
  console.log("i am clicked");
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
	var user_location = $('input[name="user_location_query"]').val();

		$.ajax({
		url: '/dummy',
		type: 'GET',
		//dataType: 'jsonp',
		error: itFailed,
		success: itWorked
	});

});