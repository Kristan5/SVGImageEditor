'use strict'

// C library API
const ffi = require('ffi-napi');

// Express App (Routes)
const express = require("express");
const app     = express();
const path    = require("path");
const fileUpload = require('express-fileupload');

app.use(fileUpload());
app.use(express.static(path.join(__dirname+'/uploads')));

// Minimization
const fs = require('fs');
const JavaScriptObfuscator = require('javascript-obfuscator');

// Important, pass in port as in `npm run dev 1234`, do not change
const portNum = process.argv[2];

// Send HTML at root, do not change
app.get('/',function(req,res){
  res.sendFile(path.join(__dirname+'/public/index.html'));
});

// Send Style, do not change
app.get('/style.css',function(req,res){
  //Feel free to change the contents of style.css to prettify your Web app
  res.sendFile(path.join(__dirname+'/public/style.css'));
});

// Send obfuscated JS, do not change
app.get('/index.js',function(req,res){
  fs.readFile(path.join(__dirname+'/public/index.js'), 'utf8', function(err, contents) {
    const minimizedContents = JavaScriptObfuscator.obfuscate(contents, {compact: true, controlFlowFlattening: true});
    res.contentType('application/javascript');
    res.send(minimizedContents._obfuscatedCode);
  });
});

//Respond to POST requests that upload files to uploads/ directory
// PUTS A FILE INTO THE UPLOAD DIRECTORY
app.post('/upload', function(req, res) {
  if(!req.files) {
    // res.send({
      // alert: "No files were uploaded",
    // });
    return res.status(400).send('No files were uploaded.');
  }

  let uploadFile = req.files.uploadFileInput;

  let files = fs.readdirSync('uploads/');
  if (uploadFile != undefined && files.includes(uploadFile.name)){
    console.log("This file already exists on the server, will not be uploaded again");
    res.send({
      alert: "File is already on the server",
    });
  }
  else if (uploadFile != undefined){
    // Use the mv() method to place the file somewhere on your server
    uploadFile.mv('uploads/' + uploadFile.name, function(err) {
      if(err) {
        return res.status(500).send(err);
      }
      res.redirect('/');
    });
    console.log("File Successfully Uploaded");
  }
});

//Respond to GET requests for files in the uploads/ directory
// GETS A FILE FROM THE UPLOAD DIRECTORY
app.get('/uploads/:name', function(req , res){
  fs.stat('uploads/' + req.params.name, function(err, stat) {
    if(err == null) {
      res.sendFile(path.join(__dirname+'/uploads/' + req.params.name));
    } else {
      console.log('Error in file downloading route: '+err);
      res.send('');
    }
  });
});

//******************** Your code goes here ******************** 

/**** Set up functions from our shared library ****
We create a new object called sharedLib and the C functions become its methods
*/
let sharedLib = ffi.Library('./libsvgparse', {
  'SVGFileToJson' : [ 'string' , ['string', 'string']],

  'getSVGFileTitle' : [ 'string' , ['string', 'string']],
  'getSVGFileDescription' : [ 'string' , ['string', 'string']],

  'getSVGFileRectList' : [ 'string' , ['string', 'string']],
  'getSVGFilePathList' : [ 'string' , ['string', 'string']],
  'getSVGFileCircleList' : [ 'string' , ['string', 'string']],
  'getSVGFileGroupList' : [ 'string' , ['string', 'string']],

  'getAttrList' : [ 'string' , ['string', 'string', 'string', 'string']],
  'updateAttribute' : [ 'string' , ['string', 'string', 'string', 'string', 'string', 'string']],
  
  'setTitle' : [ 'string' , ['string', 'string', 'string']],
  'setDescription' : [ 'string' , ['string', 'string', 'string']],
  
  'createNewSVGFile' : [ 'string' , ['string', 'string', 'string']],

  'createCircle' : [ 'string' , ['string', 'string', 'string', 'string', 'string', 'string','string']],
  'createRectangle' : [ 'string' , ['string', 'string', 'string', 'string', 'string','string', 'string', 'string']],

  'scaleCircles' : [ 'string' , ['string', 'string', 'string']],
  'scaleRectangles' : [ 'string' , ['string', 'string', 'string']],

});

let schemaFile = "parser/bin/svg.xsd";

function getFilesArray(){
  let files = fs.readdirSync('uploads/');

  let SVGJSONArray = new Array();
  let count = 0;
  let columns = 9;
  let JSONStr = 0;
  let parsedJSON = 0;

  let fileTitle = 0;
  let fileDescription = 0;

  SVGJSONArray[count] = new Array();
  SVGJSONArray[0][0] = "Image\n(Click to Download)";
  SVGJSONArray[0][1] = "File Name\n(Click to Download)";
  SVGJSONArray[0][2] = "File Size";
  SVGJSONArray[0][3] = "Number of Rectangles";
  SVGJSONArray[0][4] = "Number of Circles";
  SVGJSONArray[0][5] = "Number of Paths";
  SVGJSONArray[0][6] = "Number of Groups";
  count ++;

  files.forEach(element => {
    // SVGJSONArray[count] = sharedLib.SVGFileToJson("uploads/" + element);
    JSONStr = sharedLib.SVGFileToJson("uploads/" + element, schemaFile);
    fileTitle = sharedLib.getSVGFileTitle("uploads/" + element, schemaFile);
    fileDescription = sharedLib.getSVGFileDescription("uploads/" + element, schemaFile);
    if (fileTitle == ""){
      fileTitle = "null";
    }
    if (fileDescription == ""){
      fileDescription = "null";
    }
    if (JSONStr != "invalid"){
      parsedJSON = JSON.parse(JSONStr);

      SVGJSONArray[count] = new Array();

      for (let i = 0; i<columns && count != 0; i++){
        if (i == 0){
          // image (click to download)
          SVGJSONArray[count][i] = element;
        }
        else if (i == 1){
          // filename (click to download)
          SVGJSONArray[count][i] = element;
        }
        else if (i == 2){
          // file size
          let fileSize = getFileSize(element);
          SVGJSONArray[count][i] =  fileSize + "KB";
        }
        else if (i == 3){
          //num rectanlges
          SVGJSONArray[count][i] = parsedJSON.numRect;
        }
        else if (i == 4){
          // num circles
          SVGJSONArray[count][i] = parsedJSON.numCirc;
        }
        else if (i == 5){
          // num paths
          SVGJSONArray[count][i] = parsedJSON.numPaths;
        }
        else if (i == 6){
          // num groups
          SVGJSONArray[count][i] = parsedJSON.numGroups;
        }
        else if (i == 7){
          // Title
          SVGJSONArray[count][i] = fileTitle;
        }
        else if (i == 8){
          // Description
          SVGJSONArray[count][i] = fileDescription;
        }
      }
      count++;
    }
    else {
      console.log(element + " is invalid svg");
    }
  });

  return SVGJSONArray;
}

