
function Partial(params) {
  this.params = params;
}

Partial.prototype.compile = function(locals) {
  var partial = reduce_tpl(_.cloneDeep(this.params), locals),
      view = partial.render || partial.source;

  return 'string' !== typeof view ? toSource(view, null, 0) : view;
};

Partial.prototype.render = function(locals) {
  var partial = reduce_tpl(_.cloneDeep(this.params), locals, true),
      view = 'function' === typeof partial.render ? partial.render(locals) : partial.source;

  return view;
};