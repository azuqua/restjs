RestJS
======

Azuqua's lightweight REST client. Internally, uses Node's HTTP and HTTPS modules.

Has only a few responsibilites:
- Takes care of the double-callback confusion with Node's internal `http`
- Supports 'middleware'- that is, functions that are applied to the body of the 
    HTTP response. Currently, only 'middleware.parser' is commonly used, which 
    turns the response to JSON, either by `JSON.parse`-ing, or by using an 
    XML-to-JSON parser.

Example use:
------------

    // Instatiation
    var rest = new RestJS({
          middleware: middlewareStack,
          protocol: 'http'
        });

    // Supports all the node http functions documented at 
    // http://nodejs.org/api/http.html
    // And all the options:
    // http://nodejs.org/api/http.html#http_http_request_options_callback

    var options = 
      {
        "host": "localhost",
        "port": "80",
        "method": "GET"
      }

    rest.request(options, "This is the body!", function(err, data) {
        if (!err)
          console.log(data);
      }
    );