function getFileSize(filename){
  return Math.ceil((fs.statSync("uploads/" + filename).size) / 1000)
}

let connectedStatus;
const mysql = require('mysql2/promise');
let connection;
app.get('/logout', async function(req, res, next){
  console.log("Logging Out ");
  try {
    connection.end();
    connectedStatus = false;
  } catch(e) {
    console.log("Log out query error: " + e);
  }
  res.send({
    logOutStatus: connectedStatus
  });
});
app.get('/loggedIn', function(req, res){
  res.send({
    result:connectedStatus
  });
});
app.get('/connectToDB', async function(req, res, next){
  console.log("Reached 'Connect to DB' endpoint");
  let dbConf = {
    host      : req.query.host,
    user      : req.query.username,
    password  : req.query.password,
    database  : req.query.username
  };

  // Returns empty set if the table does not exist 
  let existFILE = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'FILE';";
  let existIMG_CHANGE = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'IMG_CHANGE';";
  let existDOWNLOAD = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'DOWNLOAD';";

  // Creation of Table strings with constraints
  let createFILETable = "CREATE TABLE FILE (svg_id INT AUTO_INCREMENT,file_name VARCHAR(60) NOT NULL,file_title VARCHAR(256),file_description VARCHAR(256), n_rect INT NOT NULL,n_circ INT NOT NULL,n_path INT NOT NULL,n_group INT NOT NULL,creation_time DATETIME NOT NULL, file_size INT NOT NULL,  PRIMARY KEY(svg_id));";
  let createIMG_CHANGETable = "CREATE TABLE IMG_CHANGE (change_id INT AUTO_INCREMENT,change_type VARCHAR(256) NOT NULL,change_summary VARCHAR(256) NOT NULL, change_time DATETIME NOT NULL, svg_id INT NOT NULL, PRIMARY KEY(change_id),FOREIGN KEY(svg_id) REFERENCES FILE(svg_id) ON DELETE CASCADE);";
  let createDOWNLOADTable = "CREATE TABLE DOWNLOAD (download_id INT AUTO_INCREMENT,d_descr VARCHAR(256),svg_id INT NOT NULL,PRIMARY KEY(download_id),FOREIGN KEY(svg_id) REFERENCES FILE(svg_id) ON DELETE CASCADE);";

  connectedStatus = false;

  try{
    connection = await mysql.createConnection(dbConf);

    const [rowsFILEExist, fieldsFILEExist] = await connection.execute(existFILE);
    const [rowsIMG_CHANGEExist, fieldsIMG_CHANGEExist] = await connection.execute(existIMG_CHANGE);
    const [rowsDOWNLOADExist, fieldsDOWNLOADExist] = await connection.execute(existDOWNLOAD);

    // If the FILE, IMG_CHANGE, OR DOWNLOAD table does not exist then create it 
    if (rowsFILEExist.length == 0) await connection.execute(createFILETable);
    if (rowsIMG_CHANGEExist.length == 0) await connection.execute(createIMG_CHANGETable);
    if (rowsDOWNLOADExist.length == 0) await connection.execute(createDOWNLOADTable);
    
    connectedStatus = true;
    console.log("Connection to Host Successful");
  } catch(e) {
    console.log("Query error: "+e);
  }
  res.send({
    result: connectedStatus
  });
});


