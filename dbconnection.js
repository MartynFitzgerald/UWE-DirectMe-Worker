/*=============================================================================
|      Editors:  Martyn Fitzgerald - 16025948
|
|  Module Code:  UFCFR4-45-3
| Module Title:  Computing Project
|
|   Instructor:  Paul Raynor
|     Due Date:  23/04/2020
|
|    File Name:  dbconnection.js  
|  Description:  This is the logic behind the MySQL database connection which
|                includes the login details for the database
*===========================================================================*/
const mysql = require('mysql');
const con = mysql.createConnection({
  host     : 'aag6xgkxz6hbhx.cmpsexi9hgwn.us-east-1.rds.amazonaws.com',
  user     : 'root',
  password : 'gZLn[7{9f]p+6=B8',
  port     : '3306',
  database : 'DirectMe'
});
  
exports.connection = con;