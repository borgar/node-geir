# Geir - A simple node web server layer

Geir is a simple webserver layer for Node.js which pulls out ideas from Djanog and Sinatra. It's experimental, incomplete, undocumented, and not really recommended for production use. 


## Getting it to run:

Include the server:

    var Geir = require('./geir').Server;
    var HttpResponse = require('./geir/http').HttpResponse

Create a new server:

    var geir = new Geir;

Add a view:

    geir.get( /^(.*?)$/, function( request, path ) {
      var r = ['<!DOCTYPE html>',
      '<html lang="en">\n<head>',
      '<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />',
      '<title>You requested</title>',
      '</head>\n<body>',
         '<p>You requested:</p>',
         '<pre>' + path + '</pre>',
      '</body>\n</html>'];
      return new HttpResponse( r.join('\n') );
    });

Start listening to requests:

    geir.listen( 8000 );


## The condensed version:

You can start listening as you create a server:

    var g = new ( require('./geir').Server )( 8000 );

    g.get( '/', function( request ) {
      return '<h1>It works!!<h1>';
    });


### Magic:

Returning strings will make the server perform quick tests to try to determine their nature and tagged text will be served as `text/html`, unless a recognized doctype overrides it (svg and xml are currently supported).  Returning an object will automatically serialize it and serve it as JSON.


### Async:

The HttpResponse object has a delay property, which will allow you to do hand over the data later, in case you're not generating an immediate response:

    g.get( '/', function( request ){

      var response = new HttpResponse( null, 'text/plain', 200 );
      response.delay = true;
      
      var dns = require('dns');
      dns.resolve4('www.google.com', function (err, addresses) {
        if (err) {
          response.status_code = 400;
          response.write( err.message );
          response.flush();
        };
        response.write( 'addresses: ' + JSON.stringify(addresses) );
      });

      return response;

    });


### TODO:

* Static file support
  - A view that may be pointed at a directory that just takes care of it.
  - Built in cacheing of some sort (or detection for the use of)
  - Support for `if-modified-since`, `if-none-match`, `if-range headers`

* POST data support (at least for non-multipart)

* Some way to add custom 404 & 500 handlers

* Better/simpler handling of redirects

