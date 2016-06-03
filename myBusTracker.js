require('dotenv').config();
var cta = require('cta-bus-tracker');
var busTracker = cta(process.env.API_KEY);
var moment = require('moment-timezone');
var _ = require('lodash');



/*
TODO's
no results
bad request ie bus stop name


*/

/**
 * 
 * public functions
 * 
 */
 
 /**
  * 
  returns stop obj with buses approaching
  //TODO: node_module returns an obj if there's only one bus and an array if there're more than one 
  */
function getStopSchedule(options) {
    var response = {};
    if (options.stopIds === false) {
        response.error = _errorText(options.byRoute);
        response.repromptText = 'Which bus stop would you like the schedule for?';
        return response;
    }
    return new Promise(function (resolve, reject) {
        busTracker.predictionsByStop(options, function (err, data) {
            if (err) {
                console.log('err:', err);
            }
            //bad stpid
            if (data == null) {
                response.error = _errorText(options.byRoute);
                response.repromptText = 'Which bus stop would you like the schedule for?';
                resolve(response);
            } else {
                response.busData = data;
                resolve(response);
            }
            
        });
    });
}

/**
 * returns stop id from route number, direction, and stop by name
 * Alexa sometimes returns lower case and CTA api requires Title Case for Direction
 * also toLowerCase for comparing stops for same reason
 * 
 */
function getRouteStop(options) {
    return new Promise(function (resolve, reject) {
        console.log('getRouteStop start.');
        var userDirection = options.options.RouteDirection.substring(0,2);
        var routeId = options.options.BusRouteNumber;
        var routeDirection = _.findIndex(options.routeDirections, function(o) { return o.substring(0,2).toLowerCase() === userDirection.toLowerCase(); });
        //var routeDirection = options.routeDirections.indexOf(userDirection)
        var busStopName = options.options.BusStopName;

        busTracker.stops(routeId, options.routeDirections[routeDirection], function (err, data) {
            var result = {};
            if (err) {
                console.log('err', err);
            }
            if (data == null) {
                result = null;
                resolve(result);
            } else {
                //filter results on cross street
                var stop = _.filter(data, function (b) {
                    return b.stpnm.toLowerCase() === busStopName.replace('and', '&').toLowerCase();
                });
                
                //return false if no ids found
                result.stopIds = stop.length > 0 ?  [stop[0].stpid] : false;
                resolve(result);
            }
        });
    });
}


/**
 * returns stop id from route number, direction, and stop by name
 * Alexa sometimes returns lower case and CTA api requires Title Case for Direction
 * also toLowerCase for comparing stops for same reason
 * 
 */
function getRouteDirections(options) {
    return new Promise(function (resolve, reject) {
        console.log('getRouteDirections start.');
        var routeId = options.BusRouteNumber;

        busTracker.routeDirections(routeId, function (err, data) {
            var result = {};
            if (err) {
                console.log('err', err);
            }
            if (data == null) {
                result = null;
                resolve(result);
            } else {
                //return array of directions
                result.routeDirections = data;
                //pass along original params
                result.options = options;
                resolve(result);
            }
        });
    });
}

function renderBusText(responseData) {
    var responseText = '';
    if (responseData.error != null) {
        responseText = responseData.error;
    } else {
        var busData = responseData.busData;
        if (Array.isArray(busData)) {
            var howManyBuses = busData.length;
            var busTimes = '';
            for (var i = 0; i < howManyBuses; i++) {
                if (i === howManyBuses - 1) {
                    busTimes += ' and ';
                }
                
                busTimes += _getArrivalTime(busData[i].prdtm).toString();
                
                if(i != howManyBuses - 1) {
                    busTimes += ', '; //comma appended to slow down Alexa
                }
            }
            responseText = 'The ' + busData[0].rtdir + ' bound ' + busData[0].rt + ' bus at ' + busData[0].stpnm + ' has ' + howManyBuses + ' buses arriving in ' + busTimes + ' minutes';
        } else {
            responseText = 'The ' + busData.rtdir + ' bound ' + busData.rt + ' bus at ' + busData.stpnm + ' has one bus arriving in ' + _getArrivalTime(busData.prdtm) + ' minutes.';
        }
    }
    return responseText;
}

/**
 * 
 * internal 
 * 
 */

function _getArrivalTime(expectedTime){
    var expected = moment(expectedTime).tz("America/Chicago").format();
    var current = moment().tz("America/Chicago").format();
    var arriving = moment(expected).diff(current,'minutes');
    return arriving.toString();
}

function _errorText(isRoute) {
    var returnText = 'I had trouble finding that bus stop, ';
    if (isRoute === true) {
        returnText += 'please try again using the direction, bus route number, and stop name or cross streets.  For the most accurate results use the bus stop ID number';
    } else {
        returnText += 'please tell me the bus stop ID number for the stop you would like the schedule for';
    }
    return returnText;
}

function _toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
}

/***
 * 
 * Testing
 * 
 * */

//for local testing
// var options = {
//     // // // a list of up to 10 stop IDs 
//     // stopIds: [ "3766" ],
//     // // topCount is optional 
//     // topCount: 5
//     BusRouteNumber: 22,
//     RouteDirection: 'Southbound',
//     BusStopName: 'Clark and Lawrence'
// };

// getStopSchedule(options).then(function(val){
//    console.log(renderBusText(val)); 
// });
// getRouteDirections(options)
// .then(getRouteStop)
// //getRouteStop(options)
// .then(getStopSchedule)
// .then(function(val){
//     console.log(renderBusText(val));
// });

// for local testing
// getRouteSchedule(options).then(function(val){
//     console.log('val final: ', val);
// })
// .catch(function(err){
//     console.log('err: ', err);
// });

module.exports = {
    getRouteDirections : getRouteDirections,
    getStopSchedule : getStopSchedule,
    getRouteStop : getRouteStop,
    renderBusText: renderBusText
}