/***Database queries****/
app.get('/allFilesQuery', async function(req , res, next){
  // let sort = req.query.sort;
  console.log("All Files Query Connected");
  let sort = req.query.sort;
  console.log("Selected Sort: "+sort);
  let beginDate = req.query.beginDate;
  let endDate = req.query.endDate;

  let allFiles = new Array();
  let fileCount = 1;
  let queryString = 'SELECT * FROM FILE';
  try{
    if (endDate != undefined && beginDate != undefined) {
      console.log("Time Range: " + beginDate + " to " + endDate);
      queryString += " WHERE (creation_time BETWEEN \"" + beginDate + " 00:00:00\" AND \"" + endDate + " 23:59:59\") ";
    }
    if (sort == "File Size"){
      queryString += ' ORDER BY file_size;'; 
    }
    else if (sort == "File Name"){
      queryString += ' ORDER BY file_name;';
    }
    else if (sort == "Creation Date"){
      queryString += ' ORDER BY creation_time;';
    }
    else {
      queryString += ";";
    }
    console.log(queryString + "\n");
    const [rows1, fields1] = await connection.execute(queryString);

    allFiles[0] = new Array();
    allFiles[0][0] = "File Name";
    allFiles[0][1] = "File Title";
    allFiles[0][2] = "File Description";
    allFiles[0][3] = "# Rectangles";
    allFiles[0][4] = "# Circles";
    allFiles[0][5] = "# Paths";
    allFiles[0][6] = "# Groups";
    allFiles[0][7] = "Creation Time";
    allFiles[0][8] = "File Size";

    let time;
    for (let row of rows1){
      time = row.creation_time + "";
      allFiles[fileCount] = new Array();
      allFiles[fileCount][0] = row.file_name;
      allFiles[fileCount][1] = row.file_title;
      allFiles[fileCount][2] = row.file_description;
      allFiles[fileCount][3] = row.n_rect;
      allFiles[fileCount][4] = row.n_circ;
      allFiles[fileCount][5] = row.n_path;
      allFiles[fileCount][6] = row.n_group;
      // allFiles[fileCount][7] = row.creation_time;
      allFiles[fileCount][7] = time.substr(0,10) + " " + time.substr(11,13);
      allFiles[fileCount][8] = row.file_size;

      fileCount ++;
    }
  } catch(e) {
    console.log("Query error: "+e);
  }  

  res.send({
    array: allFiles
  });
});
app.get('/specificShapeQuery', async function(req, res, next){
  console.log("Specific Shape Query Connected");
  let sort = req.query.sort;
  console.log("Selected Sort: "+sort);

  let shapeRange1 = req.query.shapeRange1;
  let shapeRange2 = req.query.shapeRange2;
  let shape = req.query.shape;
  let shapeName = "failed";
  if (shape == "Rectangle"){
    shapeName = "n_rect";
  } else if (shape == "Circle") {
    shapeName = "n_circ";
  } else if (shape == "Path") {
    shapeName = "n_path";
  } else if (shape == "Group") {
    shapeName = "n_group";
  }
  let allFiles = new Array();
  let fileCount = 1;
  let queryString = 'SELECT * FROM FILE';
  try{
    if (shapeRange1 != undefined && shapeRange2 != undefined && shape != undefined && shapeName != "failed") {
      queryString += " WHERE ("+shapeName+" BETWEEN "+shapeRange1+" AND "+shapeRange2+") ";
    }
    if (sort == "File Size"){
      queryString += ' ORDER BY file_size;'; 
    }
    else if (sort == "File Name"){
      queryString += ' ORDER BY file_name;';
    }
    else if (sort == "Shape Count"){
      queryString += ' ORDER BY '+shapeName+';';
    }
    else {
      queryString += ";";
    }
    console.log(queryString + "\n");
    const [rows1, fields1] = await connection.execute(queryString);

    allFiles[0] = new Array();
    allFiles[0][0] = "File Name";
    allFiles[0][1] = shape + " Count";


    for (let row of rows1){
      allFiles[fileCount] = new Array();
      allFiles[fileCount][0] = row.file_name;
      allFiles[fileCount][1] = eval("row." + shapeName);
      fileCount ++;
    }
  } catch(e) {
    console.log("Query error: "+e);
  }  

  res.send({
    array: allFiles
  });
});
app.get('/mostDownloadedQuery', async function(req, res, next){
  console.log("Most Downloaded Query Connected");
  let sort = req.query.sort;
  console.log("Selected Sort: "+sort);
  let n = req.query.n;

  let allFiles = new Array();
  let fileCount = 1;
  let queryString = "select file_name, count(*) as count, d_descr from DOWNLOAD, FILE where (FILE.svg_id = DOWNLOAD.svg_id) group by DOWNLOAD.svg_id ";
  // Ordered by filename
  // select file_name as 'File Name', count(*) as 'Times Downloaded', d_descr as 'Summary' from DOWNLOAD, FILE where (FILE.svg_id = DOWNLOAD.svg_id) group by DOWNLOAD.svg_id order by file_name limit 3;
  // Ordered by times downloaded
  // select file_name as 'File Name', count(*) as 'Times Downloaded', d_descr as 'Summary' from DOWNLOAD, FILE where (FILE.svg_id = DOWNLOAD.svg_id) group by DOWNLOAD.svg_id order by count(*) DESC limit 3;
  try{
    if (sort == "Download Count"){
      queryString += ' order by count(*) desc '; 
    }
    else if (sort == "File Name"){
      queryString += ' order by file_name ';
    }
    else {
      queryString += ' order by count(*) desc';
    }
    if (n != undefined) {
      queryString += " limit " + n + ";";
    }
    else {
      queryString += ";";
    }
    console.log(queryString + "\n");
    const [rows1, fields1] = await connection.execute(queryString);

    allFiles[0] = new Array();
    allFiles[0][0] = "File Name";
    allFiles[0][1] = "Times Downloaded";
    allFiles[0][2] = "Summary";


    for (let row of rows1){
      allFiles[fileCount] = new Array();
      allFiles[fileCount][0] = row.file_name;
      allFiles[fileCount][1] = row.count;
      allFiles[fileCount][2] = row.d_descr;
      fileCount ++;
    }
  } catch(e) {
    console.log("Query error: "+e);
  }  

  res.send({
    array: allFiles
  });
});
app.get('/modifiedFilesQuery', async function(req , res, next){
  // let sort = req.query.sort;
  console.log("Modified Files Query Connected");
  let sort = req.query.sort;
  console.log("Selected Sort: "+sort);
  let beginDate = req.query.beginDate;
  let endDate = req.query.endDate;

  let allFiles = new Array();
  let fileCount = 1;
  let queryString = 'select file_name, file_size, IMG_CHANGE.svg_id, count(*) as count, max(change_time) as maxTime from IMG_CHANGE, FILE where (FILE.svg_id = IMG_CHANGE.svg_id)';
  // select file_name, file_size, IMG_CHANGE.svg_id, count(*), max(change_time) from IMG_CHANGE, FILE where (FILE.svg_id = IMG_CHANGE.svg_id) and (change_time between '2000-04-12 00:00:00' and '2029-04-12 20:48:40') group by svg_id order by max(change_time);
  try{
    if (endDate != undefined && beginDate != undefined) {
      console.log("Time Range: " + beginDate + " to " + endDate);
      queryString += " and (change_time between '" + beginDate + " 00:00:00' AND '" + endDate + " 23:59:59') ";
    }
    if (sort == "File Size"){
      queryString += ' group by svg_id order by file_size;'; 
    }
    else if (sort == "File Name"){
      queryString += ' group by svg_id order by file_name;';
    }
    else if (sort == "Most Recently Modified"){
      queryString += ' group by svg_id order by max(change_time);';
    }
    else {
      queryString += " group by svg_id;";
    }
    console.log(queryString + "\n");
    const [rows1, fields1] = await connection.execute(queryString);

    allFiles[0] = new Array();
    allFiles[0][0] = "File Name";
    allFiles[0][1] = "Number of Changes made to File";
    allFiles[0][2] = "Most Recent Modification Date";
    allFiles[0][3] = "File Size";
    
    let time;
    for (let row of rows1){
      time = row.maxTime + "";
      allFiles[fileCount] = new Array();
      allFiles[fileCount][0] = row.file_name;
      allFiles[fileCount][1] = row.count;
      allFiles[fileCount][2] = time.substr(0,10) + " " + time.substr(11,13);
      allFiles[fileCount][3] = row.file_size;

      fileCount ++;
    }
  } catch(e) {
    console.log("Query error: "+e);
  }  

  res.send({
    array: allFiles
  });
});
app.get('/specificChangeQuery', async function(req , res, next){
  // let sort = req.query.sort;
  console.log("Modified Files Query Connected");
  let sort = req.query.sort;
  console.log("Selected Sort: "+sort);
  let beginDate = req.query.beginDate;
  let endDate = req.query.endDate;

  let allFiles = new Array();
  let fileCount = 1;
  let queryString = 'select file_name, change_type, change_summary, change_time, IMG_CHANGE.svg_id from IMG_CHANGE, FILE where (FILE.svg_id = IMG_CHANGE.svg_id) ';
  try{
    if (endDate != undefined && beginDate != undefined) {
      console.log("Time Range: " + beginDate + " to " + endDate);
      queryString += " and (change_time between '" + beginDate + " 00:00:00' AND '" + endDate + " 23:59:59') ";
    }
    if (sort == "Change Type"){
      queryString += ' order by change_type;'; 
    }
    else if (sort == "Recent Change First"){
      queryString += ' order by change_time DESC;';
    }
    else if (sort == "Recent Change Last"){
      queryString += ' order by change_time;';
    }
    else {
      queryString += ";";
    }
    console.log(queryString + "\n");
    const [rows1, fields1] = await connection.execute(queryString);

    allFiles[0] = new Array();
    allFiles[0][0] = "File Name";
    allFiles[0][1] = "Change Type";
    allFiles[0][2] = "Change Summary";
    allFiles[0][3] = "Change Time";
    
    let time;
    for (let row of rows1){
      let time = row.change_time + "";
      allFiles[fileCount] = new Array();
      allFiles[fileCount][0] = row.file_name;
      allFiles[fileCount][1] = row.change_type;
      allFiles[fileCount][2] = row.change_summary;
      // allFiles[fileCount][3] = row.change_time;
      allFiles[fileCount][3] = time.substr(0,10) + " " + time.substr(11,13);

      fileCount ++;
    }
  } catch(e) {
    console.log("Query error: "+e);
  }  

  res.send({
    array: allFiles
  });
});


