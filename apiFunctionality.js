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
const fetch = require('node-fetch');

/* 
  A function that selects all scraping locations stored within the database and returns the result.
*/
exports.read = async function(item) {
  try {
    return fetch(`http://parkingapplicationapi-env.fwmaq3pfqz.us-east-1.elasticbeanstalk.com/API/GET/${item}/`)
      .then((response) => response.json())
      .then((result) => {
        return result;
      });
  } catch(error) {
    console.error(error);
  }
}
/* 
  A function that selects all scraping locations stored within the database and returns the result.
*/
exports.insert = async function(item, data) {
  try {
    let header = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }
    return fetch(`http://parkingapplicationapi-env.fwmaq3pfqz.us-east-1.elasticbeanstalk.com/API/INSERT/${item}/`, header)
      .then((response) => response.json())
      .then((result) => {
        return result;
      });
  }
  catch (error) {
    return console.error(error);
  }
}
