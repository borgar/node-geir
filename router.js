/* 
 * router 
 */

var mime = require('./mime'),
    http = require('./http'),
    utils = require('./utils'),
    HttpResponse = http.HttpResponse,
    HttpRequest = http.HttpRequest,
    HttpResponseNotFound = http.HttpResponseNotFound;
    HttpResponseServerError = http.HttpResponseServerError;


function Router () {
  this._routes = {
    'DELETE': [],
    'GET':    [],
    'HEAD':   [],
    'POST':   [],
    'PUT':    [],
  };
}
Router.prototype = {
  
  LOGGING: true,
  
  add: function ( method, path, opts, handler ) {
    if ( arguments.length === 3 || handler === undefined ) {
      handler = opts;
      opts = null;
    }
    if ( typeof path === 'string' ) { // escape regexp control chars & compile expression
      path = new RegExp( '^(' + path.replace( /[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&" ) + ')' );
    }
    if ( typeof path !== 'function' || !('exec' in path) ) {
      throw new TypeError( 'Invalid expression passed to handler' );
    }
    this._routes[ method ].push({
      path: path,
      opts: opts || {},
      handler: handler,
    });
  },

  route: function ( req, res ) {
    
    var routes = this._routes[ req.method ] || [];
    var request = new HttpRequest( req );
    var response = null;

    // try to match a handler to this request
    for ( var i=0,l=routes.length; i<l; i++ ) {

      var route = routes[i];
      var url_match = route.path.exec( request.path );

      if ( url_match ) {
        try {
          var arg = [ request ].concat( utils.toArray( url_match ).slice(1) );
          response = route.handler.apply( {}, arg );

          if ( typeof response === 'string' || typeof response === 'number' ) {
            response = new HttpResponse( response, utils.guess_mime_type( response, mime.get('txt') ), 200 );
          }
          // else if ( _re instanceof Buffer ) { break; }
          else if ( typeof response === 'object' && !(response instanceof HttpResponse) ) {
            response = new HttpResponse( JSON.stringify( response ), mime.get('json'), 200 );
          }
          
          if ( response instanceof HttpResponse ) {
            break;
          }
          else {
            response = null;
            throw TypeError( "The handler did not return a usable response (string, object, or HttpResponse)." );
          }

        }
        catch ( err ) {
          // if view threw a Http Exception then keep scanning ...
          if ( err instanceof HttpResponse ) {
            response = err;
          }
          else {
            // FIXME: do a better job at showing errors (stack)
            // TODO: make error exposure configurable
            response = new HttpResponseServerError( err.name + ': ' + err.message );
            if ( this.LOGGING ) {
              ;;;console.log( err.stack );
            }
          }
          break;
        }
      }
    }

    // nothing matched... respond with a 404
    if ( !response ) {
      response = new HttpResponseNotFound( 'Nothing matched your request.' );
    }

    if ( this.LOGGING ) {
      var size = 0;
      try {
        size = Buffer.byteLength( response.content );
      }
      catch (x) {}
      console.log(
          '[' + new Date().toUTCString().replace(/(^\S+\s|\s\S+$)/g,'') + ']', // remove weekday, timezone
          req.method, request.path,
          "HTTP/" + req.httpVersion,
          response.status_code,
          size
      );
    }
    
    // if response is marked delayed, then we'll hold of until it emits data 
    if ( response.delay ) {
      // TODO: fix this so that it maps to write/flush/end ...
      // FIXME: add a timeout!
      response.on('end', function ( data ) {
         res.writeHead( response.status_code, HttpResponse.get_headers( response ) );
         res.end( response.content );
      });
    }
    else {
      res.writeHead( response.status_code, HttpResponse.get_headers( response ) );
      res.end( response.content );
    }

  },
  
};

exports.Router = Router;
