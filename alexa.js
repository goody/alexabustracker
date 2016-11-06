require('dotenv').config();
var busTracker = require('./myBusTracker.js');
var storage = require('./storage.js');

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */

        /*        if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app." + process.env.APPLICATION_ID) {
                     context.fail("Invalid Application ID");
                }*/


        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId +
        ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId +
        ", sessionId=" + session.sessionId);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId +
        ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if ("BusByStopIntent" === intentName) {
        getBusByStop(intent, session, callback);
    } else if ("BusByRouteIntent" === intentName) {
        getBusByRoute(intent, session, callback);
    } else if ("LastSuccessIntent" === intentName) {
        getLastBus(intent, session, callback);
    }else if ("AMAZON.HelpIntent" === intentName) {
        getHelp(callback);
    } else if ("AMAZON.StopIntent" === intentName || "AMAZON.CancelIntent" === intentName || "StopIntent" === intentName) {
        handleSessionEndRequest(callback);
    } else {
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId +
        ", sessionId=" + session.sessionId);
    // Add cleanup logic here
}

// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Welcome";
    var speechOutput = "Welcome to the Chicago Bus Stop skill. " +
        "Please tell me which bus stop you would like the schedule for.";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "For example, ask me,  when is the next bus at stop three seven seven three";
    var shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function getHelp(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Help";
    var speechOutput = "To get the schedule for a bus stop either ask for the next buses at that specific stop number, or, give the direction, route number, and cross streets," +
        "For example, when are the next buses at stop number three seven six six, or, when is the next north bound twenty two bus at Clark and Addison.";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "Which stop would you like to know the schedule for";
    var shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function getBusByStop(intent, session, callback) {
    var cardTitle = "Getting Bus by Stop #";
    var repromptText = "";
    var shouldEndSession = false;
    var sessionAttributes = {};
    var busStop = intent.slots.BusStopId.value;
    console.log('REQUEST getBusByStop:');
    console.log('stp: ' + busStop);
    var options = {
        // a list of up to 10 stop IDs...currently only using one
        stopIds: [busStop],
        // topCount is optional 
        topCount: 5
    };
    var speechOutput = '';
    busTracker.getStopSchedule(options)
        .catch(busTracker.errorHandler)
        .then(function (results) {
            speechOutput = busTracker.renderBusText(results);
            //add logic to test success and return end sessions
            shouldEndSession = results.isError ? false : true;
            if(!results.isError) {
                storage.loadUser(session, function(userData){
                    userData.data.busType = "stop";
                    userData.data.slots = intent.slots;
                    userData.save(function(){
                        repromptText = results.repromptText ? results.repromptText : '';
                        callback(sessionAttributes,
                            buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
                    });
                });
            }
        });

}

function getBusByRoute(intent, session, callback) {
    var cardTitle = "Getting Bus by Direction, Route, and Stop Name/Cross Streets";
    var repromptText = "";
    var shouldEndSession = false;
    var sessionAttributes = {};
    var routeDirection = intent.slots.RouteDirection.value;
    var busRouteNumber = intent.slots.BusRouteNumber.value;
    var busStopName = intent.slots.BusStopName.value;
    var busRouteName = intent.slots.BusRouteName.value;
    console.log('REQUEST getBusByRoute:');
    console.log('dir: ' + routeDirection, '#: ' + busRouteNumber, 'stp: ' + busStopName, 'nm: ' + busRouteName);
    var options = {
        RouteDirection: routeDirection,
        BusRouteNumber: busRouteNumber,
        BusRouteName: busRouteName,
        BusStopName: busStopName
    };
    var speechOutput = '';
    busTracker.getRouteNumber(options)
        .then(busTracker.getRouteDirections)
        .then(busTracker.getRouteStop)
        .then(busTracker.getStopSchedule)
        .catch(busTracker.errorHandler)
        .then(function (results) {
            speechOutput = busTracker.renderBusText(results);
            //add logic to test success and return end sessions
            shouldEndSession = results.isError ? false : true;
            repromptText = results.repromptText ? results.repromptText : '';
            if(!results.isError) {
                storage.loadUser(session, function(userData){
                    userData.busType = "route";
                    userData.slots = intent.slots;
                    userData.save();
                });
            }
            callback(sessionAttributes,
                buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
        });
}

function getLastBus(intent, session, callback) {
    storage.loadUser(session, function(userData) {
        intent.slots = session.attributes.currentUser.slots;

        if(!session.attributes.currentUser || !session.attributes.currentUser.busType) {
            getWelcomeResponse(callback);
        } else if(session.attributes.currentUser.busType == "route") {
            getBusByRoute(intent, session, callback);
        } else {
            // busType == "stop"
            getBusByStop(intent, session, callback);
        }
    });
}

function handleSessionEndRequest(callback) {
    var cardTitle = "Session Ended";
    var speechOutput = "Thank you for using the Chicago Bus Stop Skill. Have a nice day!";
    // Setting this to true ends the session and exits the skill.
    var shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

/**
 * Sets the color in the session and prepares the speech to reply to the user.
 */

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}