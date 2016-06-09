require('dotenv').config();
var cta = require('cta-bus-tracker');
var busTracker = cta(process.env.API_KEY);
var moment = require('moment-timezone');
var _ = require('lodash');

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
    return new Promise(function (resolve, reject) {
        busTracker.predictionsByStop(options, function (err, data) {
            if (err) {
                console.log('err:', err);
                response.errorType = 'default';
                reject(response);
            }
            //bad stpid
            if (data == null) {
                response.errorType = 'stopError';
                reject(response);
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
        var responseObj = {};
        var userDirection = options.RouteDirection.substring(0,2);
        var routeId = options.BusRouteNumber;
        var routeName = options.BusRouteName;
        var routeDirection = _.findIndex(options.routeDirections, function(o) { return o.substring(0,2).toLowerCase() === userDirection.toLowerCase(); });
        //var routeDirection = options.routeDirections.indexOf(userDirection)
        var busStopName = options.BusStopName;

        busTracker.stops(routeId, options.routeDirections[routeDirection], function (err, data) {
            var result = {};
            result.byRoute = true;
            result.routeId = routeId;
            result.routeDirection = routeDirection;
            result.busStopName = busStopName;
            if (err) {
                console.log('err', err);
                response.errorType = 'default';
                reject(response);
            }
            if (data == null) {
                options.errorType = 'routeError';
                reject(options);
            } else {
                //filter results on cross street
                var stop = _.filter(data, function (b) {
                    return b.stpnm.toLowerCase() === busStopName.replace('and', '&').toLowerCase();
                });

                //return false and reject if no ids found
                result.stopIds = stop.length > 0 ? [stop[0].stpid] : false;
                if(result.stopIds === false) {
                    options.errorType = 'crossStreetError';
                    reject(options);
                }
                resolve(result);
            }
        });
    });
}

/**
 * returns the route number from the route name
 * Alexa sometimes returns lower case and CTA api requires Title Case
 * so toLowerCase for comparing
 * 
 */
function getRouteNumber(options) {
    return new Promise(function (resolve, reject) {
        console.log('getRouteNumber start.');
        //if we already have the route number
        if(options.busRouteNumber != null || options.busRouteNumber != ''){
            console.log('already had route #');
            resolve(options);
        }
        var routeName = options.BusRouteName;
        if (routeName == null || routeName === '') {
            options.errorType = 'routeNameNull';
            reject(options);
        } 

        busTracker.routes(function (err, data) {
            if (err) {
                console.dir('err', err);
            }
            if (data == null) {
                //TODO: why result = null
                options.errorType = 'routeNameError';
                reject(options);
            } else {
                var route = _.filter(data, function (r) {
                    return r.rtnm.toLowerCase() === routeName.replace('/', 'and').toLowerCase();
                });
                if(route == null || route.length < 1){
                    options.errorType = 'routeNameError';
                    reject(options);                    
                }
                options.BusRouteNumber = route[0].rt;
                resolve(options);
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
        if (routeId == null || routeId === '') {
            options.errorType = 'routeNumberNull';
            reject(options);
        } 

        busTracker.routeDirections(routeId, function (err, data) {
            if (err) {
                console.dir('err', err);
            }
            if (data == null) {
                //TODO: why result = null
                options.errorType = 'routeNumberInvalid';
                reject(options);
            } else {
                //return array of directions
                options.routeDirections = data;
                resolve(options);
            }
        });
    });
}

function renderBusText(responseData) {
    var responseText = '';
    if (responseData.isError != null) {
        responseText = responseData.errorMessage;
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

                if (i != howManyBuses - 1) {
                    busTimes += ', '; //comma appended to slow down Alexa
                }
            }
            responseText = 'The ' + busData[0].rtdir + ' ' + busData[0].rt + ' bus at ' + busData[0].stpnm + ' has ' + howManyBuses + ' buses arriving in ' + busTimes + ' minutes';
        } else {
            responseText = 'The ' + busData.rtdir + ' ' + busData.rt + ' bus at ' + busData.stpnm + ' has one bus arriving in ' + _getArrivalTime(busData.prdtm) + ' minutes.';
        }
    }
    console.log(responseText);
    return responseText;
}

function errorHandler(error) {
    error.isError = true;
    error.errorMessage = _errorText(error.errorType);
    error.repromptText = 'Which bus stop would you like the schedule for?';
    console.log(error);
    return error;
}

/**
 * 
 * internal 
 * 
 */

function _getArrivalTime(expectedTime) {
    var expected = moment(expectedTime).tz("America/Chicago").format();
    var current = moment().tz("America/Chicago").format();
    var arriving = moment(expected).diff(current, 'minutes');
    return arriving.toString();
}

function _errorText(errorType) {
    var returnText = 'I had trouble retrieving the bus schedule, ';
    switch (errorType) {
        case 'routeError':
            returnText += 'please try again using the direction, bus route number, and cross streets.  For the most accurate results use the bus stop ID number';
            break;
        case 'crossStreetError':
            returnText += 'the cross street or stop name were not listed on the bus route. Please, try again using the direction, route number, and cross streets.  For the most accurate results use the bus stop ID number';
            break;          
        case 'stopError':
            returnText += 'please tell me the bus stop ID number for the stop you would like the schedule for';
            break; 
        case 'routeNumberInvalid':
            returnText += 'that bus route number returned no results. Please double check the route number.';
            break; 
        case 'routeNumberNull':
            returnText += 'I did not catch that route number.  Please specify the bus route number when requesting a bus schedule by direction, route number, and cross streets.';
            break;      
        case 'routeNameNull':
            returnText += 'please tell me the name of the bus route.  You can use either the number or the name.';
            break;    
        case 'routeNameError':
            returnText += 'I did not find any results for that route name.  Please double check the route name and try again.';
            break;                                             
        default:
            returnText += 'please try again using the direction, bus route number, and cross streets.  For the most accurate results use the bus stop ID number';
            break;
    }
    return returnText;
}

module.exports = {
    getRouteNumber : getRouteNumber,
    getRouteDirections : getRouteDirections,
    getStopSchedule : getStopSchedule,
    getRouteStop : getRouteStop,
    renderBusText : renderBusText,
    errorHandler : errorHandler
}