// Stores all files in file View panel to database 
app.post('/storeDBFiles', async function(req, res, next){ 
  storeAllDBFiles();
});

//Sample endpoint
app.get('/connectedStatus', function(req , res){
  console.log("Connected checking connected status");
  console.log("STATUS: " + connectedStatus);
  res.send({
    status: connectedStatus
  });
});

// Used for alert with database status
app.get('/getDBStatus', async function(req , res, next){
  let theStatus = "Failed";
  let fileCount, changeCount, downloadCount;
  try{

    const [numFILES, field1] = await connection.execute("SELECT COUNT(*) AS count FROM FILE;");
    const [numIMG_CHANGE, field2] = await connection.execute("SELECT COUNT(*) AS count FROM IMG_CHANGE;");
    const [numDOWNLOAD, field3] = await connection.execute("SELECT COUNT(*) AS count FROM DOWNLOAD;");

    fileCount = numFILES[0].count;
    changeCount = numIMG_CHANGE[0].count;
    downloadCount = numDOWNLOAD[0].count;
    theStatus = "Database has " + fileCount + " files, " + changeCount + " changes, and " + downloadCount + " downloads.";
  } catch(e) {
    console.log("Query error: "+e);
  }

  res.send({
    status: theStatus
  });
});
// Clears all data from all the tables
app.post('/clearData', async function(req , res, next){
  try{
    if (connection != undefined && connectedStatus){
      await connection.execute("DELETE FROM FILE;");
      await connection.execute("DELETE FROM IMG_CHANGE;");
      await connection.execute("DELETE FROM DOWNLOAD;");
      console.log("Cleared All Data Successfully")
    }
  } catch(e) {
    console.log("Query error: "+e);
  }
});

// When a user downloads an image from the file log panel
app.get('/downloadRequest', async function(req , res, next){
  console.log("Inserting Download to DOWNLOAD Table");
  let filename = req.query.theFile;
  console.log(filename);

  try{
    if (connection != undefined && connectedStatus){
      await connection.execute("INSERT INTO DOWNLOAD SET download_id = null, d_descr = '192.168.0.0 (cannot get user ip without other services)' , svg_id = (SELECT svg_id FROM FILE WHERE file_name = \"" + filename + "\");");
    }
  } catch(e) {
    console.log("Query error: "+e);
  }
  res.send({
    test: filename
  });
});

//Sample endpoint
app.get('/someendpoint', function(req , res){
  let retStr = req.query.name1 + " " + req.query.name2;
  res.send({
    foo: retStr
  });
});

// FILE LOG PANEL
app.get('/getFiles', function(req, res){
  console.log("Getting Files Call Back");
  // Files is an array of all the files in the uploads folder 

  let SVGJSONArray = getFilesArray();

  res.send({
    filesArray: SVGJSONArray
  })
});

app.get('/dropDownMenu', function(req, res) {
  console.log("Creating Drop Down Menu: Call Back");
  let files = fs.readdirSync('uploads/');
  let SVGStr = 0;
  let validFiles = new Array();
  files.forEach(element => {
    SVGStr = sharedLib.SVGFileToJson("uploads/" + element, schemaFile);
    if (SVGStr != "invalid"){
      validFiles.push(element);
    }
  });
  res.send({
    fileList: validFiles
  })
});

