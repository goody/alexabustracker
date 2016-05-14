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
                    return b.stpnm === busStopName.replace('and', '&');
                });
                result.stopIds = [stop[0].stpid];
                resolve(result);
            }
        });
    });
}

function renderBusText(responseData) {
    var responseText = '';
    if (responseData == null) {
        responseText = 'There are no buses near.';
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
//     BusStopName: 'Clark and Lawrence'
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