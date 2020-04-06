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

var carParks = [];

/* 
  A function that selects all scraping locations stored within the database and returns the result.
*/
function getScrapingLocations(callback) {
  var sql = "SELECT * FROM scraping_location;";

  dbController.connection.query(sql, function(error, result) {
    if (error) {
      return callback(error);
    }

    return callback(null, result);
  });
}

/* 
  A function that request data from google's api and loops through the pages. 
*/
function requestDataFromGoogleApi(url, nextPageToken = null, callback) {
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
function carparksInsert(lat, lng, radius, scrapingLocationId) {
  // Create The URL to the API 
  var url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?type=parking&radius=${radius}&location=${lat},${lng}&key=AIzaSyBeMKzk8ZpyU2Hk_lrVmlO-Ggq1tQqtYsM`;

  requestDataFromGoogleApi(url, null, function(error, result) {
    if (error) {
      console.error('DirectMe - Failed to get request data from google api', error);
      process.exit();
    }
    
    async.each(result, function (row, callback) {
      //Assigning key values to be inserted into the exernal provider table
      var externalId = row.id;
      var externalProvider = "Google";
      var placeId = row.place_id;
      var reference = row.reference;
      var rating = row.rating;
      var amountUserRatings = row.user_ratings_total;
      //Assigning key values to be inserted into the car park table
      var name = row.name;
      var latitude = row.geometry.location.lat;
      var longitude = row.geometry.location.lng;
      var address = row.vicinity;
      // Using moment libary to allow be able to add this into MySQL timestamp format 
      var lastUpdatedAt = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');

      //Insert new external provder id
      dbController.connection.query(`INSERT IGNORE INTO external_provider (external_provider_id, name, place_id, reference, rating, user_ratings_total) VALUES ('${externalId}', '${externalProvider}', '${placeId}', '${reference}', '${rating}', '${amountUserRatings}');`, function(error, result, fields) {
        if (error) {
          console.error(`DirectMe - Failed to Insert - '${externalId}'`, error);
          process.exit();
        }
        
        console.log(`DirectMe - Inserted ID - '${externalId}'`);
      });
      
      dbController.connection.query(`SELECT * FROM car_park WHERE external_provider_id = '${externalId}';`, function(error, result, fields) {
        if (error) {
          console.error(`DirectMe - Failed to update - '${externalId}'`, error);
          process.exit();
        }

        if (result.length > 0) {
          if ((result[0].name != name) || (result[0].latitude != latitude) || (result[0].longitude != longitude) || (result[0].address != address)) {
            //Update car park with the new values
            dbController.connection.query(`UPDATE car_park SET name = '${name}', latitude = '${latitude}', longitude = '${longitude}', address = "${address}", last_updated_at = '${lastUpdatedAt}' WHERE external_provider_id = '${externalId}';`, function(error, result, fields) {
              if (error) {
              console.error(`DirectMe - Failed to update - '${externalId}'`, error);
              process.exit();
              }
              console.log(`DirectMe - Updated CP - '${externalId}'`);
            });
           }
        } else {
          //Update car park with the new values
          dbController.connection.query(`INSERT IGNORE INTO car_park (scraping_location_id, external_provider_id, name, address, latitude, longitude, last_updated_at) VALUES ('${scrapingLocationId}','${externalId}','${name}',"${address}",'${latitude}','${longitude}','${lastUpdatedAt}');`, function(error, result, fields) {
            if (error) {
            console.error(`DirectMe - Failed to insert - '${externalId}'`, error);
            process.exit();
            }
            console.log(`DirectMe - Inserted CP - '${externalId}'`);
          });
        }
      });
    });
  });
}

//Log the Initialization of the worker.
console.log(`DirectMe - Worker Initializing.`);

/* 
  The initializer of getting scraping locations.
*/
getScrapingLocations(function(error, result) {
  if (error) {
    console.error('DirectMe - Failed to get scraping locations', error);
    process.exit();
  }

  async.each(result, function (row, callback) {
    carparksInsert(row.latitude, row.longitude, row.radius, row.scraping_location_id);
  });
});