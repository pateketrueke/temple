var loadPlugins = require('../../helpers/load-plugins');

var tosource = require('tosource');

var postcss;

function compile(params, cb) {
  if (params.next === 'post' || params.next === 'js') {
    postcss = postcss || require('postcss');

    var opts = params.options.postcss || {};

    if (typeof opts !== 'object') {
      opts = {};
    }

    var deps = [];

    opts['postcss-import'] = opts['postcss-import'] || {};
    opts['postcss-import'].onImport = function(files) {
      files.forEach(function(file) {
        if (file !== params.filename && deps.indexOf(file) === -1) {
          deps.push(file);
        }
      });
    };

    opts.from = params.filename;
    opts.to = params.filename;

    postcss(loadPlugins(opts.plugins || [], opts))
      .process(params.source, opts)
      .then(function (result) {
        if (result.messages) {
          // TODO: implements some kind of logging for?
          result.messages.forEach(function(msg) {
            console.warn('[postcss] ' + msg.type  + ': ' + msg.text + ' at ' + params.filename);
          });
        }

        var code = result.css;

        if (params.next === 'js') {
          code = 'function(){return ' + tosource(code) + ';}';
        }

        params.source = code;

        cb(undefined, deps);
      })
      .catch(function(err) {
        cb(err);
      });
  } else {
    cb();
  }
}

module.exports = {
  type: 'template',
  support: ['post', 'css'],
  requires: ['postcss'],
  render: compile,
  compile: compile
};