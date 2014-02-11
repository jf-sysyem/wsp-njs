var fs = require('fs')
        , exec = require('child_process').exec
        , util = require('util')

var files = {};

var newUpload = function(data, temp_dir, callback) {
    var name = data['name'];
    console.log('NAME: '+name);
    files[name] = {//Create a new Entry in The Files Variable
        file_size: data['size'],
        data: "",
        downloaded: 0
    };
    var place = 0;
    try {
        var stat = fs.statSync(temp_dir + '/' + name);
        if (stat.isFile()) {
            files[name]['downloaded'] = stat.size;
            place = stat.size / 524288;
        }
    }
    catch (er) {
    } //It's a New File
    fs.open(temp_dir + '/' + name, "a", 0755, function(err, fd) {
        if (err) {
            console.log(err);
        } else {
            files[name]['handler'] = fd; //We store the file handler so we can write to it later
            callback({'place': place, percent: 0});
        }
    });
};
var continueUpload = function(data, temp_dir, upload_dir, callback, ending_callback) {
    var name = data['name'];
    files[name]['downloaded'] += data['data'].length;
    files[name]['data'] += data['data'];
    if (files[name]['downloaded'] === files[name]['file_size']) { //If File is Fully Uploaded
        fs.write(files[name]['handler'], files[name]['data'], null, 'Binary', function(err, Writen) {
            var inp = fs.createReadStream(temp_dir + '/' + name);
            var out = fs.createWriteStream(upload_dir + '/' + name);
            util.pump(inp, out, function() {
                fs.unlink(temp_dir + '/' + name, function() { //This Deletes The Temporary File
                    ending_callback({'file': upload_dir + '/' + name});
                });
            });
        });
    } else if (files[name]['data'].length > 10485760) { //If the Data Buffer reaches 10MB
        fs.write(files[name]['handler'], files[name]['data'], null, 'Binary', function(err, Writen) {
            files[name]['data'] = ""; //Reset The Buffer
            var place = files[name]['downloaded'] / 524288;
            var percent = (files[name]['downloaded'] / files[name]['file_size']) * 100;
            callback({'place': place, 'percent': percent});
        });
    } else {
        var place = files[name]['downloaded'] / 524288;
        var percent = (files[name]['downloaded'] / files[name]['file_size']) * 100;
        callback({'place': place, 'percent': percent});
    }
};

exports.newUpload = newUpload;
exports.continueUpload = continueUpload;