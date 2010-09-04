/*
 * HttpRequest wrapper class - mimicks Django's HttpRequest class
 */

var Cookie = require('./cookie').Cookie;

exports.HttpRequest = HttpRequest;
exports.HttpResponse = HttpResponse;
exports.HttpResponsePermanentRedirect = HttpResponsePermanentRedirect;
exports.HttpResponseRedirect = HttpResponseRedirect;
exports.HttpResponseNotModified = HttpResponseNotModified;
exports.HttpResponseBadRequest = HttpResponseBadRequest;
exports.HttpResponseNotFound = HttpResponseNotFound;
exports.HttpResponseForbidden = HttpResponseForbidden;
exports.HttpResponseNotAllowed = HttpResponseNotAllowed;
exports.HttpResponseGone = HttpResponseGone;
exports.HttpResponseServerError = HttpResponseServerError;

exports.DEFAULT_CONTENT_TYPE = 'text/html';

/*
 * HttpRequest wrapper class - mimicks Django's HttpRequest class
 */

function HttpRequest ( request ) {
  
  Object.defineProperty(this, '_request', { value: request, enumerable: false, });

  this._request = request;
  var url = require('url').parse( request.url, true );

  this.path = url.pathname;
  this.method = request.method.toUpperCase();
  this.GET = url.query;
  this.POST = {};
  this.META = {};

  var cookies = this.COOKIES = {};
  if ( 'cookie' in request.headers ) {
    request.headers.cookie.split(';').forEach(function( cookie ) {
      var parts = cookie.trim().split(/\s*=\s*/);
      cookies[ parts[ 0 ] ] = parts[ 1 ] || '';
    });
  }

  for ( var key in request.headers ) {
    var k = key.toUpperCase().replace( /-/g, '_' );
    if ( /^CONTENT_(LENGTH|TYPE)$/.test( k ) ) {
      this.META[ k ] = request.headers[ key ];
    }
    else {
      this.META[ 'HTTP_' + k ] = request.headers[ key ];
    }
  }

}
HttpRequest.prototype = {
  
  get_host: function () {
    // SERVER_NAME and SERVER_PORT
    return this.META['HTTP_X_FORWARDED_HOST'] || this.META['HTTP_HOST'] || null; // "127.0.0.1:8000" ?
  },
  
  get_full_path: function () {
    return this._request.url;
  },

  is_ajax: function () {
    return this.META['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest';
  },

}



/*
 * HttpRequest wrapper class - mimicks Django's HttpRequest class
 *
 * Except for the content_type which is redundant (because this doesn't support any encoding other than utf-8)
 *
 */

function HttpResponse ( content, mime, status ) {
  
  this.content = content ? String( content ) : '';

  if ( arguments.length === 2 && Object(mime) === mime ) {
    for ( key in mime ) { this[ key ] = mime; }
  }
  else if ( arguments.length === 2 && typeof mime === 'number' ) {
    this.status_code = mime;
  }
  else {
    if ( arguments.length > 1 ) { this.mimetype = mime; }
    if ( arguments.length > 2 ) { this.status_code = status; }
  }
  
  this._jar = [];
  
}
var EventEmitter = require('events').EventEmitter;

HttpResponse.prototype = new EventEmitter;
HttpResponse.prototype.content = '';
HttpResponse.prototype.mimetype = null;
HttpResponse.prototype.status_code = 200;
HttpResponse.prototype.delay = false;

HttpResponse.prototype.__defineGetter__('content_type', function() {
  var content_type = this.mimetype || exports.DEFAULT_CONTENT_TYPE;
  return content_type + "; charset=utf-8";
});

// Returns True or False based on a case-insensitive check for a header with the given name.
HttpResponse.prototype.has_header = function ( header ) {
  if ( /^(_|(content(_type)?|mimetype|delay|status_code)$)/i.test( header ) ) {
    return false;
  }
  header = header.toLowerCase();
  for ( var key in this ) {
    if ( key.toLowerCase() == header && typeof this[key] === 'string' ) { return true; }
  }
  return false;
};

// Sets a cookie
HttpResponse.prototype.set_cookie = function ( key, value, max_age, expires, path, domain, secure ) {
  var options = max_age;
  if ( Object( options ) !== options ) {
    options = {
      max_age: max_age || null,
      expires: expires || null,
      path:    path    || '/',
      domain:  domain  || null,
      secure:  secure  || null,
    };
  }
  this._jar.push( new Cookie( key, value, options ) );
};

// Deletes the cookie with the given key. Fails silently if the key doesn't exist.
HttpResponse.prototype.delete_cookie = function ( key, path, domain ) {
  this.set_cookie( key, path, domain, null, new Date(0) );
};

HttpResponse.prototype.write = function ( content ) {
  this.content += String( content );
};
HttpResponse.prototype.flush = function ( content ) {
  if ( content ) {
    this.content += String( content );
  }
  this.emit( 'end', this.content );
};
// HttpResponse.prototype.tell: function ( content ) {};


// helper function to safely extract all headers from a HttpResponse
HttpResponse.get_headers = function ( response ) {
  var headers = [];

  headers.push([ 'Content-Type', response.content_type ]);

  // add a content-length
  // TODO: if response.content is a Buffer then we need to get it's length correctly
  var size = 0;
  if ( typeof response.content === 'string' ) {
    size = Buffer.byteLength( response.content );
  }
  else if ( 'length' in response.content ) {
    size = response.content.length;
  }
  headers.push([ 'Content-Length', size ]);

  // add any other headers found
  for ( var header in response ) {
    var val = response[ header ];
    if ( /^(_|(content(_type)?|mimetype|delay|status_code)$)/i.test( header ) || 
         !( typeof val === 'string' || typeof val === 'number' ) ) {
      continue;
    }
    if ( /[^\x20-\x7f]/.test( String( val ) ) ) {
      throw new ValueError( 'HTTP response headers must be in US-ASCII format and not include linebreaks' );
    }
    headers.push([ header, String( val ) ]);
  }
  
  // finally, add cookies
  if ( response._jar ) {
    response._jar.forEach(function ( cookie ) {
      headers.push([ 'Set-Cookie', cookie.toString() ]);
    });
  }
  
  return headers;
};



/* 
 * error subclasses
 */

function HttpResponsePermanentRedirect ( url ) {
  this.status_code = 301;
  this['Location'] = encodeURI(url);
}
HttpResponsePermanentRedirect.prototype = new HttpResponse();


function HttpResponseRedirect ( url ) {
  this.status_code = 302;
  this['Location'] = encodeURI(url);
}
HttpResponseRedirect.prototype = new HttpResponse();


function HttpResponseNotModified () {
  this.status_code = 304;
}
HttpResponseNotModified.prototype = new HttpResponse();


function HttpResponseBadRequest ( content ) {
  this.content = content || '';
  this.status_code = 400; 
}
HttpResponseBadRequest.prototype = new HttpResponse();


function HttpResponseForbidden ( content ) {
  this.content = content || '';
  this.status_code = 403; 
}
HttpResponseForbidden.prototype = new HttpResponse();


function HttpResponseNotFound ( content ) {
  this.content = content || '';
  this.status_code = 404; 
}
HttpResponseNotFound.prototype = new HttpResponse();


function HttpResponseNotAllowed ( permitted_methods ) {
  this.status_code = 405;
  this['Allow'] = permitted_methods.join(', ')
}
HttpResponseRedirect.prototype = new HttpResponse();


function HttpResponseGone ( content ) {
  this.content = content || '';
  this.status_code = 410; 
}
HttpResponseRedirect.prototype = new HttpResponse();


function HttpResponseServerError ( content ) {
  this.content = content || '';
  this.status_code = 500; 
}
HttpResponseRedirect.prototype = new HttpResponse();



