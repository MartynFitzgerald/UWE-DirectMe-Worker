/*=============================================================================
|      Editors:  Martyn Fitzgerald - 16025948
|
|  Module Code:  UFCFR4-45-3
| Module Title:  Computing Project
|
|   Instructor:  Paul Raynor
|     Due Date:  23/04/2020 Extended Till 23/07/2020
|
|    File Name:  index.js  
|  Description:  This is the worker that will be fetching data of car parks
|                from the Google's API and INSERT it into the database.
*===========================================================================*/
var dataHandler = require('./controllers/dataHandler');
var apiMethods = require('./models/apiMethods');
/* 
  The initialize worker.
*/
//exports.handler = async (event) => {
  async function doWork() {
  console.log(`${new Date().toISOString()} - DirectMe - Worker Initializing.`);
  /* 
    Selects all scraping locations stored within the database and returns the result.
  */
  var scrapingLocations = await apiMethods.read(`SCRAPINGLOCATION`);
  //.then(async (scrapingLocations) => {
  console.log(`Scraping Locations: `, scrapingLocations);
  //Loop through scraping locations.
  for (var i = 0; i < scrapingLocations.result.length; i++) {
    //Retreive car park associated with this scrapinglocation.
    await dataHandler.carparksInsert(scrapingLocations.result[i].latitude, scrapingLocations.result[i].longitude, scrapingLocations.result[i].radius, scrapingLocations.result[i].scraping_location_id);
  }
};
doWork();
//console.log(`${new Date().toISOString()} - DirectMe - Worker Exit.`);
//process.exit();