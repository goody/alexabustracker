require('dotenv').config();
var cta = require('cta-bus-tracker');
var busTracker = cta(process.env.API_KEY);


busTracker.vehiclesByRoute( ['81'], function ( err, data ) {
    if ( err ) {
        console.log('error:',err);
    }
    console.log('vehiclesByRoute:',data);
} );

var options = {
    // a list of up to 10 stop IDs 
    stopIds: [ "3766" ],
    // topCount is optional 
    topCount: 5
};
 
 //TODO: returns an obj if there's only one bus and an array if there're more than one 
busTracker.predictionsByStop( options, function ( err, data ) {
    if ( err ) {
        console.log('err:', err);
    }
    console.log('predictionsByStop:', data);
} );