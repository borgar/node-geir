/*
 * Geir front face
 *
 */

var Router = require('./router').Router,
    http   = require('http');

/* * */

exports.version = 0.2;
exports.Server = Server;

/* * */

function Server ( port ) {
  var self = this;
  this._router = new Router();
  this._server = http.createServer(function ( req, res ) {
    self._router.route( req, res );
  });
  if ( port ) {
    this.listen( port );
  }
}
Server.prototype = {

  port: 80,

  get LOGGING () {
    return !!this._router.LOGGING;
  },
  set LOGGING ( val ) {
    return this._router.LOGGING = !!val;
  },

  get: function ( path, opts, handler ) {
    this._router.add( 'HEAD', path, opts, handler );
    this._router.add( 'GET',  path, opts, handler );
    return this;
  },

  post: function ( path, opts, handler ) {
    this._router.add( 'POST', path, opts, handler );
    return this;
  },

  put: function ( path, opts, handler ) {
    this._router.add( 'PUT',  path, opts, handler );
    return this;
  },

  del: function ( path, opts, handler ) {
    this._router.add( 'DELETE', path, opts, handler );
    return this;
  },
  
  listen: function ( port ) {
    if ( port ) {
      this.port = port;
    }
    this._server.listen( this.port );
    console.log( 'Server started: http://127.0.0.1:' + port + '/.');
    return this;
  },
  
};
Server.prototype['delete'] = Server.prototype['del'];

