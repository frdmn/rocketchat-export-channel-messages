var program = require('commander'),
    RocketChatApi = require('rocketchat').RocketChatApi,
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

/**
 * Functio to check if a given roomId is actually
 * a public room or a private group
 * @param {String} roomId room ID to test
 * @param {Callback} callback
 */
function testIfChannelOrGroup(roomId, callback){
    rocketChatClient.channels.info(roomId, function (err, body) {
        if (!err && body.success) {
            return callback({type:'channel', totalMessages: body.channel.msgs});
        } else {
            rocketChatClient.groups.info(roomId, function (err, body) {
                if (!err && body.success) {
                    return callback({type:'group', totalMessages: body.group.msgs});
                } else {
                    return callback(false);
                }
            });
        }
    });
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

/**
 * Function to repeatedly send rocketChatClient.channels.messages()
 * to iterate over result pagination until final page is received
 * @param {String} roomId - Required roomId / rid
 * @param {Integer} offset - Optional offset can be passed
 */
 function getHistoryOfChannel(roomId, offset = 0){
    var count = 100;
    rocketChatClient.channels.messages({roomName: "test", offset: offset, count: count}, function (err, body) {
        if (err) error(err);

        // Merge new messages from API response to existing messageArray
        messageArray = messageArray.concat(body.messages);

        var totalCollected = messageArray.length;

        // Check if current response still has ${count} messages, if so call self again with new offset
        if (body.messages.length === count){
            getHistoryOfChannel(roomId, totalCollected);
        } else {
            success(messageArray);
        }
    });
}

// Authenticate using admin credentials stored in config object
rocketChatClient.authentication.login(config.username, config.password, function(err, body) {
    if (err) error(err);

    testIfChannelOrGroup(program.rid, function(result){
        /**
         * result = {
         *   totalMessages: 123,
         *   type: channel
         * }
         */
        getHistoryOfChannel(program.rid);
    });
})
