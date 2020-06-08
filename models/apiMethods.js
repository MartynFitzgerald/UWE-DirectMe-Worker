/*=============================================================================
|      Editors:  Martyn Fitzgerald - 16025948
|
|  Module Code:  UFCFR4-45-3
| Module Title:  Computing Project
|
|   Instructor:  Paul Raynor
|     Due Date:  23/04/2020 Extended Till 23/07/2020
|
|    File Name:  apiMethods.js  
|  Description:  This is the file that holds all the functionality to the API.
|                
*===========================================================================*/
const fetch = require('node-fetch');
//Creating endpoint API to stop redundancy.
const endpointAWS = `http://directme-api.eu-west-2.elasticbeanstalk.com/`;
/* 
  A function that requests certain types of data from API depending on item string inputted
  declaring what table to gather the data from.
*/
exports.read = async function(item) {
  try {
    const response = await fetch(`${endpointAWS}API/${item}/`);
    const json = await response.json();
    return json;
  } catch (error) {
    console.log(error.response.body);
  }
}
/* 
  A function that insert certain types of data into the API depending on item string inputted
  declaring what table to gather the data from and then using the data array to specify column
  key and value.
*/
exports.insert = async function(item, data) {
  let header = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  };
  try {
    const response = await fetch(`${endpointAWS}API/${item}/`, header);
    const json = await response.json();
    return json;
  } catch (error) {
    console.log(error.response.body);
  }
}
/* 
  A function that updates certain types of data into the API depending on item string inputted
  declaring what table to gather the data from and then using the data array to specify column
  key and value.
*/
exports.update = async function(item, data) {
  let header = {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  };
  try {
    const response = await fetch(`${endpointAWS}API/${item}/`, header);
    const json = await response.json();
    return json;
  } catch (error) {
    console.log(error.response.body);
  }
}