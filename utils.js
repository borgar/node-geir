/*
 * helper methods
 */

var mime = require('./mime');


exports.guess_mime_type = function ( msg, fallback ) {
  
  // has what looks like an svg doctype, or starts with what might be an svg tag
  if ( /^\s*<!DOCTYPE\s+(svg|SVG)\s/.test( msg ) || /^\s*<svg\s/.test( msg ) ) {
    return mime.get( 'svg' );
  }
  // has xml header and ends with something that might be a tag...
  if ( /^\s*<\?xml(\s+(version|encoding)=["'].+?["'])\s*\?>/.test( msg ) && />\s*$/.test( msg ) ) {
    return mime.get( 'xml' );
  }
  // has HTML doctype or starts/ends with some semblance of a tag
  if ( /^\s*<!doctype\s+html\s/i.test( msg ) || (/^\s*<!?\w+[\s|>]/.test( msg ) && />\s*$/.test( msg )) ) {
    return mime.get( 'html' );
  }
  return fallback || mime.default;
}


exports.toArray = function ( obj ) {
  var l = obj.length,
      a = new Array( l );
  for ( var i = 0; i < l; ++i ) {
    a[i] = obj[i];
  }
  return a;
}