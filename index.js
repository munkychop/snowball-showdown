var _nuimotion = require("nuimotion");
var _express = require("express");
var _app = _express();
var _server = require("http").Server(_app);
var _path = require("path");
var _io = require("socket.io")(_server);

_app.use(_express.static(__dirname + "/public/dist"));

_app.get("/", function(req, res){
  res.sendFile("/index.html");
});

_server.listen(3000, function(){
  console.log("listening on *:3000");
});


// mirror the skeleton joint variables so that it actually makes sense!
var LEFT_HAND = _nuimotion.Joints.RIGHT_HAND;
var RIGHT_HAND = _nuimotion.Joints.LEFT_HAND;
var HEAD = _nuimotion.Joints.HEAD;
var THROW_GESTURE_DRIFT_DISTANCE = 100;
var THROW_GESTURE_START_PERCENT_EXTENDED = 45;
var THROW_GESTURE_END_PERCENT_EXTENDED = 80;


var _throwGestureInProgress = false;
var _activeThrowGestures = {left : false, right : false};
var _userBiengTracked = false;

// start the skeleton listener, add the joints, a callback and (optionally) a frame rate in milliseconds for checking
_nuimotion.startSkeletonListener([LEFT_HAND, RIGHT_HAND, HEAD], skeletonUpdateHandler);

_nuimotion.addListener([_nuimotion.Events.SKELETON_TRACKING], skeletonTrackingStartHandler);
_nuimotion.addListener([_nuimotion.Events.SKELETON_STOPPED_TRACKING], skeletonTrackingStopHandler);

_nuimotion.init();

/**
 * skeleton update callback
 * @param skeleton
 */
function skeletonUpdateHandler (data)
{
    //console.log(skeleton);

    var skeleton = data.skeleton;
    var rightHandJoint = skeleton[RIGHT_HAND];
    var leftHandJoint = skeleton[LEFT_HAND];
    var headJoint = skeleton[HEAD];

    if (checkIfJointDidThrow("right", rightHandJoint, headJoint))
    {
        console.log("right hand throw detected!");

        _io.sockets.emit("throw-gesture");
    }
    else if(checkIfJointDidThrow("left", leftHandJoint, headJoint))
    {
        console.log("left hand throw detected!");

        _io.sockets.emit("throw-gesture");
    }
}

function checkIfJointDidThrow (handName, handJoint, headJoint)
{
    if (_activeThrowGestures[handName])
    {
        //travelling in the same direction, but hasn't hit the target yet...
        if (handJoint.y < (headJoint.y + THROW_GESTURE_DRIFT_DISTANCE) &&
            handJoint.y > (headJoint.y - THROW_GESTURE_DRIFT_DISTANCE))
        {
            if (handJoint.percentExtended > THROW_GESTURE_END_PERCENT_EXTENDED)
            {
                // We hit the target! Emit socket event.
                _activeThrowGestures[handName] = false;
                //console.log("throw gesture detected!");

                return true;
            }
        }
        else
        {
            _activeThrowGestures[handName] = false;
            console.log(handName + " throw gesture cancel");
        }
    }
    else if (handJoint.percentExtended < THROW_GESTURE_START_PERCENT_EXTENDED &&
        handJoint.y < (headJoint.y + THROW_GESTURE_DRIFT_DISTANCE) &&
        handJoint.y > (headJoint.y - THROW_GESTURE_DRIFT_DISTANCE))
    {
        console.log(handName + " throw gesture start.");

        _activeThrowGestures[handName] = true;
    }

    return false;
}


function skeletonTrackingStartHandler (event)
{

    if (_userBiengTracked) return;

    console.log("skeleton tracking started");

    _userBiengTracked = true;

    _io.sockets.emit("skeleton-tracking-start");
}

function skeletonTrackingStopHandler (event)
{
    if (!_userBiengTracked) return;

    console.log("skeleton tracking stopped");

    _userBiengTracked = false;

    _io.sockets.emit("skeleton-tracking-stop");
}


//---------------------------------------------------------------------------------------------------------------------
// cleanup process (from http://stackoverflow.com/questions/14031763/doing-a-cleanup-action-just-before-node-js-exits).
//---------------------------------------------------------------------------------------------------------------------

process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {

    _nuimotion.close();
    _server.close();
    
    _io.sockets.removeAllListeners();
    //_io.disconnect();

    if (options.cleanup)
    {
        console.log("clean");
    }

    if (err)
    {
        console.log("error:", err.stack);
    }

    if (options.exit)
    {
        console.log("exiting process...");
        process.exit();
    }
}

/**
 * listen for Node process shutdown/error/cleanup and close NUIMotion appropriately
 */
//do something when app is closing
process.on("exit", exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on("SIGINT", exitHandler.bind(null, {exit:true}));

process.on("SIGTERM", function () {
    console.log("SIGTERM called...");
});

//catches uncaught exceptions
process.on("uncaughtException", exitHandler.bind(null, {exit:true}));