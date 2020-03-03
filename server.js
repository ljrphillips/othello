/*Include the static file webserver library*/
var static = require('node-static');

/*Include the http server library*/
var http = require('http');

/*Assume that we're running on Heroku*/
var port = process.env.PORT;
var directory = __dirname + '/public';

/*If we aren't on Heroku, readjust the port and directory info*/
if(typeof port == 'undefined' || !port) {
	directory = './public';
	port = 8080;
}

/*Set up static web-server to deliver files from filesystem*/
var file = new static.Server(directory);

/*Construct an http server that gets files from file server*/

var app = http.createServer(
	function(request, response){
		request.addListener('end',
			function(){
				file.serve(request,response);
			}
		).resume();
	}
).listen(port);

console.log('The server is running');
		