app.get('/getShapeAttributes', function(req, res) {
  console.log("Getting Shape Attributes: Call Back");
  let chosenFile = "uploads/" + req.query.fileName + "";
  let shape = req.query.chosenShape + "";
  let index = req.query.indexNum + "";
  let JSONStr = 0;
  let parsedJSON = 0;
  // let attributes = new Array();
  let attributeMainNames = new Array();
  let attributeMainValues = new Array();
  let mainJSONStr = 0;

  if (shape == "Circle"){
    mainJSONStr = sharedLib.getSVGFileCircleList(chosenFile, schemaFile);
    
    if (mainJSONStr != "invalid"){
      parsedJSON = JSON.parse(mainJSONStr);

      parsedJSON.forEach(element => {

        attributeMainNames[0] = "cx";
        attributeMainNames[1] = "cy";
        attributeMainNames[2] = "r";
        attributeMainValues[0] = element.cx;
        attributeMainValues[1] = element.cy;
        attributeMainValues[2] = element.r;
      });
    }

  }
  else if (shape == "Path"){
    mainJSONStr = sharedLib.getSVGFilePathList(chosenFile, schemaFile);
    if (mainJSONStr != "invalid"){
      parsedJSON = JSON.parse(mainJSONStr);
      parsedJSON.forEach(element => {
        attributeMainNames[0] = "d";
        attributeMainValues[0] = element.d;
      });
    }
  }
  else if (shape == "Rectangle"){
    mainJSONStr = sharedLib.getSVGFileRectList(chosenFile, schemaFile);
    if (mainJSONStr != "invalid"){
      parsedJSON = JSON.parse(mainJSONStr);
      parsedJSON.forEach(element => {
        attributeMainNames[0] = "x";
        attributeMainNames[1] = "y";
        attributeMainNames[2] = "width";
        attributeMainNames[3] = "height";
        attributeMainValues[0] = element.x;
        attributeMainValues[1] = element.y;
        attributeMainValues[2] = element.w;
        attributeMainValues[3] = element.h;
      });
    }
  }
  else if (shape == "Group"){
    // mainJSONStr = sharedLib.getSVGFileGroupList(chosenFile, schemaFile);
    attributeMainNames[0] = "Cannot Edit Groups";
    attributeMainValues[0] = "Cannot Edit Groups";
  }

  let attributeNames = new Array();
  let attributeValues = new Array();
  // console.log("'" +chosenFile + "' '" + shape + "' '" + index + "'");

  JSONStr = sharedLib.getAttrList(shape, index, chosenFile, schemaFile);
  if (JSONStr != "invalid" || JSONStr != "wrongShape"){
    parsedJSON = JSON.parse(JSONStr); 
  
    let count = 0;
    parsedJSON.forEach(element => {
      // attributes[count] = new Array();
      // attributes[count][0] = element.name;
      // attributes[count][1] = element.value;
      attributeNames[count] = (count+1) + ". " + element.name;
      attributeValues[count] = element.value;
      count ++;
    });
  }

  res.send({
    attributeMainNames: attributeMainNames,
    attributeMainValues: attributeMainValues,
    // Array of other attributes names
    attributeNamesArray: attributeNames,
    // Array of other attributes values
    attributeValuesArray: attributeValues
  });
});

app.get('/getAttrAtIndex', function(req, res) {
  let attrValueArray = req.query.valueArray;
  let attrIndex = req.query.chosenAttrIndex;
  let value = attrValueArray[attrIndex];

  res.send({
    attrValue: value
  });
});

app.get('/getMainAttrValue', function(req, res) {
  let chosen = req.query.chosen;
  let chosenShape = req.query.chosenShape;
  let theArray = req.query.array;
  let value = 0;
  if (chosenShape == "Circle"){
    if (chosen == "cx"){
      value = theArray[0];
    }
    else if (chosen == "cy"){
      value = theArray[1];
    }
    else if (chosen == "r"){
      value = theArray[2];
    }
  } 
  else if (chosenShape == "Path") {
    if (chosen == "d"){
      value = theArray[0];
    }
  }
  else if (chosenShape == "Rectangle") {
    if (chosen == "x"){
      value = theArray[0];
    }
    else if (chosen == "y"){
      value = theArray[1];
    }
    else if (chosen == "w"){
      value = theArray[2];
    }
    else if (chosen == "h"){
      value = theArray[3];
    }
  } 
  else if (chosenShape == "Group") {
    value = theArray[0];
  }

  res.send({
    mainAttrValue: value
  });
});

app.get('/updateAttribute', async function(req, res, nexy) {
  // void updateAttribute(char * shape, char * index, char * attributeName, char * newValue, char * filename, char * schema);
  let shape = req.query.chosenShape + "";
  let shapeIndex = req.query.shapeIndex + "";
  let attributeName = req.query.name + "";
  let attributeNewValue =  req.query.value + "";
  let initialFilename = req.query.fileName;
  let filename = "uploads/" + req.query.fileName + "";

  if (attributeNewValue == undefined || attributeNewValue == ""){
    attributeNewValue = "         ";
  }
  if (attributeName == "cx" || attributeName == "cy" || attributeName == "r" || attributeName == "x" || attributeName == "y" || attributeName == "width" || attributeName == "height"){
    attributeNewValue = testFloatValid(attributeNewValue);
    if (attributeNewValue != "invalid" && attributeName != undefined && attributeName != ""){
      let status = sharedLib.updateAttribute(shape, shapeIndex, attributeName, attributeNewValue, filename, schemaFile);
      console.log("Updating attribute: " +status);
      try{
        console.log("Adding to IMG_CHANGE and updating file size in FILE table");
        let tempShapeIndex = parseInt(shapeIndex) + 1;
        await connection.execute("INSERT INTO IMG_CHANGE SET change_id = null, change_type = \"Changed Main Attribute of Shape\", change_summary = \" Changed Main attribute " + attributeName + " to " + attributeNewValue + " in " + shape + " #" + tempShapeIndex + ".\", change_time = NOW(), svg_id = (SELECT svg_id FROM FILE WHERE file_name = \"" + initialFilename + "\");");
        let newFileSize = getFileSize(initialFilename);
        await connection.execute("UPDATE FILE SET file_size = " + newFileSize + " WHERE file_name = \"" + initialFilename + "\";");
      } catch(e) {
        console.log("\nMAKE SURE YOU STORE ALL FILES IN FILE TABLE BEFORE MAKING CHANGES TO ATTRIBUTES OF IMAGES OR ELSE IT WON'T BE SAVED IN IMG_CHANGE\n\n");
        console.log("Query error: "+e);
      }
    }
    else{
      console.log("Attribute will not be updated");
      // res.send({
        // alert: "Invalid Input"
      // });
    }
  }
  else{
    if (attributeName != undefined && attributeName != ""){
      let status = sharedLib.updateAttribute(shape, shapeIndex, attributeName, attributeNewValue, filename, schemaFile);
      console.log("Updating attribute: " +status);
      try{
        console.log("Adding to IMG_CHANGE and updating file size in FILE table");
        let tempShapeIndex = parseInt(shapeIndex) + 1;
        await connection.execute("INSERT INTO IMG_CHANGE SET change_id = null, change_type = \"Changed Attribute of Shape\", change_summary = \" Changed attribute " + attributeName + " to " + attributeNewValue + " in " + shape + " #" + tempShapeIndex + ".\", change_time = NOW(), svg_id = (SELECT svg_id FROM FILE WHERE file_name = \"" + initialFilename + "\");");
        let newFileSize = getFileSize(initialFilename);
        await connection.execute("UPDATE FILE SET file_size = " + newFileSize + " WHERE file_name = \"" + initialFilename + "\";");
      } catch(e) {
        console.log("MAKE SURE YOU STORE ALL FILES IN FILE TABLE BEFORE MAKING CHANGES TO ATTRIBUTES OF IMAGES OR ELSE IT WON'T BE SAVED IN IMG_CHANGE");
        console.log("Query error: "+e);
      }
    }
    else {
      console.log("Attribute will not be updated");
      // res.send({
        // alert: "Invalid Input"
      // });
    }
  }

  res.send('');
});


