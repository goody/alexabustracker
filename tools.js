/*
Tools for manually generating Custom Slot Type values using CTA Bus Tracker API calls.
ROUTE_DIRECTION * currently just one word: Northbound, Southbound, Eastbound, Westbound
ROUTE_NUMBER - every bus route number
ROUTE_NAME - every bus route name
BUS_STOP_NAME - every bus stop for every route ie both directions
*/
require('dotenv').config();
var cta = require('cta-bus-tracker');
var busTracker = cta(process.env.API_KEY);
var moment = require('moment-timezone');
var _ = require('lodash');
var fs = require('fs');
var _TOOLS = 'tool_output/';

/*
fire off tools
*/

//getRoutes();
//getAllStops();
//_getRoutes();
// _getDirections('19').then(function(val){
//     console.dir(val);
// });

    //  busTracker.routeDirections('19', function (err, data) {

    //         if (err) {
    //             console.log('error getting directions for ' + routeId);
    //         } 
    //         console.log(data);
    //     });

/*
File generating funcs
*/

/*
creates BUS_STOP_NAME.txt
params
    routeNumber
    routeDirction
    TODO:  hack...just removed dupes in Excel
*/

function getAllStops() {
    var stops = '';

    _getRoutes().then(function (routes) {
        _(routes).forEach(function (route) {
            _getDirections(route.rt).then(function (results) {
                _(results.directions).forEach(function (val) {
                    console.log(results.route + ' -> ' + val);
                    _getRouteStops(results.route, val).then(function (sval) {
                        console.log('sval: ' + sval);
                        stops += sval;
                    }).then(function () {
                        fs.writeFile(_TOOLS + 'BUS_STOP_NAME.txt', stops, function (err) {
                            if (err) {
                                console.log('file error: ', err);
                            } else {
                                console.log('BUS_STOP_NAME file written');
                            }
                        });
                    });
                });
            });
        });
    })


}

/*
creates ROUTE_NUMBER.txt
creates ROUTE_NAME.txt
*/
function getRoutes() {
    busTracker.routes(function (err, data) {
        if (err) {
            console.log('error getting routes', err);
        }
        var routeNumbers = '';
        var routeNames = '';
        //rt and rtnm
        _(data).forEach(function (val) {
            routeNumbers += val.rt + '\r\n';
            routeNames += val.rtnm + '\r\n';
        });
        fs.writeFile(_TOOLS + 'ROUTE_NUMBER.txt', routeNumbers, function (err) {
            if (err) {
                console.log('file error: ', err);
            } else {
                console.log('ROUTE_NUMBER file written');
            }
        });
        fs.writeFile(_TOOLS + 'ROUTE_NAME.txt', routeNames, function (err) {
            if (err) {
                console.log('file error: ', err);
            } else {
                console.log('ROUTE_NAME file written');
            }
        });
    });
}


/*
Internal Funcs
*/


/*
get directions of route
params
    routeNumber 
returns array
[ 'Eastbound', 'Westbound' ] 

*/
function _getDirections(routeId) {
    console.log('getting directions for ' + routeId + '...');
    return new Promise(function (resolve, reject) {
        busTracker.routeDirections(routeId, function (err, data) {

            if (err) {
                console.log('error getting directions for ' + routeId);
                reject(err);
            } else {
                var results = {
                    route: routeId,
                    directions: Array.isArray(data) ? data : [data]
                }   
            }
            resolve(results);
        });
    });
}

/*
get routes
returns json 
[ 
    { rt: '1', rtnm: 'Bronzeville/Union Station', rtclr: '#336633' },
    { rt: '2', rtnm: 'Hyde Park Express', rtclr: '#993366' },
    ...
]
*/
function _getRoutes() {
    console.log('getting routes...');
    return new Promise(function (resolve, reject) {
        busTracker.routes(function (err, data) {
            if (err) {
                console.log('error getting routes', err);
                reject(err);
            }
            resolve(data);
        });

    });
}

/*
return route's stops as list to attend to master stop list txt
[stop]\r\n
[stop]\r\n
[stop]\r\n
*/
function _getRouteStops(routeId, direction) {
    console.log('building route stops list for ' + routeId + ':' + direction + '...');
    return new Promise(function (resolve, reject) {
        var stops = '';
        busTracker.stops(routeId, direction, function (err, data) {
            if (err) {
                console.log('Route: ' + routeId + ':' + direction + ' err', err);
                reject(err);
            }
            console.dir(data);
            _(data).forEach(function (val) {
                stops += val.stpnm + '\r\n';
            });
             console.log('route stops built for ' + routeId + ':' + direction);
            resolve(stops);
        });
    });
}