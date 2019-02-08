var program = require('commander'),
    RocketChatClient = require('rocketchat').RocketChatClient;

var packagejson = require('./package.json');

program
    .version(packagejson.version)
    .description(packagejson.description)
    .option('-c, --channel [channel]', 'Channel to export messages from')
    .option('-j, --json', 'Export as JSON file rather than CSV')
    .parse(process.argv);

// Load configuration object for RocketChat API from JSON
var config = require('./config.json');

// Check for mandantory "-c" flag
if (!program.channel) {
    program.outputHelp(() => program.help());
}

// Create client
var rocketChatClient = new RocketChatClient(config);

// Empty array that will hold the message objects
var messageArray = [];

// Authenticate using admin credentials stored in config object
rocketChatClient.authentication.login(config.username, config.password, function(err, body) {
	if (!err) {
		console.log(body);
	} else {
		console.log(err);
	}
})
