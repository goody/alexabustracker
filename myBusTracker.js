require('dotenv').config();
var cta = require('cta-bus-tracker');
var busTracker = cta(process.env.API_KEY);
var moment = require('moment-timezone');
var _ = require('lodash');

var fs = require('fs');

 
 //TODO: returns an obj if there's only one bus and an array if there're more than one 
function getStopSchedule(options) {
    return new Promise(function (resolve, reject) {
        var responseText = "I'm waiting for a response.";
        busTracker.predictionsByStop(options, function (err, data) {
            if (err) {
                console.log('err:', err);
            }
            if (data == null) {
                responseText = 'There are no buses near.';
            } else {
                if (Array.isArray(data)) {
                    var howManyBuses = data.length;
                    var busTimes = '';
                    for (var i = 0; i < howManyBuses; i++) {
                        busTimes += _getArrivalTime(data[i].prdtm).toString();
                        if(i < howManyBuses-1){
                            busTimes += ' and ';
                        }
                    }
                    responseText = 'The ' + data[0].rtdir + ' ' + data[0].rt + ' bus at ' + data[0].stpnm + ' has ' + howManyBuses + ' buses arriving in ' + busTimes + ' minutes';
                } else {
                    responseText = 'The ' + data.rtdir + ' ' + data.rt + ' bus at ' + data.stpnm + ' has one bus arriving in ' + _getArrivalTime(data.prdtm) + ' minutes.';
                }
            }
            resolve(responseText);
            reject(responseText);
        });
    });
}

function _getArrivalTime(expectedTime){
    var expected = moment(expectedTime).tz("America/Chicago").format();
    var current = moment().tz("America/Chicago").format();
    var arriving = moment(expected).diff(current,'minutes');
    return arriving.toString();
}

function getRouteSchedule(options) {
    return new Promise(function (resolve, reject) {
        var responseText = '';
        console.log('options', options);
        //intent with route number, direction, and cross street
        var routeId = options.BusRouteNumber;
        var routeDirection = options.RouteDirection;
        var busStopName = options.BusStopName;

        busTracker.stops(routeId, routeDirection, function (err, data) {
            if (err) {
                console.dir(err);
                reject(err);
                // handle error
            }
            if (data == null) {
                responseText = 'There are no buses near.';
            }
            //filter results on cross street
            var test = _.filter(data, function (b) {
                return b.stpnm === busStopName.replace('and', '&');
            });
            responseText = test;
        });
                // console.log('val3:', test);
                // var options = { stopIds: [val[0].stpid] };
                // getStopSchedule(options).then(function (val) {

                //     console.log('val2: ', val);
                //     responseText = val;
                // })
                //     .catch(function (err) {
                //         console.log('err: ', err);
                //         reject(err);
                //     });
        resolve(responseText);
    });
}

/***
 * 
 * Testing
 * 
 * */

//for local testing
var options = {
    // // a list of up to 10 stop IDs 
    // stopIds: [ "3766" ],
    // // topCount is optional 
    // topCount: 5
    BusRouteNumber: 22,
    RouteDirection: 'Northbound',
    BusStopName: 'Clark and Lawrence'
};


// for local testing
getRouteSchedule(options).then(function(val){
    console.log('val final: ', val);
})
.catch(function(err){
    console.log('err: ', err);
});

module.exports = {
    getStopSchedule : getStopSchedule,
    getRouteSchedule : getRouteSchedule
}