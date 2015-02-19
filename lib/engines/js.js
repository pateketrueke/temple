'use strict';

module.exports = function(tarima) {
  tarima.add('js', function(params) {
    var compile = function() {
      var body, tpl;

      if (!/^\s*function\b/.test(params.source)) {
        body = params.source;
      } else {
        body = 'return (' + params.source + ')()';
      }

      tpl = new Function('', body);

      if (!params.chain) {
        return tpl.toString();
      }

      return tpl;
    };

    return compile();
  });
};