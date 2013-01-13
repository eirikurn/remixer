var echonest = require('echonest')
  , request = require('request');

/**
 * Environment constants
 */
var ECHONEST_APIKEY = process.env.ECHONEST_APIKEY
  , ECHONEST_ANALYZE_TIMEOUT = process.env.ECHONEST_ANALYZE_TIMEOUT || 60;

if (!ECHONEST_APIKEY) {
  console.log("ERROR: ECHONEST_APIKEY is missing from env.");
  process.exit();
}


/**
 * Setup the echonest service.
 * @type {echonest.Echonest}
 */
var api = exports.api = new echonest.Echonest({ api_key: ECHONEST_APIKEY });

exports.analyze = function(buffer, filetype, callback) {
  var startDate;

  function waitForPending(id, duration) {
    setTimeout(function() {
      api.track.profile({id: id, bucket: 'audio_summary'}, function(err, data) {
        if (err) {
          callback(err);
          return;
        }

        // Are we finished?
        var totalWait = (new Date() - startDate) / 1000;
        if (data.track.status !== 'pending' || totalWait > ECHONEST_ANALYZE_TIMEOUT) {
          processResult(null, data);
          return;
        }

        // Nope, let's wait some more.
        waitForPending(id, duration + duration / 2);
      });
    }, duration * 1000);
  }

  function processResult(err, data) {
    // Error handling
    if (err) {
      callback(err);
      return;
    } else if (data.track.status === 'pending') {
      callback(new Error("Timeout while analyzing track " + data.track.id + " (" + ECHONEST_ANALYZE_TIMEOUT + " secs)"));
      return;
    } else if (data.track.status !== 'complete') {
      callback(new Error("There was an error analyzing track " + data.track.id + ", status: " + data.track.status));
      return;
    }

    // Do we json analysis?
    var jsonUrl = data.track.audio_summary.analysis_url;
    if (jsonUrl) {
      request({url: jsonUrl, json: true}, function(err, res, body) {
        if (err) {
          callback(err);
          return;
        }

        data.track.analysis = body;
        callback(null, data.track);
      });
    } else {
      callback(null, data.track);
    }
  }

  api.track.upload({track: {data: buffer}, filetype: filetype}, function(err, data) {
    if (err) {
      callback(err);
      return;
    }

    if (data.track.status === 'pending') {
      startDate = +new Date();
      waitForPending(data.track.id, 3, processResult);
    } else {
      processResult(null, data);
    }
  });
};