// Sets Title
app.get('/setTitle', async function(req, res, next) {
  let title = req.query.newTitle;
  let filename = "uploads/" + req.query.fileName + "";
  let initialFilename = req.query.fileName;
  let result = sharedLib.setTitle(title, filename, schemaFile);
  console.log("Change title status: " + result);
  if (result == "success"){
    try{
      console.log("Adding to IMG_CHANGE and updating file size in FILE table");
      console.log(initialFilename);
      await connection.execute("INSERT INTO IMG_CHANGE SET change_id = null, change_type = \"Changed Title\", change_summary = \"" + title + "\", change_time = NOW(), svg_id = (SELECT svg_id FROM FILE WHERE file_name = \"" + initialFilename + "\");");
      let newFileSize = getFileSize(initialFilename);
      await connection.execute("UPDATE FILE SET file_size = " + newFileSize + " WHERE file_name = \"" + initialFilename + "\";");
    } catch(e) {
      console.log("MAKE SURE YOU STORE ALL FILES IN FILE TABLE BEFORE MAKING CHANGES TO ATTRIBUTES OF IMAGES OR ELSE IT WON'T BE SAVED IN IMG_CHANGE");
      console.log("Query error: "+e);
    }
  }
});
// Sets Description
app.get('/setDescription', async function(req, res, next) {
  let description = req.query.newDescription;
  let filename = "uploads/" + req.query.fileName + "";
  let initialFilename = req.query.fileName;
  let result = sharedLib.setDescription(description, filename, schemaFile);
  console.log("Change description status: " + result);
  if (result == "success"){
    try{
      console.log("Adding to IMG_CHANGE and updating file size in FILE table");
      await connection.execute("INSERT INTO IMG_CHANGE SET change_id = null, change_type = \"Changed Description\", change_summary = \"" + description + "\", change_time = NOW(), svg_id = (SELECT svg_id FROM FILE WHERE file_name = \"" + initialFilename + "\");");
      let newFileSize = getFileSize(initialFilename);
      await connection.execute("UPDATE FILE SET file_size = " + newFileSize + " WHERE file_name = \"" + initialFilename + "\";");
    } catch(e) {
      console.log("MAKE SURE YOU STORE ALL FILES IN FILE TABLE BEFORE MAKING CHANGES TO ATTRIBUTES OF IMAGES OR ELSE IT WON'T BE SAVED IN IMG_CHANGE");
      console.log("Query error: "+e);
    }
  }
});

// Create SVG Image
app.get('/createSVGImage', async function(req, res, next) {
  let initialFilename = req.query.fileName;
  let result = fileNameValid(initialFilename);
  let filename = "uploads/" + initialFilename + "";
  let title = req.query.title;
  let description = req.query.description;
  let alertMSG = "Success";
  if (title.length < 256 || description.length < 256){
    // An image was created
    if (result == "Success"){
      if (title == ""){
        title = " ";
      }
      if (description == ""){
        description = " ";
      }
      let status = sharedLib.createNewSVGFile(filename, title, description);

      // Storing the newly created svg in the database
      try {
        if (connectedStatus == true){
          // svg_id, file_name, file_title, file_description, n_rect, n_circ, n_path, n_group, creation_time, file_size
          let query = "INSERT IGNORE INTO FILE VALUES (null, '" + initialFilename + "','" + title+ "','" + description + "'," + 0 + "," + 0 + "," + 0 + "," + 0 + "," + "NOW()" + "," + getFileSize(initialFilename) + ");";
          await connection.execute(query);
          console.log("Updated Database with new file");
        }
      } catch(e) {
        console.log("Query error: "+e);
      }

      // storeAllDBFiles();
      res.send({
        alert: status,
      });
    }
    else {
      res.send({
        alert: "Failed",
      });
    }
  }
  else {
    console.log(alertMSG);
    alertMSG = "Title/ Description is invalid";
    res.send({
      alert: alertMSG,
    });
  }
  console.log("SVG Creation Status: " + result);

});

async function storeAllDBFiles(){
  try {
    if (connectedStatus == true){
      let fileArray = getFilesArray();
      // This removes the first item in the array that is normally the title of the table
      fileArray.shift();

      // svg_id, file_name, file_title, file_description, n_rect, n_circ, n_path, n_group, creation_time, file_size
      let query;
      // Would have used null as the svg_id, but then I wouldnt be able to easily check for duplicates
      let count = 1;
      for (let file of fileArray){
        query = "INSERT IGNORE INTO FILE VALUES (" + count + ", '" + file[0] + "','" + file[7] + "','" + file[8] + "'," + file[3] + "," + file[4] + "," + file[5] + "," + file[6] + "," + "NOW()" + "," + parseInt(file[2]) + ");";
        await connection.execute(query);
        count ++;
      }
      console.log("Stored All Data Successfully")
    }
  } catch(e) {
    console.log("Query error: "+e);
  }
}

function fileNameValid(filename){
  let files = fs.readdirSync('uploads/');
  let extension = filename.substring(filename.length-4, filename.length);
  if (files.includes(filename)){
    return "File already exists";
  }
  else if (extension == ".svg"){
    return  "Success";
  }
  return "Failed: Invalid";
}

app.get('/addCircle', async function(req, res, next){
  console.log("connected to add circle");
  let cx = testFloatValid(req.query.cx) + "";
  let cy = testFloatValid(req.query.cy) + "";
  let r = testFloatValid(req.query.r) + "";
  let units = req.query.units;
  let fill =req.query.fill;
  let initialFilename = req.query.fileName;

  let filename = "uploads/" + req.query.fileName + "";

  if (fill == "" || fill == undefined){
    fill = "#000000";
  }
  if (cx != "" && cy != "" && r != "" && cx != "invalid" && cy != "invalid" && r != "invalid") {
    let status = sharedLib.createCircle(cx, cy, r, units, fill, filename, schemaFile);
    console.log("Adding Shape Status: " + status);
    try{
      console.log("Adding to IMG_CHANGE and updating file size in FILE table");
      await connection.execute("INSERT INTO IMG_CHANGE SET change_id = null, change_type = \"Added Circle\", change_summary = \"Added Circle at " + cx + "," + cy + " with radius " + r + ".\", change_time = NOW(), svg_id = (SELECT svg_id FROM FILE WHERE file_name = \"" + initialFilename + "\");");
      let newFileSize = getFileSize(initialFilename);
      await connection.execute("UPDATE FILE SET file_size = " + newFileSize + " WHERE file_name = \"" + initialFilename + "\";");
    } catch(e) {
      console.log("MAKE SURE YOU STORE ALL FILES IN FILE TABLE BEFORE MAKING CHANGES TO ATTRIBUTES OF IMAGES OR ELSE IT WON'T BE SAVED IN IMG_CHANGE");
      console.log("Query error: "+e);
    }
  }
  else{
    console.log("Will not add Shape, an input is invalid");
    res.send({
      alert: "Invalid Input"
    });
  }
});

