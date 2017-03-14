if (process.argv.length < 3) {
  console.log('Usage: node ' + process.argv[1] + ' FILENAME');
  process.exit(1);
}
// Read the file and print its contents.
var outFs = require('fs');
var request = require('request');

var filename = process.argv[2];
var testResults = [];
var outWriter = outFs.createWriteStream(filename + "-out.csv");
var COMMA = ',';
var URL = 'http://<HOST-NAME>:<PORT>/PATH';
var PATH = '/test/';
var QS = '?packets=0&filter=results';

var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream(filename)
});

outWriter.on('error', function() {
	console.error('ERROR creating the output file. Make sure that the file is not locked');
	process.exit(1);
});

lineReader.on('line', function (line) {
  //console.log('Line from file:', line);
  testResults.push(line);
}).on('close', function () {
	
	//Remove the header, and write to the output file.
	var line = testResults.shift();
	var arr = line.split(',');
	outWriter.write(arr[8] + COMMA + arr[9] + COMMA + arr[3] + COMMA + 'note \n');
	
	processNext();	
});


function processNext() {
	if (testResults.length > 0) {
		transformRow(testResults.shift());
	}
}

function transformRow(line) {
	var arr = line.split(',');
	var result = arr[3];
	var name = arr[8];
	var desc = arr[9];
	var note = '';
	
	var RUNID = arr[0];
	var SEQ = arr[1];
	
	
	if (result == 'fail') {
		var FQURL = URL + RUNID + PATH + SEQ + QS;
		console.log('getting data for ' + FQURL);
		request(FQURL, function (error, response, body) {
			if (error) {
				console.log('error:', error); // Print the error if one occurred 
			} else {
				console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
				if (body) {
					note = body.replace(/"/g, "'");
				}
			}
			
			outWriter.write(name + COMMA + desc + COMMA + result + COMMA + '"' + note + '" \n');
			
			processNext();
		});		
	} else {
		outWriter.write(name + COMMA + desc + COMMA + result + COMMA + note + '\n');
		processNext();			
	}
}