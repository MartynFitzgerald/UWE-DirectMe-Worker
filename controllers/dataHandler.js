/*=============================================================================
|      Editors:  Martyn Fitzgerald - 16025948
|
|  Module Code:  UFCFR4-45-3
| Module Title:  Computing Project
|
|   Instructor:  Paul Raynor
|     Due Date:  23/04/2020 Extended Till 23/07/2020
|
|    File Name:  dataHandler.js  
|  Description:  These functions are the ones that interact with the API
|                component which then inputs the data into the choosen storage.
*===========================================================================*/
var request = require("request");
var moment = require('moment');
var async = require("async");
var uuid = require('uuid');
var apiMethods = require('../models/apiMethods');
//Defining car
var carParks = [];
/* 
  A function that request data from google's api and loops through the pages. 
*/
async function requestGoogleApi(url, nextPageToken = null, callback) {
  //Copying the url to add tockens if needed 
  var currentUrl = url;
  //If token has been inputted to the function then add it onto the url.
  if (nextPageToken) {
    currentUrl += "&pagetoken=" + nextPageToken;
  }
  //Request the external API for car parks.
  request({url: currentUrl}, function(error, response, body) {
    if (error) {
      console.error('Failed to request', error);
      process.exit();
    }

    var data = JSON.parse(body);

    for(var i = 0; i < data.results.length; i++){
      carParks.push(data.results[i]);
    }

    var nextPageToken = data.next_page_token;
    //Cckes
    if (nextPageToken != null && nextPageToken != "") {
      setTimeout(function() {
        requestGoogleApi(url, nextPageToken, callback);
      }, 2000);
    } else {
      return callback(null, carParks);
    }
  });
}
  
/* 
    This function calls the fetch google information and then inserts car parks into the databases through the API. 
*/
exports.carparksInsert = async function(lat, lng, radius, scrapingLocationId) {
    //Construct the URL to sent to the API.
    var url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?type=parking&radius=${radius}&location=${lat},${lng}&key=AIzaSyBeMKzk8ZpyU2Hk_lrVmlO-Ggq1tQqtYsM`;
    requestGoogleApi(url, null, function(error, result) {
        if (error) {
            console.error('DirectMe - Failed to get request data from google api', error);
            process.exit();
        }
        //Cycle through each row of the result returned by the external API.
        async.each(result, function (row) {
            //Assigning keys, and values to an array which will be inserted into the exernal provider data stored within a database.
            var externalProviderArray = {
                external_provider_id: row.id,
                name: "Google",
                place_id: row.place_id,
                reference: row.reference,
                rating: row.rating ? null : `0`,
                user_ratings_total: row.user_ratings_total ? null : `0`,
            };
            //Assigning keys, and values to an array which will be inserted into the car park data stored within a database.
            var carparkArray = {
                car_park_id: uuid.v1(),
                scraping_location_id: scrapingLocationId,
                external_provider_id: externalProviderArray.external_provider_id,
                name: row.name,
                latitude: (row.geometry.location.lat).toFixed(4),
                longitude:(row.geometry.location.lng).toFixed(4),
                address: row.vicinity,
                last_updated_at: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'),// Using moment libary to allow be able to add this into MySQL timestamp format 
            };
            //Insert ignore the external provder id.
            apiMethods.insert(`EXTERNALPROVIDER`, externalProviderArray).catch((error) => {console.log(error)});
            //Search for the car park with the linked external provered ID.
            apiMethods.read(`CARPARK/EPID/${externalProviderArray.external_provider_id}`)
            .then(async (carpark) => {
                if (carpark.result.length > 0) {
                    if ((carpark.result[0].name != carparkArray.name) || (carpark.result[0].latitude.toFixed(4) != carparkArray.latitude) || (carpark.result[0].longitude.toFixed(4) != carparkArray.longitude) || (carpark.result[0].address != carparkArray.address)) {
                        //Update car park with the new values.
                        console.log(carpark.result[0].name,  carparkArray.name , carpark.result[0].latitude.toFixed(4), carparkArray.latitude, carpark.result[0].longitude.toFixed(4), carpark.result[0].address, carparkArray.address);
                    }
                } else {
                //insert car park 
                apiMethods.insert(`CARPARK`, carparkArray).catch((error) => {console.log(error)});
                }
            });
        });
    });
}