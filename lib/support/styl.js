var styl;

function render(params, cb) {
  styl = styl || require('styl');

  cb(null, {
    out: styl(params.code).toString()
  });
}

module.exports = {
  ext: 'css',
  type: 'template',
  support: ['styl'],
  required: ['styl'],
  render: render,
  compile: render
};