"use strict";

/**
 * Rest module 
 */
 
var https = require('https');

/**
 * Generic REST invocation function
 * Should handle all verbs
 * @param	  {object}	  opts		  options for request
 * @param  	{string}	  body		  body of request
 * @param  	{Function}	callback	function(data) error handling & parseing should be done by module
 */
function rest(opts, body, callback) {
  var callbackArgs = [],
      isDone = false;

  function finish(err, res) {
    if (isDone) return; //This would only happen if an error occurs AFTER the res has ended...doubtful that would ever happen.

    if (err) {
      callbackArgs[0] = err; //If there's an error and no res, collect it and keep waiting until the 'end' event
    } else {
      isDone = true;
      callbackArgs[1] = res;
      callback.apply(null, callbackArgs); //Pass both the err and res to the callback, because often times the body will be just fine despite errors
    }
  }

  var req = https.request(opts, function(res) {
    var data = '';

    res.on('data', function(d){data+=d;}); //capture data
    res.on('end', function(){
      res.body = res.message = data;
      finish(null, res);
    });
  });

  req.on('error', function(e) {
    console.log('[rest] error' + e);
    finish(e);
  });

  req.write(body);
  req.end();
}

module.exports = rest;
