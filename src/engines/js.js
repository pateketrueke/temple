
register_engine('js', function(params) {
  var compile = function() {
    var body, fn;

    if (!/^\s*function\b/.test(params.source)) {
      body = 'with(locals_||{}){' + params.source + '}';
    } else {
      body = 'return (' + params.source + ')(locals_)';
    }

    /* jshint evil:true */
    return new Function('locals_', body);
  };

  if ([params.next, params.ext].indexOf('js') > -1) {
    return params.source;
  }

  return compile();
});