app.get('/addRectangle', async function(req, res, next){
  console.log("connected to add rectangle");
  let x = testFloatValid(req.query.x);
  let y = testFloatValid(req.query.y);
  let w = testFloatValid(req.query.w);
  let h = testFloatValid(req.query.h);
  let units = req.query.units;
  let fill = req.query.fill;
  let initialFilename = req.query.fileName;

  let filename = "uploads/" + req.query.fileName + "";

  if (fill == "" || fill == undefined){
    fill = "#000000";
  }
  if (x != "" && y != "" && w != "" && h != "" && x != "invalid" && y != "invalid" && w != "invalid" && h != "invalid") {
    let status = sharedLib.createRectangle(x, y, w, h, units, fill, filename, schemaFile);
    console.log("Adding Shape Status: " + status);
    try{
      console.log("Adding to IMG_CHANGE and updating file size in FILE table");
      await connection.execute("INSERT INTO IMG_CHANGE SET change_id = null, change_type = \"Added Rectangle\", change_summary = \"Added Rectangle at " + x + "," + y + " with width " + w + " and height " + h  + ".\", change_time = NOW(), svg_id = (SELECT svg_id FROM FILE WHERE file_name = \"" + initialFilename + "\");");
      let newFileSize = getFileSize(initialFilename);
      await connection.execute("UPDATE FILE SET file_size = " + newFileSize + " WHERE file_name = \"" + initialFilename + "\";");
    } catch(e) {
      console.log("MAKE SURE YOU STORE ALL FILES IN FILE TABLE BEFORE MAKING CHANGES TO ATTRIBUTES OF IMAGES OR ELSE IT WON'T BE SAVED IN IMG_CHANGE");
      console.log("Query error: "+e);
    }
  }
  else {
    console.log("Will not add Shape, an input is invalid");
    res.send({
      alert: "Invalid Input"
    });
  } 
});

app.get('/scaleCircle', async function(req, res, next){
  console.log("connected to scale circle");
  let scaleFactor = req.query.scaleFactor + "";
  let filename = "uploads/" + req.query.fileName + "";
  let initialFilename = req.query.fileName;
  let status = sharedLib.scaleCircles(scaleFactor, filename, schemaFile);
  console.log("Scaling Shape Status: " + status);
  if (status == "success"){
    try{
      console.log("Adding to IMG_CHANGE and updating file size in FILE table");
      await connection.execute("INSERT INTO IMG_CHANGE SET change_id = null, change_type = \"Scaled Circles\", change_summary = \"Scaled Circles by Factor of " + scaleFactor + "x.\", change_time = NOW(), svg_id = (SELECT svg_id FROM FILE WHERE file_name = \"" + initialFilename + "\");");
      let newFileSize = getFileSize(initialFilename);
      await connection.execute("UPDATE FILE SET file_size = " + newFileSize + " WHERE file_name = \"" + initialFilename + "\";");
    } catch(e) {
      console.log("MAKE SURE YOU STORE ALL FILES IN FILE TABLE BEFORE MAKING CHANGES TO ATTRIBUTES OF IMAGES OR ELSE IT WON'T BE SAVED IN IMG_CHANGE");
      console.log("Query error: "+e);
    }
  }

});

app.get('/scaleRectangle', async function(req, res, next){
  console.log("connected to scale rectangle");
  let scaleFactor = req.query.scaleFactor + "";
  let filename = "uploads/" + req.query.fileName + "";
  let initialFilename = req.query.fileName;
  let status = sharedLib.scaleRectangles(scaleFactor, filename, schemaFile);
  console.log("Scaling Shape Status: " + status);
  if (status == "success"){
    try{
      console.log("Adding to IMG_CHANGE and updating file size in FILE table");
      await connection.execute("INSERT INTO IMG_CHANGE SET change_id = null, change_type = \"Scaled Rectangles\", change_summary = \"Scaled Rectangles by Factor of " + scaleFactor + "x.\", change_time = NOW(), svg_id = (SELECT svg_id FROM FILE WHERE file_name = \"" + initialFilename + "\");");
      let newFileSize = getFileSize(initialFilename);
      await connection.execute("UPDATE FILE SET file_size = " + newFileSize + " WHERE file_name = \"" + initialFilename + "\";");
    } catch(e) {
      console.log("MAKE SURE YOU STORE ALL FILES IN FILE TABLE BEFORE MAKING CHANGES TO ATTRIBUTES OF IMAGES OR ELSE IT WON'T BE SAVED IN IMG_CHANGE");
      console.log("Query error: "+e);
    }
  }
});

// This function will return the valid version of the input 
// If input = 4.2 nothing will be done and will return 4.2
// If input = 4.3cm , then the function will return 4.3 
function testFloatValid(input){
  input = input + "";
  let valid = parseFloat(input) + "";
  if (valid == input){
    // input is a valid float 
    return valid;
  }
  else if (valid.includes(input)){
    // Input is valid, and chars will be removed from input
    return valid;
  }
  else {
    return "invalid";
  }
}


