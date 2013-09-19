var schedule = require('node-schedule');
var fs = require('fs');
var sys = require('sys');
var googleapis = require('googleapis');
var exec = require('child_process').exec;
var request = require('request');
var async = require('async');
var child;

//creando el accesso a g drive
var GoogleTokenProvider = require('refresh-token').GoogleTokenProvider;

const CLIENT_ID = '908994723046.apps.googleusercontent.com';
const CLIENT_SECRET = 'JxUqxPXJ6u2lD2iyaIhhrAOz';
const REFRESH_TOKEN = '1/k1Do6CJj3nJPMSKyMxstZWDSGjanXnvLSAQh2wj7of4';
const GDRIVE_FOLDER = '0By32UVl3qMIQeFN0TnJiWlhhclU';
const GDRIVE_URL = 'https://www.googleapis.com/drive/v2';
const BACKUP_FILE_PATH = '/home/frank/prueba/BackupLancaster.sql';



var tokenProvider = new GoogleTokenProvider({
  'refresh_token': REFRESH_TOKEN,
  'client_id' : CLIENT_ID,
  'client_secret': CLIENT_SECRET
});
var auth = new googleapis.OAuth2Client();




//armando el scheduler
var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [1, new schedule.Range(2,5)];
rule.hour = 1;
rule.minute = 03;

var j = schedule.scheduleJob(rule, function(){

	googleapis.discover('drive','v2').execute(function(err1,client){
		//aca va el codigo para subir el archivo a google drive
		uploadFile();

		if(err1 !== null){
			console.log('error en discover google ',err1);
		}

	});//fin del bloque de google-discover


});//fin del bloque de schedule

var uploadFile = function () {

async.waterfall([
//aca viene el array de funciones; una se ejecuta desp de la otra
//y la funcion anterior debe llamar a callback con un parametro que va a ser
//entrada de la siguiente funcion
	function(callback){
			var date = new Date();
	//ejecutamos el comando mysql q hace el backup
	child = exec("mysqldump -u backuplancaster lancaster > " + BACKUP_FILE_PATH,
		function(error,stdout,stderr){
			sys.print('stdout: ' + stdout);
			sys.print('stderr: ' + stderr);
			if (error !== null) {
				console.log('exec error: ' + error);
			}	
		});
	console.log('termina backup');
		//aca pedimos un token nuevo
		tokenProvider.getToken(callback);
			console.log('termina peticion token');
	},
	function(accessToken, callback){
		//aca enviamos el archivo a google drive
		var fstatus = fs.statSync(BACKUP_FILE_PATH);
    fs.open(BACKUP_FILE_PATH, 'r', function(status, fileDescripter) {
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
                 'title': BACKUP_FILE_PATH,
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
	console.log('termina subida archivo');
	},
	function(response, body, callback){
		//esta funcion es la ultima. Hace el parsing de la respuesta
		var body = JSON.parse(body);
		callback(null,body);
		console.log('termina parsing');
	}

	], function(err, results){
		//esta es la funcion callback del waterfall
		if(!err){
			console.log(results);
		} else {
			console.error('---error en el callback de waterfall');
			console.error(err);
		}
	}

);


};