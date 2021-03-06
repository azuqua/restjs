"use strict";

var async = require('async'),
    qs = require('qs');
function RestWrap(opts) {

  /**
  * Rest module 
  */
  
  function Rest(options) {
    options = options || {};

    this.encoding = options.encoding || 'utf8';
    this.protocol = options.protocol || 'http';
    this.middleware = [];
    this._requestModule = require(this.protocol);

    if (options.middleware) this.middleware = this.middleware.concat(options.middleware); //In case we want default middleware, concat instead of replacing this.middleware
  }

  Rest.middleware = require('../middleware');

  /**
  * Generic REST invocation function
  * Should handle all verbs
  * @param	  {object}	  opts		  options for request
  * @param  	{string}	  body		  body of request
  * @param  	{Function}	callback	function(data) error handling & parseing should be done by module
  */
  Rest.prototype.request = function(opts, body, callback) {
    var self = this,
        middleware = this.middleware,
        callbackArgs = [],
        isDone = false,
        req;

    if (typeof body === 'function') {
      callback = body;
      body = '';
    }

    function finish(err, res) {
      if (isDone) return; //This would only happen if an error occurs AFTER the res has ended...doubtful that would ever happen.

      if (err) {
        callbackArgs[0] = err; //If there's an error and no res, collect it and keep waiting until the 'end' event
      } else {
        isDone = true;
        callbackArgs[1] = res;
      }

      if (!callbackArgs[0] && middleware.length) { //If there isn't already an error and there is middleware, run them
        async.eachSeries(
          middleware,
          function(middlewareItem, fn) {
            middlewareItem(res, fn);
          },
          function(err) {
            if (err) callbackArgs[0] = err;
            callback.apply(null, callbackArgs); //Pass both the err and res to the callback, because often times the body will be just fine despite errors
          }
        );
      } else {
        callback.apply(null, callbackArgs); //Pass both the err and res to the callback, because often times the body will be just fine despite errors
      }
    }
    
    if (typeof body !== 'string') body = JSON.stringify(body);

    //TODO: add headers like encoding

    // default for method is GET
    opts.method = opts.method || "GET";
    // if GET and there's a body, then turn it to a query
    // string and append it to opts.path
    if (opts.method && opts.method.toLowerCase() === 'get' && opts.path && body) {
      try {
        var temp = JSON.parse(body),
            queryString = qs.stringify(temp),
            delimiter = opts.path.indexOf("?") > -1 ? "&" : "?";
        opts.path += delimiter + queryString;
      }
      catch(e) {
        // don't do anything if body isn't an object to be parsed
      }
    }
    
    if(opts.headers && opts.method && opts.method.toLowerCase() === "get"){
        delete opts.headers["Content-Type"];
        delete opts.headers["Content-Length"];
    }

    req = this._requestModule.request(opts, function(res) {
      var data = '';

      res.setEncoding(self.encoding);

      res.on('data', function(d){data+=d;}); //capture data
      res.on('error', finish);
      res.on('end', function() {
        res.body = res.message = data;
        finish(null, res);
      });
    });

    req.on('error', finish);
    if (opts.method && opts.method.toLowerCase() !== 'get') {
      req.write(body);
    }
    req.end();
  };

  return new Rest(opts);
}

module.exports = RestWrap;
