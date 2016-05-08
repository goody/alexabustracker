require('dotenv').config();
var cta = require('cta-bus-tracker');
var busTracker = cta('eXDDtJt4dirsrLFmiY7UDryHU');
var moment = require('moment-timezone');

//for local testing
// var options = {
//     // a list of up to 10 stop IDs 
//     stopIds: [ "3766" ],
//     // topCount is optional 
//     topCount: 5
// };
 
 //TODO: returns an obj if there's only one bus and an array if there're more than one 
function getSchedule(options) {
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

// for local testing
// getSchedule(options).then(function(val){
//     console.log('val: ', val);
// })
// .catch(function(err){
//     console.log('err: ', err);
// });

module.exports = {
    getSchedule : getSchedule
}