/*
 * Cookie abstracion class.
 */

function Cookie ( name, value, options ) {
  this.name = name;
  this.value = value;
  var options = arguments[ arguments.length -1 ];
  if ( Object(options) === options ) {
    for ( var key in options ) {
      this[key] = options[key];
    }
  }
}

Cookie.prototype = {
  
  toString: function () {

    var r = [ escape( this.name ) + '=' + escape( this.value ) ];

    if ( this.expires ) {
      r.push( 'expires=' + new Date( this.expires ).toUTCString() );
    }

    this.max_age = parseInt( this.max_age || this['max-age'] || 0, 10 );
    if ( this.max_age ) {
      // MSIE (up to and including 8) has problems with Max-Age...
      // therefore expires is set as well and better browsers can override it
      if ( !this.expires ) {
        r.push( 'expires=' + new Date(  Date.now() + ( this.max_age * 1000 ) ).toUTCString() );
      }
      r.push( 'max-age=' + new Date( this.expires ).toUTCString() );
    }

    for ( var v, k, a = ['path','domain','secure']; a.length; k = a.shift() ) if ( this[k] ) {
      r.push( k + ( (this[k] === true) ? '' : '=' + this[k] ) );
    }

    return r.join( '; ' );
  },
  
  
}

exports.Cookie = Cookie;
