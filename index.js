var fs = require('fs'),
    converter = require('json-2-csv'),
    program = require('commander'),
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
        if (!err && body.success) {
            return callback({type:'channels'});
        } else {
            rocketChatClient.groups.info({roomName}, function (err, body) {
                if (!err && body.success) {
                    return callback({type:'groups'});
                } else {
                    return callback(false);
                }
            });
        }
    });
}

/**
 * Function to repeatedly send rocketChatClient.channels.messages()
 * to iterate over result pagination until final page is received
 * @param {String} roomType - Required roomType ('channels' or 'groups')
 * @param {String} roomName - Required roomName
 * @param {Integer} offset - Optional offset can be passed
 * @param {Object} callback - {data, totalCollected, roomType, roomName}
 */
function getHistoryOfChannelOrGroup(roomType, roomName, offset = 0, callback){
    var count = 100;
    rocketChatClient[roomType].messages({roomName: roomName, offset: offset, count: count}, function (err, body) {
        if (err) error(err);

        // Merge new messages from API response to existing messageArray
        messageArray = messageArray.concat(body.messages);

        var totalCollected = messageArray.length;
        console.log('Found ' + count + ' messages... Looking for more (total: ' + totalCollected + ')...')

        // Check if current response still has ${count} messages, if so call self again with new offset
        if (body.messages.length === count){
            getHistoryOfChannelOrGroup(roomType, roomName, totalCollected, callback);
        } else {
            return callback({data: messageArray, total: totalCollected, roomType: roomType.replace(/s$/, ''), roomName: roomName});
        }
    });
}

/**
 * Convert passed data to CSV and write to file
 * @param {Array} data - Data array that holds all user objects
 * @param {Function()} cb - Callback function
 */
function convertToCsvAndWriteToFile(data, cb) {
    // Convert to CSV
    converter.json2csv(data,function(err, csv){
        if(err) {
            return cb(err);
        }

        fs.writeFile("export.csv", csv, function(err) {
            if(err) {
                return cb(err);
            }

            return cb(true);
        });
    }, {
        // Do not check for key differences in each user object
        checkSchemaDifferences: false,
        // Make sure to wrap CSV values in double quotes
        delimiter: {
            wrap: '"'
        }
    });
}

/**
 * Convert passed data to JSON and write to file
 * @param {Array} data - Data array that holds all user objects
 * @param {Function()} callback - Callback function
 */
function convertToJsonAndWriteToFile(data, callback) {
    fs.writeFile("export.json", JSON.stringify(data,null,'\t'), function(err) {
        if(err) {
            return callback(err);
        }

        return callback(true);
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

// Create API client
var rocketChatClient = new RocketChatClient(config);

// Empty array that will hold the message objects
var messageArray = [];

// Authenticate using admin credentials stored in config object
rocketChatClient.authentication.login(config.username, config.password, function(err, body) {
    if (err) error(err);

    console.log('Trying to figure out room type of "#' + program.room + '"...');
    testIfChannelOrGroup(program.room, function(result){
        console.log('Looks like a ' + result.type.replace(/s$/, '') + '. Searching for messages ...');
        getHistoryOfChannelOrGroup(result.type, program.room, undefined, function(data){
            if (program.json){
                convertToJsonAndWriteToFile(data, function(data){
                    success("Completed JSON export, successfully written to \"export.json\".");
                });
            } else {
                convertToCsvAndWriteToFile(data.data, function(){
                    success("Completed CSV export, successfully written to \"export.csv\".");
                });
            }
        });
    });
})
