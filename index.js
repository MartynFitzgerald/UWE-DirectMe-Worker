/*=============================================================================
|      Editors:  Martyn Fitzgerald - 16025948
|
|  Module Code:  UFCFR4-45-3
| Module Title:  Computing Project
|
|   Instructor:  Paul Raynor
|     Due Date:  30/03/2019
|
|    File Name:  scraper_worker/index.js  
|  Description:  This is the worker that will be fetching data from the Google's
|                API and INSERT it into the database.
*===========================================================================*/
var request = require("request");
var mysql = require('mysql');
var moment = require('moment');

function getDatabaseConnection() {
  var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'parking'
  });
  return connection;
}

function getScrapingLocations(callback) {
  var sql = "select * from scraping_location;";

  var connection = getDatabaseConnection();

  connection.query(sql, function(error, result) {
    if (error) {
      return callback(error);
    }

    return callback(null, result);
  });
}
var scrapingLocations = [];
var carParks = [];

function requestDataFromGoogleApi(url, nextPageToken = null, callback) {
  var currentUrl = url;
  console.log("Test 1" , currentUrl);

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

function carparksInsert(lat, lng, radius, scrapingLocationId) {
  // Create The URL to the API 
  var url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?type=parking&radius=${radius}&location=${lat},${lng}&key=AIzaSyBeMKzk8ZpyU2Hk_lrVmlO-Ggq1tQqtYsM`
  
  requestDataFromGoogleApi(url, null, function(error, result) {
    if (error) {
      console.error('Failed to get request data from google api', error);
      process.exit();
    }

    if (result.length > 0) { //If there are results, then...
      for(var i = 0; i < result.length; i++)
      {
        var carpark = result[i];

        var externalId = carpark.id;
        var externalProvider = "Google"
        var name = carpark.name;
        var latitude = carpark.geometry.location.lat;
        var longitude = carpark.geometry.location.lng;
        // Using moment libary to allow be able to add this into MySQL timestamp format 
        var lastUpdatedAt = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');

        //var rating = carpark.rating;
        //var userRatingsTotal = carpark.user_ratings_total;
        //var photos = null;

        var sql = `INSERT IGNORE INTO car_park (scraping_location_id, external_id, external_provider, name, latitude, longitude, last_updated_at) VALUES ('${scrapingLocationId}', '${externalId}','${externalProvider}','${name}','${latitude}', '${longitude}', '${lastUpdatedAt}');`;
       
        var connection = getDatabaseConnection();
        //TODO: before returning to the user, save all new records to the database
        connection.query(sql, function(error, result, fields) {
          if (error) {
            console.error('Failed to get request data from google api', error);
            process.exit();
          }
        });
      }
    }
  });
}

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
