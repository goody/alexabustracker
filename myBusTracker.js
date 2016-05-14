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
    var responseText = {};
    if(options.stopIds === false){
        return responseText.error = 'I had trouble finding the bus stop.';
    }
    return new Promise(function (resolve, reject) {
        busTracker.predictionsByStop(options, function (err, data) {
            if (err) {
                console.log('err:', err);
            }
            resolve(data);
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
        var routeId = options.BusRouteNumber;
        var routeDirection = _toTitleCase(options.RouteDirection);
        var busStopName = options.BusStopName;

        busTracker.stops(routeId, routeDirection, function (err, data) {
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
                result.stopIds = [stop[0].stpid] || false;
                resolve(result);
            }
        });
    });
}

function renderBusText(responseData) {
    var responseText = '';
    if (responseData.error == null) {
        responseText = responseData.error;
    } else {
        if (Array.isArray(responseData)) {
            var howManyBuses = responseData.length;
            var busTimes = '';
            for (var i = 0; i < howManyBuses; i++) {
                busTimes += _getArrivalTime(responseData[i].prdtm).toString();
                if (i < howManyBuses - 1) {
                    busTimes += ' and ';
                }
            }
            responseText = 'The ' + responseData[0].rtdir + ' ' + responseData[0].rt + ' bus at ' + responseData[0].stpnm + ' has ' + howManyBuses + ' buses arriving in ' + busTimes + ' minutes';
        } else {
            responseText = 'The ' + responseData.rtdir + ' ' + responseData.rt + ' bus at ' + responseData.stpnm + ' has one bus arriving in ' + _getArrivalTime(responseData.prdtm) + ' minutes.';
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

function _toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

/***
 * 
 * Testing
 * 
 * */

//for local testing
// var options = {
//     // // a list of up to 10 stop IDs 
//     //stopIds: [ "3766" ],
//     // // topCount is optional 
//     // topCount: 5
//     BusRouteNumber: 22,
//     RouteDirection: 'Northbound',
//     BusStopName: 'Clark and lawrence'
// };

// // getStopSchedule(options).then(function(val){
// //    console.log(renderBusText(val)); 
// // });
// getRouteStop(options)
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
    getStopSchedule : getStopSchedule,
    getRouteStop : getRouteStop,
    renderBusText: renderBusText
}