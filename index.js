/*=============================================================================
|      Editors:  Martyn Fitzgerald - 16025948
|
|  Module Code:  UFCFR4-45-3
| Module Title:  Computing Project
|
|   Instructor:  Paul Raynor
|     Due Date:  30/03/2019
|
|    File Name:  index.js  
|  Description:  This is the worker that will be fetching data of car parks
|                from the Google's API and INSERT it into the database.
*===========================================================================*/
var request = require("request");
var moment = require('moment');
var dbController = require('./dbconnection');

var scrapingLocations = [];
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
  var url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?type=parking&radius=${radius}&location=${lat},${lng}&key=AIzaSyBeMKzk8ZpyU2Hk_lrVmlO-Ggq1tQqtYsM`
  
  requestDataFromGoogleApi(url, null, function(error, result) {
    if (error) {
      console.error('Failed to get request data from google api', error);
      process.exit();
    }

    if (result.length > 0) {
      for(var i = 0; i < result.length; i++)
      {
        //Assigning key values to be inputted into the sql statement
        var externalId = result[i].id;
        var externalProvider = "Google"
        var name = result[i].name;
        var latitude = result[i].geometry.location.lat;
        var longitude = result[i].geometry.location.lng;
        // Using moment libary to allow be able to add this into MySQL timestamp format 
        var lastUpdatedAt = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');



        var sql = `SELECT * FROM external_provider WHERE external_provider_id = '${externalId}';`;

        dbController.connection.query(sql, function(error, result, fields) {
          if (error) {
            return callback(error);
          }

          if (result.length <= 0) {
            {
             //Insert new external provder id
             var sql = `INSERT IGNORE INTO external_provider (external_provider, name) VALUES ('${externalId}','${externalProvider}');`;
          
              dbController.connection.query(sql, function(error, result, fields) {
                if (error) {
                  console.error(`Failed to update - '${externalId}'`, error);
                  process.exit();
                }
              });
            }
        }
        
        var sql = `SELECT * FROM car_park WHERE external_provider_id = '${externalId}';`;

        dbController.connection.query(sql, function(error, result, fields) {
          if (error) {
            return callback(error);
          }

          if (result.length > 0) {
            if ((result[0].name =! name) || (result[0].latitude =! latitude) || (result[0].longitude =! longitude))
            {
              //Update car park with the new values
              var sql = `UPDATE car_park SET name = '${name}', latitude = '${latitude}', longitude = '${longitude}', last_updated_at = '${externalId}' WHERE external_id = '${externalId}';`

              dbController.connection.query(sql, function(error, result, fields) {
                if (error) {
                  console.error(`Failed to update - '${externalId}'`, error);
                  process.exit();
                }
              });
            }
          }
          else
          {
            //Insert new car park
            var sql = `INSERT IGNORE INTO car_park (scraping_location_id, external_provider_id, name, latitude, longitude, last_updated_at) VALUES ('${scrapingLocationId}', '${externalId}','${name}','${latitude}', '${longitude}', '${lastUpdatedAt}');`;
          
            dbController.connection.query(sql, function(error, result, fields) {
              if (error) {
                console.error(`Failed to insert - '${externalId}'`, error);
                process.exit();
              }
            });
          }
        });

        
      }
    }
  });
}

exports.handler = async (event) => {
  /* 
    The initializer of getting scraping locations.
  */
  getScrapingLocations(function(error, result) {
    if (error) {
      console.error('Failed to get scraping locations', error);
      process.exit();
    }

    for (var i = 0; i < result.length; i++)
    {
      scrapingLocations.push(result[i]);
    }
    
    for (var i = 0; i < scrapingLocations.length; i++)
    {
      carparksInsert(scrapingLocations[i].latitude, scrapingLocations[i].longitude, scrapingLocations[i].radius, scrapingLocations[i].id);
    }
  });
};