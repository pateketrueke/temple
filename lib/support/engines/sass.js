function render(params, cb) {
  if (params.next && params.next !== 'css') {
    return cb();
  }

  var opts = params.options.sass || {};
  var sass = this.nodeSass;

  sass.render({
    file: params.filename,
    data: params.source,
    indentedSyntax: params.filename.indexOf('.sass') > -1,
    includePaths: opts.includePaths || [],
    outputStyle: opts.outputStyle || 'compact'
  }, function(error, result) {
    if (error) {
      cb(error);
    } else {
      params.source = result.css.toString();
      cb(undefined, result.stats.includedFiles);
    }
  });
}

module.exports = {
  ext: 'css',
  type: 'template',
  support: ['sass', 'scss'],
  requires: ['node-sass'],
  render: render,
  compile: render
};