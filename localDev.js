require('dotenv').config();
var busTracker = require('./myBusTracker.js');


/***
 * 
 * Testing
 * 
 * */

//for local testing
var options = {
    // // // a list of up to 10 stop IDs 
    // stopIds: [ "3766" ],
    // // topCount is optional 
    // topCount: 5
    BusRouteNumber: 'J14',
    RouteDirection: 'North',
    BusStopName: 'Balbo and Columbus',
    BusRouteName: ''
};

// busTracker.getStopSchedule(options)
// .then(busTracker.renderBusText); 

// busTracker.getRouteNumber(options)
// .then(function(val){
//     console.log(val);
// });

busTracker.getRouteNumber(options)
.then(busTracker.getRouteDirections)
.then(busTracker.getRouteStop)
//getRouteStop(options)
.then(busTracker.getStopSchedule)
// .then(function(val){
//     console.log(renderBusText(val));
// })
.catch(busTracker.errorHandler)
.then(busTracker.renderBusText);

// for local testing
// getRouteSchedule(options).then(function(val){
//     console.log('val final: ', val);
// })
// .catch(function(err){
//     console.log('err: ', err);
// });

// var stop = _.filter(routeObj, function (r) {
//     return r.rtnm.toLowerCase() === 'hyde park express';
// });
// console.log(stop);
