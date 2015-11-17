"use strict";

var xml2js = require('xml2js'),
    findType = /(.+\/[^;]+)/;

//Make JSON.parse async
function parseJSON(_str, callback) {
  var parsed, err;
  try {
    parsed = JSON.parse(_str);
  } catch (e) {
    var str = _str.trim();
    if(str === "") {
      parsed = {};
    } else {
      err = e;
    }
  }
  callback(err, parsed);
}

var unsupportedCodes = {
  204: true
};

var supportedParsers = {
  'application/json': parseJSON,
  'text/json': parseJSON,
  'text/x-json': parseJSON,
  'application/xml': xml2js.parseString,
  'text/xml': xml2js.parseString,
  'application/atom+xml': xml2js.parseString
};

module.exports = function parser(res, next) {
  //Check headers before performing parse
  if(unsupportedCodes[res.statusCode]) return next();

  var matchedContentType = (res.headers['content-type'] || '').match(findType),
      parserLib;

  if (!(matchedContentType && (parserLib = supportedParsers[matchedContentType[0]]))) return next();

  parserLib(res.body, function(err, parsed) {
    res.parsedBody = parsed;
    next(err); //If there's an error, it will be passed to the callback
  });
};
