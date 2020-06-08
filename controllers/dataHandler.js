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
|                component which then inputs the data into the chosen storage.
*===========================================================================*/
const fetch = require('node-fetch');
var moment = require('moment');
var uuid = require('uuid');
var apiMethods = require('../models/apiMethods');
//Defining car parks array to store when functions are recursive.
var carParks = [];

/* 
  A function that 
*/
function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
/* 
  A function that request data from google's api and loops through the pages. 
*/
async function requestGoogleApi(url, nextPageToken = null) {
  var data;
  //Copying the url to add tokens if needed 
  var currentUrl = url;
  //If token has been inputted to the function then add it onto the url.
  if (nextPageToken) {
    currentUrl += `&pagetoken=${nextPageToken}`;
  }
  //Request the external API for car parks.
  try {
    console.log(`Requested URL: `, currentUrl);
    const response = await fetch(currentUrl);
    data = await response.json();
  } catch (error) {
    console.log(error.response.body);
    process.exit();
  }
  //Loop through results and add them into the carParks array.
  for (var i = 0; i < data.results.length; i++) {
    carParks.push(data.results[i]);
  }
  var nextPageToken = data.next_page_token;
  //Check if there is a token inputted into this function.
  if (nextPageToken != null && nextPageToken != "") {
    await timeout(2000);
    return await requestGoogleApi(url, nextPageToken);
  } else {
    return carParks;
  }
}
/* 
    This function calls the fetch google information and then inserts car parks into the databases through the API. 
*/
exports.insertCarPark = async function(lat, lng, radius, scrapingLocationId) {
  //Construct the URL to sent to the API.
  var url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?type=parking&radius=${radius}&location=${lat},${lng}&key=AIzaSyBeMKzk8ZpyU2Hk_lrVmlO-Ggq1tQqtYsM`;
  var result;
  carParks = [];
  try {
    result = await requestGoogleApi(url, null);
  } catch (error) {
    console.log(error.response.body);
    process.exit();
  }
  //Cycle through each row of the result returned by the external API.
  for (var i = 0; i < result.length; i++) {
    var row = result[i];
    //Assigning keys, and values to an array which will be inserted into the external provider data stored within a database.
    var externalProviderArray = {
      external_provider_id: row.id,
      name: "Google",
      place_id: row.place_id,
      reference: row.reference,
      rating: (row.rating <= 0 || row.rating == undefined) ? `0` : `${row.rating}`,
      user_ratings_total: (row.user_ratings_total <= 0 || row.user_ratings_total == undefined) ? `0` : `${row.user_ratings_total}`,
    };
    //Assigning keys, and values to an array which will be inserted into the car park data stored within a database.
    var carparkArray = {
      car_park_id: uuid.v1(),
      scraping_location_id: scrapingLocationId,
      external_provider_id: externalProviderArray.external_provider_id,
      name: row.name,
      latitude: (row.geometry.location.lat).toFixed(4),
      longitude: (row.geometry.location.lng).toFixed(4),
      address: row.vicinity,
      last_updated_at: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'), // Using moment libary to allow be able to add this into MySQL timestamp format 
    };
    //Insert ignore the external provider's id.
    await apiMethods.insert(`EXTERNALPROVIDER`, externalProviderArray);
    //Search for the car park with the linked external provider's ID.
    var carpark = await apiMethods.read(`CARPARK/EPID/${externalProviderArray.external_provider_id}`);
    if (carpark.result.length > 0) {
      if ((carpark.result[0].name != carparkArray.name) || (carpark.result[0].latitude.toFixed(4) != carparkArray.latitude) || (carpark.result[0].longitude.toFixed(4) != carparkArray.longitude) || (carpark.result[0].address != carparkArray.address)) {
        //Update car park with the new values.
        console.log(carpark.result[0].name, carparkArray.name, carpark.result[0].latitude.toFixed(4), carparkArray.latitude, carpark.result[0].longitude.toFixed(4), carpark.result[0].address, carparkArray.address);
      }
    } else {
      //insert car park 
      await apiMethods.insert(`CARPARK`, carparkArray);
    }
  };
}