// SVG VIEW PANEL
app.get('/svgViewPanel', function(req, res){
  console.log("Creating SVG View Panel: Call Back");
  // Files is an array of all the files in the uploads folder 
  // console.log(req.query.fileName);
  let chosenFile = req.query.fileName;
  // let files = fs.readdirSync('uploads/');
  // let SVGViewArray = new Array();
  let imageRows = 4;
  let imageCount = 0;
  let JSONStr = 0;
  let parsedJSON = 0;

  let rectList = 0;
  let pathList = 0;
  let circleList = 0;
  let groupList = 0;
  JSONStr = sharedLib.SVGFileToJson("uploads/" + chosenFile, schemaFile);
  let title = sharedLib.getSVGFileTitle("uploads/" + chosenFile, schemaFile) + "";
  let description = sharedLib.getSVGFileDescription("uploads/" + chosenFile, schemaFile) + "";
  if (JSONStr != "invalid"){
    parsedJSON = JSON.parse(JSONStr);
    
    let SVGViewArray = new Array();
    let SVGchildArray = new Array();
    // image count is for an image, imagerows is for each row of information in the image
    SVGViewArray[0] = new Array();
    SVGViewArray[0][0] = chosenFile;
    SVGViewArray[1] = new Array();
    SVGViewArray[1][0] = "Title";
    SVGViewArray[1][1] = "Description";
    SVGViewArray[2] = new Array();
    SVGViewArray[2][0] = title; 
    SVGViewArray[2][1] = description; 
    SVGViewArray[3] = new Array();
    SVGViewArray[3][0] = "Component";
    SVGViewArray[3][1] = "Summary";
    SVGViewArray[3][2] = "Other Attributes";

    // NEED TO USE THE JSON STRING FOR EACH PATH, CIRCLE, RECT, AND GROUP IN 
    // THE IMAGE, OUPUT THE INFORMATION GIVEN BY THE JSON STRING 
    // after this for loop
    // THIS SHOULD ONLY BE FOR PATHS, CIRCLES, RECTS, AND GROUPS THAT ARE DIRECTLY IN THE SVG IMAGE 

    rectList = JSON.parse(sharedLib.getSVGFileRectList("uploads/" + chosenFile, schemaFile));
    circleList = JSON.parse(sharedLib.getSVGFileCircleList("uploads/" + chosenFile, schemaFile));
    pathList = JSON.parse(sharedLib.getSVGFilePathList("uploads/" + chosenFile, schemaFile));
    groupList = JSON.parse(sharedLib.getSVGFileGroupList("uploads/" + chosenFile, schemaFile));
    // I MADE THESE SEQUENTIAL, IF I HAVE TO CHANGE THE ORDERING OF THEM, I HAVE TO CHANGE WHICH NUM IS SET TO WHICHEVER OTHER ONE
    // image rows is 4
    let rectNum = imageRows;
    // NEED TO FIND OUT WHAT ORDER TO PUT THEM IN 
    for (let rect of rectList){
      
      SVGViewArray[rectNum] = new Array();
      SVGViewArray[rectNum][0] = "Rectangle " + (rectNum - imageRows + 1);
      SVGViewArray[rectNum][1] = "Upper left corner: x = " + rect.x + rect.units + ", y = " + rect.y + rect.units + "\nWidth: " + rect.w + rect.units + ", Height: " + rect.h + rect.units;
      SVGViewArray[rectNum][2] = rect.numAttr;      
      // console.log("Rectangle " + (rectNum - imageRows + 1));
      SVGchildArray[rectNum-imageRows] = new Array();
      SVGchildArray[rectNum-imageRows][0] = SVGViewArray[rectNum][0];
      // SVGchildArray[rectNum-imageRows][1] = SVGViewArray[rectNum][1];
      // SVGchildArray[rectNum-imageRows][2] = SVGViewArray[rectNum][2];
      rectNum++;
    }
    let circleNum = rectNum;
    for (let circle of circleList){
      SVGViewArray[circleNum] = new Array();
      SVGViewArray[circleNum][0] = "Circle " + (circleNum - rectNum + 1);
      SVGViewArray[circleNum][1] = "Centre: x = " + circle.cx + circle.units + ", y = " + circle.cy + circle.units + ", radius = " + circle.r + circle.units;
      SVGViewArray[circleNum][2] = circle.numAttr;
      // console.log("Circle " + (circleNum - rectNum + 1));
      SVGchildArray[circleNum-imageRows] = new Array();
      SVGchildArray[circleNum-imageRows][0] = SVGViewArray[circleNum][0];
      // SVGchildArray[circleNum-imageRows][1] = SVGViewArray[circleNum][1];
      // SVGchildArray[circleNum-imageRows][2] = SVGViewArray[circleNum][2];
      circleNum++;
    }
    let pathNum = circleNum;
    for (let path of pathList){
      SVGViewArray[pathNum] = new Array();
      SVGViewArray[pathNum][0] = "Path " + (pathNum - circleNum + 1);
      SVGViewArray[pathNum][1] = "path data = " + path.d;
      SVGViewArray[pathNum][2] = path.numAttr;
      // console.log("Path " + (pathNum - circleNum + 1));
      SVGchildArray[pathNum-imageRows] = new Array();
      SVGchildArray[pathNum-imageRows][0] = SVGViewArray[pathNum][0];
      // SVGchildArray[pathNum-imageRows][1] = SVGViewArray[pathNum][1];
      // SVGchildArray[pathNum-imageRows][2] = SVGViewArray[pathNum][2];
      pathNum++;
    }
    let groupNum = pathNum;
    for (let group of groupList){
      SVGViewArray[groupNum] = new Array();
      SVGViewArray[groupNum][0] = "Group " + (groupNum - pathNum + 1);
      SVGViewArray[groupNum][1] = group.children + " child elements";
      SVGViewArray[groupNum][2] = group.numAttr;
      
      // console.log("Group " + (groupNum - pathNum + 1));
      SVGchildArray[groupNum-imageRows] = new Array();
      SVGchildArray[groupNum-imageRows][0] = SVGViewArray[groupNum][0];
      // SVGchildArray[groupNum-imageRows][1] = SVGViewArray[groupNum][1];
      // SVGchildArray[groupNum-imageRows][2] = SVGViewArray[groupNum][2];
      groupNum++;
    }
          
    // console.log(SVGchildArray);

    res.send({
      SVGArray: SVGViewArray,
      SVGchildren: SVGchildArray,
      SVGTitle: title,
      SVGDescription: description
    })
  }
});

// app.get('/atest', function(req, res) {
//   let JSONStr = sharedLib.SVGFileToJson("uploads/hen_and_chicks.svg", schemaFiles);
//   let parsedJSON = JSON.parse(JSONStr);

//   res.send({
//     paths: parsedJSON.numPaths
//   });
// });


//******************** Your code goes here ******************** /

app.listen(portNum);
console.log('Running app at localhost: ' + portNum);