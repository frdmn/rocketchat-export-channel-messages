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

/**
 * Functio to check if a given roomName is actually
 * a public room or a private group
 * @param {String} roomName room ID to test
 * @param {Callback} callback
 */
function testIfChannelOrGroup(roomName, callback){
    rocketChatClient.channels.info({roomName}, function (err, body) {
        if (err) error(err);
        if (body.success) {
            return callback({type:'channels'});
        } else {
            rocketChatClient.groups.info({roomName}, function (err, body) {
                if (err) error(err);
                if (body.success) {
                    return callback({type:'groups'});
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
    .option('-r, --room [roomName]', 'roomName of channel or group to export messages from')
    .option('-j, --json', 'Export as JSON file rather than CSV')
    .parse(process.argv);

// Load configuration object for RocketChat API from JSON
var config = require('./config.json');

// Check for mandantory "-r" flag
if (!program.room) {
    program.outputHelp(() => program.help());
}

// Create client
var rocketChatClient = new RocketChatClient(config);

// Empty array that will hold the message objects
var messageArray = [];

/**
 * Function to repeatedly send rocketChatClient.channels.messages()
 * to iterate over result pagination until final page is received
 * @param {String} roomType - Required roomType ('channels' or 'groups')
 * @param {String} roomName - Required roomName
 * @param {Integer} offset - Optional offset can be passed
 */
 function getHistoryOfChannelOrGroup(roomType, roomName, offset = 0, callback){
    var count = 100;
    rocketChatClient[roomType].messages({roomName: roomName, offset: offset, count: count}, function (err, body) {
        if (err) error(err);

        // Merge new messages from API response to existing messageArray
        messageArray = messageArray.concat(body.messages);

        var totalCollected = messageArray.length;

        // Check if current response still has ${count} messages, if so call self again with new offset
        if (body.messages.length === count){
            getHistoryOfChannelOrGroup(roomType, roomName, totalCollected, callback);
        } else {
            return callback(messageArray);
        }
    });
}

// Authenticate using admin credentials stored in config object
rocketChatClient.authentication.login(config.username, config.password, function(err, body) {
    if (err) error(err);

    testIfChannelOrGroup(program.room, function(result){
        getHistoryOfChannelOrGroup(result.type, program.room, undefined, function(data){
            console.log(data);
        });
    });
})
