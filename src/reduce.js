
var reduce_tpl = function(params, locals, call) {
  if (!params.parts.length) {
    return params;
  }

  params.options.locals = locals;
  params.type = params.parts.pop();
  params.next = params.parts[params.parts.length - 1];

  if (params.type === 'litcoffee') {
    params.options.literate = true;
    params.type = 'coffee';
  }

  var engine = parsers[params.type],
      injected = util[params.type];

  params.call = call;
  params.next = parsers[params.next || params.ext] ? params.next || params.ext : false;
  params.render = 'function' === typeof engine ? debug_tpl(params, engine)(params, injected) : false;

  if (params.render) {
    params.source = debug_tpl(params, params.render, call)(locals);
    params = reduce_tpl(params, locals);
  }

  return params;
};
