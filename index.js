/*=============================================================================
|      Editors:  Martyn Fitzgerald - 16025948
|
|  Module Code:  UFCFR4-45-3
| Module Title:  Computing Project
|
|   Instructor:  Paul Raynor
|     Due Date:  23/04/2020 Extended Till 06/08/2020
|
|    File Name:  index.js  
|  Description:  This is the worker that will be fetching data of car parks
|                from the Google's API and INSERT it into the database.
*===========================================================================*/
var dataHandler = require('./controllers/dataHandler');
var apiMethods = require('./models/apiMethods');

exports.handler = async (event) => {
  //The initialize the Lambda worker.
  console.log(`${new Date().toISOString()} - DirectMe - Worker Initializing.`);
  //Selects all scraping locations stored within the database and returns the result.
  var scrapingLocations = await apiMethods.read(`SCRAPINGLOCATION`);
  console.log(`Amount of scraping locations: `, scrapingLocations.result.length);
  //Loop through scraping locations.
  for (var i = 0; i < scrapingLocations.result.length; i++) {
    //Retrieve car park associated with this scraping location.
    await dataHandler.insertCarPark(scrapingLocations.result[i].latitude, scrapingLocations.result[i].longitude, scrapingLocations.result[i].radius, scrapingLocations.result[i].scraping_location_id);
  }
  //The terminate the Lambda worker.
  console.log(`${new Date().toISOString()} - DirectMe - Worker Exit.`);
};