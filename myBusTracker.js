require('dotenv').config();
var cta = require('cta-bus-tracker');
var busTracker = cta('eXDDtJt4dirsrLFmiY7UDryHU');


// busTracker.vehiclesByRoute( ['81'], function ( err, data ) {
//     if ( err ) {
//         console.log('error:',err);
//     }
//     console.log('vehiclesByRoute:',data);
// } );

var options = {
    // a list of up to 10 stop IDs 
    stopIds: [ "3756" ],
    //stopIds: [ "3766" ],
    // topCount is optional 
    topCount: 5
};
 
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
                console.log('There are no buses near.');
            } else {
                if (Array.isArray(data)) {
                    var howManyBuses;
                    var busTimes = 'filler for bus times';
                    for (var i = 0; i < howManyBuses; i++) {
                        busTimes += _getArrivalTime(data[i].prdtm).toString();
                        if(i < howManyBuses-1){
                            busTimes += ' and ';
                        }
                    }
                    responseText = 'There are ' + howManyBuses + ' arriving in ' + busTimes + ' minutes';
                } else {
                    responseText = 'There is one bus arriving in ' + _getArrivalTime(data.prdtm) + ' minutes.';
                }
            }
            resolve(responseText);
            reject(responseText);
        });
    });
    // busPromise.then(function (val) { return responseText})
    //     .catch(function (err) {  return responseText + err});
}

function _getArrivalTime(expectedTime){
    var expected = new Date(expectedTime);
    expected = Math.floor((expected.getTime() + 3600) / 1000);
    var current = new Date();
    current = Math.floor(current.getTime() / 1000);
    console.log('expt: ' + expected, 'curr: ' + current);
    var arriving = Math.floor((expected - current) / 60);
    console.log('Next bus in ' + arriving + ' minutes.');
    return arriving.toString();
}

getSchedule(options).then(function(val){
    console.log('val: ', val);
})
.catch(function(err){
    console.log('err: ', err);
});
module.exports = {
    getSchedule : getSchedule
}