/*=============================================================================
|      Editors:  Martyn Fitzgerald - 16025948
|
|  Module Code:  UFCFR4-45-3
| Module Title:  Computing Project
|
|   Instructor:  Paul Raynor
|     Due Date:  23/04/2020
|
|    File Name:  index.js  
|  Description:  This is the worker that will be fetching data of car parks
|                from the Google's API and INSERT it into the database.
*===========================================================================*/
var request = require("request");
var moment = require('moment');
var async = require("async");
var dbController = require('./dbconnection');
const { v1: uuidv1 } = require('uuid');
var api = require('./apiFunctionality');

var carParks = [];


/* 
  A function that request data from google's api and loops through the pages. 
*/
async function requestDataFromGoogleApi(url, nextPageToken = null, callback) {
  var currentUrl = url;

  if (nextPageToken) {
    currentUrl += "&pagetoken=" + nextPageToken;
  }

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
    
    if (nextPageToken != null && nextPageToken != "") {
      setTimeout(function() {
        requestDataFromGoogleApi(url, nextPageToken, callback);
      }, 2000);
    } else {
      return callback(null, carParks);
    }
  });
}

/* 
  A function that inserts a car park to the databases. 
*/
async function carparksInsert(lat, lng, radius, scrapingLocationId) {
  // Create The URL to the API 
  var url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?type=parking&radius=${radius}&location=${lat},${lng}&key=AIzaSyBeMKzk8ZpyU2Hk_lrVmlO-Ggq1tQqtYsM`;

  requestDataFromGoogleApi(url, null, function(error, result) {
    if (error) {
      console.error('DirectMe - Failed to get request data from google api', error);
      process.exit();
    }
    
    async.each(result, function (row) {
      //Assigning key values to be inserted into the exernal provider table
      var externalProviderArray = {
        external_provider_id: row.id,
        name: "Google",
        place_id: row.place_id,
        reference: row.reference,
        rating: row.rating ? null : `0`,
        user_rating_total: row.user_ratings_total ? null : `0`,
      };
      //Assigning key values to be inserted into the car park table
      var name = row.name;
      var latitude = (row.geometry.location.lat).toFixed(4);
      var longitude = (row.geometry.location.lng).toFixed(4);
      var address = row.vicinity;
      // Using moment libary to allow be able to add this into MySQL timestamp format 
      var lastUpdatedAt = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');

      //Insert new external provder id
      api.insert(`EXTERNALPROVIDER`, externalProviderArray).catch((error) => {console.log(error)});
      
      dbController.connection.query(`SELECT * FROM car_park WHERE external_provider_id = '${externalProviderArray.external_provider_id}';`, function(error, result, fields) {
        if (error) {
          console.error(`${new Date().toISOString()} - DirectMe - Failed to update - '${externalProviderArray.external_provider_id}'`, error);
          process.exit();
        }

        if (result.length > 0) {
          if ((result[0].name != name) || (result[0].latitude.toFixed(4) != latitude) || (result[0].longitude.toFixed(4) != longitude) || (result[0].address != address)) {
            //Update car park with the new values
            dbController.connection.query(`UPDATE car_park SET name = '${name}', latitude = '${latitude}', longitude = '${longitude}', address = "${address}", last_updated_at = '${lastUpdatedAt}' WHERE external_provider_id = '${externalProviderArray.external_provider_id}';`, function(error, result, fields) {
              if (error) {
              console.error(`${new Date().toISOString()} - DirectMe - Failed to update - '${externalProviderArray.external_provider_id}'`, error);
              process.exit();
              }
              console.log(`${new Date().toISOString()} - DirectMe - Updated CP - '${externalProviderArray.external_provider_id}'`);
            });
           }
        } else {
          //Update car park with the new values
          dbController.connection.query(`INSERT IGNORE INTO car_park (car_park_id, scraping_location_id, external_provider_id, name, address, latitude, longitude, last_updated_at) VALUES ('${uuidv1()}', '${scrapingLocationId}','${externalProviderArray.external_provider_id}','${name}',"${address}",'${latitude}','${longitude}','${lastUpdatedAt}');`, function(error, result, fields) {
            if (error) {
              console.error(`${new Date().toISOString()} - DirectMe - Failed to insert - '${externalProviderArray.external_provider_id}'`, error);
              process.exit();
            }
            if (result.affectedRows > 0) {
              console.log(`${new Date().toISOString()} - DirectMe - Inserted CP - '${externalProviderArray.external_provider_id}'`);
            }
          });
        }
      });
    });
  });
}
/* 
  The initialize worker.
*/
console.log(`${new Date().toISOString()} - DirectMe - Worker Initializing.`);
/* 
  Selects all scraping locations stored within the database and returns the result.
*/
api.read(`SCRAPINGLOCATIONS`)
.then(async (scrapingLocations) => {
  for(var i = 0; i < scrapingLocations.result.length; i++){
    await carparksInsert(scrapingLocations.result[i].latitude, scrapingLocations.result[i].longitude, scrapingLocations.result[i].radius, scrapingLocations.result[i].scraping_location_id);
  }
  //console.log(`${new Date().toISOString()} - DirectMe - Worker Exit.`);
  //process.exit();
});
