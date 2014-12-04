(function (){
	
	var socketio = require('socket.io-client')(window.location.href);

	var userPromptStartMoving = document.querySelector(".user-prompt-start-moving");
	userPromptStartMoving.classList.add("active");

	socketio.on("skeleton-tracking-start", skeletonTrackingStartHandler);
	socketio.on("skeleton-tracking-stop", skeletonTrackingStopHandler);
	socketio.on("throw-gesture", throwGestureHandler);

	function skeletonTrackingStartHandler ()
	{
		console.log("skeletonTrackingStartHandler");

		userPromptStartMoving.classList.remove("active");
	}

	function skeletonTrackingStopHandler ()
	{
		console.log("skeletonTrackingStopHandler");

		userPromptStartMoving.classList.add("active");
	}

	function throwGestureHandler ()
	{
		console.log("throwGestureHandler");
	}

})();