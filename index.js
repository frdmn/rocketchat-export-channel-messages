var program = require('commander'),
    RocketChatClient = require('rocketchat').RocketChatClient;

/**
 * Function to write error message to console and also exit the process
 * with error code 1
 * @param  {String|Object} err - Object that holds the error message
 * @param  {Integer} code - Optional status code to exit with (defaults to 1)
 * @return {Object} process - End process with exit code
 */
function error(err, code = 1){
    console.log("error: ", err);
    return process.exit(code);
}

/**
 * Write (success) messages to console and exit the process with
 * error code 0
 * @param  {String} message - String that holds the message to print
 * @return {Object} - Return with error code 0
 */
function success(message){
    console.log(message);
    return process.exit(1);
}

var packagejson = require('./package.json');

program
    .version(packagejson.version)
    .description(packagejson.description)
    .option('-r, --rid [roomId]', 'roomId of channel to export messages from')
    .option('-j, --json', 'Export as JSON file rather than CSV')
    .parse(process.argv);

// Load configuration object for RocketChat API from JSON
var config = require('./config.json');

// Check for mandantory "-c" flag
if (!program.rid) {
    program.outputHelp(() => program.help());
}

// Create client
var rocketChatClient = new RocketChatClient(config);

// Empty array that will hold the message objects
var messageArray = [];

// Authenticate using admin credentials stored in config object
rocketChatClient.authentication.login(config.username, config.password, function(err, body) {
	if (!err) {
		success(body);
	} else {
		error(err);
	}
})
