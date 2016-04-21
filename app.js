require('dotenv').config();
var cta = require('cta-bus-tracker');
var busTracker = cta(process.env.API_KEY);


// busTracker.vehiclesByRoute( ['81'], function ( err, data ) {
//     if ( err ) {
//         console.log('error:',err);
//     }
//     console.log('vehiclesByRoute:',data);
// } );

var options = {
    // a list of up to 10 stop IDs 
    stopIds: [ "15160" ],
    //stopIds: [ "3766" ],
    // topCount is optional 
    topCount: 5
};
 
 //TODO: returns an obj if there's only one bus and an array if there're more than one 
busTracker.predictionsByStop(options, function (err, data) {
    if (err) {
        console.log('err:', err);
    }

    if (data == null) {
        console.log('There are no buses near.');
    } else {
        if (Array.isArray(data)) {
            var howManyBuses = data.length;
            for (var i = 0; i < howManyBuses; i++) {
                _getArrivalTime(data[i].prdtm);
            }
        } else {
            _getArrivalTime(data.prdtm);
        }
    }
});

function _getArrivalTime(expectedTime){
    var expected = new Date(expectedTime);
    expected = expected.getTime() / 1000;
    var current = new Date();
    current = Math.floor(current.getTime() / 1000);
    var arriving = Math.floor((expected - current) / 60);
    console.log('Next bus in ' + arriving + ' minutes.');
}