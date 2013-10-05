//Author: Francisco Villasanti, twitter: @FrankVillasanti. Code. share. progress

var schedule = require('node-schedule');
var fs = require('fs');
var sys = require('sys');
var googleapis = require('googleapis');
var exec = require('child_process').exec;
var request = require('request');
var async = require('async');
var child;
var fechlog = new Date();
console.log("script init at "+fechlog.getHours()+":"+fechlog.getMinutes()+":"+fechlog.getSeconds());
//creating google drive access 
var GoogleTokenProvider = require('refresh-token').GoogleTokenProvider;

const CLIENT_ID = '<your-id>.apps.googleusercontent.com';
const CLIENT_SECRET = '<your-client-secret>';
const REFRESH_TOKEN = '1/<your-refresh-token>';
const GDRIVE_FOLDER = '<your-google-drive-folder-id>';
const GDRIVE_URL = 'https://www.googleapis.com/drive/v2';// don't need to modify this
const BACKUP_FILE_PATH = "/path/to-your/backup/directory";
var BACKUP_FILE_NAME = "<name-for-backup-file>";




var tokenProvider = new GoogleTokenProvider({
  'refresh_token': REFRESH_TOKEN,
  'client_id' : CLIENT_ID,
  'client_secret': CLIENT_SECRET
});
var auth = new googleapis.OAuth2Client();




//coding the scheduler
var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [1, new schedule.Range(2,5)];//this goes from monday to friday
rule.hour = 22;
rule.minute = 8;

var j = schedule.scheduleJob(rule, function(){

	googleapis.discover('drive','v2').execute(function(err1,client){
		//call to the function that executes backup and uploads the file
		uploadFile();

		if(err1 !== null){
			console.log('error on discover google ',err1);
		}

	});//end google-discover block


});//end schedule block

var uploadFile = function () {

async.waterfall([
// this is a convenient method of async that takes an
// array of functions that will be executed one after another passing
 // the output from the previous one as an input to the next function 
	function(callback){
			var date = new Date();
	//execute mysqldump
	
	var contNombre = "-"+date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+".sql";
	BACKUP_FILE_NAME = BACKUP_FILE_NAME + contNombre;

	child = exec("mysqldump -u <your-mysql-backup-user> <your-database-name> > " + BACKUP_FILE_PATH+BACKUP_FILE_NAME),
		function(error,stdout,stderr){
			sys.print('stdout: ' + stdout);
			sys.print('stderr: ' + stderr);
			if (error !== null) {
				console.log('exec error: ' + error);
			}	
		};
	console.log('backup ended');
		//ask for a new token
		tokenProvider.getToken(callback);
			console.log('token request ended');
	},
	function(accessToken, callback){
		//send file to google drive
		var fstatus = fs.statSync(BACKUP_FILE_PATH);
    fs.open(BACKUP_FILE_PATH+BACKUP_FILE_NAME, 'r', function(status, fileDescripter) {
      if (status) {
        callback(status.message);
        return;
      }
      
      var buffer = new Buffer(fstatus.size);
      fs.read(fileDescripter, buffer, 0, fstatus.size, 0, function(err, num) {
          
        request.post({
          'url': 'https://www.googleapis.com/upload/drive/v2/files',
          'qs': {
             //request module adds "boundary" and "Content-Length" automatically.
            'uploadType': 'multipart'

          },
          'headers' : {
            'Authorization': 'Bearer ' + accessToken
          },
          'multipart':  [
            {
              'Content-Type': 'application/json; charset=UTF-8',
              'body': JSON.stringify({
                 'title': BACKUP_FILE_NAME,
                 'parents': [
                   {
                     'id': GDRIVE_FOLDER
                   }
                 ]
               })
            },
            {
              'Content-Type': 'text/plain',
              'body': buffer
            }
          ]
        }, callback);
        
      });
    });
	console.log('file upload ended');
	},
	function(response, body, callback){
		// parse the content of the body 
		var body = JSON.parse(body);
		callback(null,body);
		console.log('parsing ended');
	}

	], function(err, results){
		 
		//function that prints results to standard output (stdout)
		//or standard error (stderr) 
		
		if(!err){
			console.log(results);
		} else {
			console.error('---error on callback');
			console.error(err);
		}
	}

);


};
