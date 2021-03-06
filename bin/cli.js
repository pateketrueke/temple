#!/usr/bin/env node

'use strict';

/* eslint-disable global-require */
/* eslint-disable no-nested-ternary */

const path = require('path');
const wargs = require('wargs');

// common helpers
const die = process.exit.bind(process);

const $ = require('./lib/utils'); // eslint-disable-line

const DEFAULTS = {
  public: 'public',
  output: 'build',
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
};

let _;

try {
  _ = wargs(process.argv.slice(2), {
    boolean: 'sdqvVmdfhMUACI',
    default: DEFAULTS,
    alias: {
      M: 'esm',
      U: 'umd',
      A: 'amd',
      C: 'cjs',
      I: 'iife',
      S: 'no-serve',
      i: 'include',
      s: 'sources',
      b: 'bundle',
      a: 'alias',
      q: 'quiet',
      W: 'public',
      O: 'output',
      e: 'env',
      h: 'help',
      c: 'config',
      v: 'version',
      V: 'verbose',
      x: 'exclude',
      l: 'plugins',
      r: 'reloader',
      w: 'watching',
      d: 'debug',
      f: 'force',
      y: 'only',
      p: 'port',
      P: 'proxy',
      R: 'rename',
      G: 'globals',
      E: 'extensions',
    },
  });
} catch (e) {
  $.errLog(`${e.message || e.toString()} (add --help for usage info)`);
  die(1);
}

// nice logs!
const _level = _.flags.verbose ? 'verbose' : _.flags.debug ? 'debug' : 'info';

const logger = require('log-pose')
  .setLevel((_.flags.quiet && !_.flags.version && !_.flags.help) ? false : _level)
  .getLogger(12, process.stdout, process.stderr);

if (_.flags.debug && _.flags.verbose) {
  require('debug').enable('*'); // eslint-disable-line
  require('log-pose').setLevel(false); // eslint-disable-line
}

// local debug
const debug = require('debug')('tarima');

const thisPkg = require(path.join(__dirname, '../package.json'));

_.flags.env = (_.flags.env !== true ? _.flags.env : '') || 'development';

// defaults
process.name = 'tarima';

process.env.NODE_ENV = _.flags.env;

const gitDir = path.join(__dirname, '../.git');

logger.printf('{% green %s v%s %} {% gray (node %s - %s%s) %}\n',
  thisPkg.name,
  thisPkg.version,
  process.version, $.isDir(gitDir) ? 'git:' : '', process.env.NODE_ENV);

debug('v%s - node %s%s', thisPkg.version, process.version);

if (_.flags.version) {
  die();
}

const _bin = Object.keys(thisPkg.bin)[0];

if (_.flags.help) {
  logger.write(`
Usage:
  ${_bin} [watch] ...

Examples:
  ${_bin} app/assets js:es6 css:less
  ${_bin} src/**/*.js API_KEY=*secret* PORT=3000
  ${_bin} watch lib -R "**/*:{basedir/1}/{fname}" -R "**/mock:{basedir/2}/api/{fname}"

Options:
  -e, --env         Customization per environment (e.g. -e production)

  -O, --output      Destination for generated files
  -W, --public      Public directory for serving assets
  -c, --config      Use configuration file (e.g. -c ./config.js)
                    You may also specify a suffix, e.g. -c DEV will map to ./tarima.DEV.{js,json}

  -l, --plugins     Shorthand option for loading plugins (e.g. -l tarima-bower -l talavera)
  -i, --include     Additional folder(s) to include on bundles (e.g. -i web_modules,app/modules)

  -p, --port        Port used for live-server
  -h, --host        Host to bind the live-server
  -P, --proxy       Proxy requests (e.g. -P ROUTE:URL)
  -S, --no-serve    Disable live-server during watch mode
      --serve       Additional directories to mount (mmultiple)
      --no-browser  Do not launch the default browser
      --browser     Custom browser name to launch
      --middleware  Add a middleware handler
      --entry-file  Serve this one on missing files
      --spa         Enable /abc to /#/abc translation for SPAs
      --wait        Milliseconds to wait before reloading
      --cors        Enable CORS for any origin

  -f, --force       Force rendering/bundling of all given sources
  -a, --alias       Enable custom aliasing for bundling (e.g. -a x:./src/y.js)
  -b, --bundle      Scripts matching this will be bundled (e.g. -b "**/main/*.js")
  -s, --sources     Save generated sourceMaps as .map files alongside outputted files

  -M, --esm         Save bundles as ESM
  -U, --umd         Save bundles as UMD wrapper
  -A, --amd         Save bundles as AMD wrapper
  -C, --cjs         Save bundles as CommonJS wrapper
  -I, --iife        Save bundles as IIFE wrapper (default)

  -q, --quiet       Minimize output logs
  -d, --debug       Enable debug mode when transpiling
  -V, --verbose     Enable verbose logs (use for trouble-shooting)

  -y, --only        Filter out non-matching sources using src.indexOf("substr")
  -x, --exclude     Filter out sources using globs (e.g. -x test/broken -x .coffee)

                    Exclude patterns:
                      - *foo     -> !*foo
                      - .bar     -> !**/*.bar
                      - x.y      -> !**/x.y
                      - foo      -> !**/foo/**
                      - foo/bar  -> !**/foo/bar/**

  -r, --reloader    Load module for reset stuff on changes (e.g. -r bin/server)
  -w, --watching    Append additional directories for watch (e.g. -w _src -w bin)

  -E, --extensions  Enable hidden extensions (e.g. -E .es6.js -E .post.css -E .js.hbs.pug)
  -G, --globals     Shorthand for global variables (e.g. -G FOO=BAR -G AKI_PEY=xyz)
  -R, --rename      Custom naming expressions (e.g. -R "**/*:{basedir/1}/{fname}")

`);
  die(1);
}

function _debug(e) {
  return (_.flags.verbose && e.stack) || e.toString();
}

const run = (opts, cb) => {
  const _runner = require('./lib');

  debug('settings %s', JSON.stringify(opts, null, 2));

  // delay once resolver loads
  process.nextTick(() => {
    try {
      _runner(opts, logger, cb);
    } catch (e) {
      $.errLog(_debug(e));
      die(1);
    }
  });
};

const { spawn } = require('child_process'); // eslint-disable-line

// empty dummy
let mainPkg = {};

const cwd = process.cwd();
const pkg = path.join(cwd, 'package.json');

// load .env
const env = require('dotenv').config(); // eslint-disable-line

if (env.error && env.error.code !== 'ENOENT') {
  $.errLog(env.error);
  die(1);
}

delete env.error;

if ($.isFile(pkg)) {
  debug('config %s', pkg);

  mainPkg = $.readJSON(pkg);
}

let isWatching = false;

if (_._[0] === 'watch') {
  isWatching = true;
  _._.shift();
}

const _src = _._;

const defaultConfig = {
  cwd,
  watch: isWatching,
  serve: _.flags.serve,
  force: _.flags.force === true,
  bundle: $.toArray(_.flags.bundle),
  plugins: $.toArray(_.flags.plugins),
  watching: $.toArray(_.flags.watching),
  rename: $.toArray(_.flags.rename),
  from: _src,
  output: _.flags.output || DEFAULTS.output,
  public: _.flags.public || DEFAULTS.public,
  cacheFile: '.tarima',
  filter: [],
  notifications: {
    title: mainPkg.name || path.basename(cwd),
    okIcon: path.join(__dirname, 'ok.png'),
    errIcon: path.join(__dirname, 'err.png'),
  },
  bundleOptions: {
    paths: $.toArray(_.flags.include),
    globals: _.data,
    extensions: _.params,
  },
  flags: _.flags,
  reloader: _.flags.reloader,
  liveServer: {
    port: _.flags.port,
    host: _.flags.host,
    proxy: _.flags.proxy,
    spa: _.flags.spa,
    wait: _.flags.wait,
    cors: _.flags.cors,
    file: _.flags.entryFile,
    middleware: _.flags.middleware,
    open: _.flags.browser !== false,
    browser: _.flags.browser,
  },
};

// apply package settings
try {
  const pkgInfo = mainPkg.tarima || {};

  // normalize some inputs per-environment
  ['from', 'ignore', 'bundle', 'rename'].forEach(key => {
    if (pkgInfo[key] && !(typeof pkgInfo[key] === 'string' || Array.isArray(pkgInfo[key]))) {
      pkgInfo[key] = (pkgInfo[key].default || []).concat(pkgInfo[key][_.flags.env] || []);
    }
  });

  if (defaultConfig.serve === false) {
    delete pkgInfo.serve;
  }

  $.merge(defaultConfig, pkgInfo);
} catch (e) {
  $.errLog(`Configuration mismatch: ${_debug(e)}`);
  die(1);
}

// support for tarima.CONFIG.{js,json}
let configFile = _.flags.config === true ? 'config' : _.flags.config;

if (configFile && configFile.indexOf('.') === -1) {
  const fixedConfig = path.join(cwd, `tarima.${configFile}`);

  [`${fixedConfig}.js`, `${fixedConfig}.json`].forEach(file => {
    if ($.isFile(file)) {
      configFile = file;
    }
  });
}

if (configFile) {
  if (!$.isFile(configFile)) {
    logger.info('\r{% fail Missing file: %s %}\n', configFile);
    die(1);
  }

  logger.info('{% log Loading settings from %s %}\n', path.relative(cwd, configFile));

  debug('config %s', configFile);

  $.merge(defaultConfig, require(path.resolve(configFile)));
}

// normalize extensions
$.merge(defaultConfig.bundleOptions.extensions, defaultConfig.extensions || {});

const rollupConfig = defaultConfig.bundleOptions.rollup = defaultConfig.bundleOptions.rollup || {};

// setup rollup format
if (_.flags.es || _.flags.esm) {
  rollupConfig.format = 'esm';
}

if (_.flags.umd) {
  rollupConfig.format = 'umd';
}

if (_.flags.amd) {
  rollupConfig.format = 'amd';
}

if (_.flags.cjs) {
  rollupConfig.format = 'cjs';
}

if (_.flags.iife) {
  rollupConfig.format = 'iife';
}

// enable dynamic aliasing based on environment!
if (rollupConfig.aliases) {
  Object.assign(rollupConfig.aliases, rollupConfig.aliases.default);
  Object.keys(rollupConfig.aliases).forEach(key => {
    if (typeof rollupConfig.aliases[key] === 'object') {
      if (key === _.flags.env) {
        Object.assign(rollupConfig.aliases, rollupConfig.aliases[key]);
      }
      delete rollupConfig.aliases[key];
    }
  });
}

// additional aliases from given flags
$.toArray(_.flags.alias).forEach(test => {
  const [from, to] = test.split(':');

  rollupConfig.aliases = rollupConfig.aliases || {};
  rollupConfig.aliases[from] = to;
});

delete defaultConfig.extensions;

function fixedValue(string) {
  if (/^-?\d+(\.\d+)?$/.test(string)) {
    return parseFloat(string);
  }

  const values = {
    true: true,
    false: false,
  };

  if (typeof values[string] !== 'undefined') {
    return values[string];
  }

  return string || null;
}

if (_.flags.only) {
  const test = $.toArray(_.flags.only);

  debug('--only %s', test.join(' '));

  defaultConfig.filter.push(value => {
    value = path.relative(cwd, value);

    for (let i = 0; i < test.length; i += 1) {
      if (value.indexOf(test[i]) > -1) {
        return true;
      }
    }
  });
}

if (_.flags.exclude) {
  const test = $.toArray(_.flags.exclude);

  debug('--exclude %s', test.join(' '));

  test.forEach(skip => {
    if (skip.indexOf('*') > -1) {
      defaultConfig.filter.push(`!${skip}`);
    } else if (skip.substr(0, 1) === '.') {
      defaultConfig.filter.push(`!**/*${skip}`);
    } else if (skip.indexOf('.') > -1) {
      defaultConfig.filter.push(`!**/${skip}`);
    } else {
      defaultConfig.filter.push(`!**/${skip}/**`);
    }
  });
}

// apply globals first
const _globals = defaultConfig.globals || defaultConfig.env || {};

$.merge(env, _globals);
$.merge(env, _globals[_.flags.env] || {});

// merge only ENV_VARS_IN_CAPS
Object.keys(process.env).forEach(key => {
  if (/^[A-Z][A-Z\d_]*$/.test(key) && typeof env[key] === 'undefined') {
    env[key] = process.env[key];
  }
});

// package info
defaultConfig.bundleOptions.locals = defaultConfig.bundleOptions.locals || {};
defaultConfig.bundleOptions.locals.env = env;
defaultConfig.bundleOptions.locals.pkg = mainPkg;

Object.keys(env).forEach(key => {
  defaultConfig.bundleOptions.globals[key] = env[key];
});

if (_.flags.globals) {
  const test = $.toArray(_.flags.globals);

  debug('--globals %s', test.join(' '));

  test.forEach(value => {
    const parts = value.split('=');

    defaultConfig.bundleOptions.globals[parts[0]] = fixedValue(parts[1]);
  });
}

if (_.flags.extensions) {
  const test = $.toArray(_.flags.extensions);

  debug('--extensions %s', test.join(' '));

  test.forEach(exts => {
    const parts = exts.replace(/^\./, '').split('.').reverse();

    defaultConfig.bundleOptions.extensions[parts.shift()] = parts;
  });
}

defaultConfig.bundleOptions.compileDebug = _.flags.debug;
defaultConfig.bundleOptions.verboseDebug = _.flags.verbose;

if (_.flags.sources) {
  defaultConfig.bundleOptions.sourceMaps = true;
  defaultConfig.bundleOptions.sourceMapFiles = true;
}

const isDev = process.env.NODE_ENV === 'development' && isWatching;

const cmd = _.raw || [];

let child;

function infoFiles(result) {
  if (isDev && result.output.length) {
    $.notify(`${result.output.length} file${result.output.length !== 1 ? 's' : ''}\n${result.output.slice(0, 3).join(', ')}`,
      defaultConfig.notifications.title,
      defaultConfig.notifications.okIcon);
  }

  if (!isWatching) {
    if (!result.output.length) {
      logger.printf('\r\r{% end Without changes %}\n');
    } else {
      logger.printf('\r\r{% end %s file%s written %}\n',
        result.output.length,
        result.output.length !== 1 ? 's' : '');
    }
  }
}

function exec(onError) {
  function restart() {
    // restart
    if (child) {
      child.kill('SIGINT');
    }

    const _cmd = cmd
      .map(arg => (arg.indexOf(' ') === -1 ? arg : `"${arg}"`)).join(' ');

    logger.printf('\r\r{% gray $ %s %}\r\n', _cmd);

    debug('exec %s', _cmd);

    child = spawn(cmd[0], cmd.slice(1), {
      cwd: defaultConfig.cwd || defaultConfig.output,
      detached: true,
    });

    child.stdout.pipe(process.stdout);

    const errors = [];

    child.stderr.on('data', data => {
      const line = data.toString().trim();

      if (line) {
        errors.push(line);
      }
    });

    child.on('close', exitCode => {
      let message = `${_cmd}\n— `;
      let icon = defaultConfig.notifications.okIcon;

      if (exitCode || errors.length) {
        icon = defaultConfig.notifications.errIcon;
        message += 'Error';
      } else {
        message += 'Done';
      }

      $.notify(message, defaultConfig.notifications.title, icon);

      debug('exec %s - %s', exitCode, _cmd);

      if (errors.length) {
        $.errLog(errors.join('\n'));
        onError({ msg: errors.join('\n') });
      }

      if (exitCode && !isDev) {
        die(exitCode);
      }

      if (!isDev) {
        die();
      }
    });
  }

  return restart;
}

process.on('SIGINT', () => {
  logger.printf('\r\r');

  if (child) {
    child.kill('SIGINT');
  }

  die();
});

let _restart;

process.nextTick(() => {
  if (!logger.isEnabled() && !(_.flags.debug && _.flags.verbose)) {
    process.stdout.write('\rProcessing sources...\r');
  }

  const start = Date.now();

  run(defaultConfig, function done(err, result) {
    if (err) {
      debug('failed %s', err);

      if (_.flags.quiet && err.filename) {
        $.errLog(`Failed source ${err.filename}`);
      }

      $.errLog(_debug(err));

      if (!isWatching) {
        die(1);
      }

      return;
    }

    if (!logger.isEnabled() && !(_.flags.debug && _.flags.verbose)) {
      process.stdout.write(`\r${result.output.length} file${
        result.output.length === 1 ? '' : 's'
      } ${result.output.length === 1 ? 'was' : 'were'} built in ${
        (Date.now() - start) / 1000
      }s\n`);
    }

    debug('done %s file%s added',
      result.output.length,
      result.output.length === 1 ? '' : 's');

    infoFiles(result);

    if (cmd.length) {
      _restart = _restart || exec(this.emit.bind(null, 'error'));
      _restart();
      return;
    }

    if (isDev) {
      logger.printf('\r\r{% log Waiting for changes... %} {% gray [press CTRL-C to quit] %}\r');
      return;
    }

    if (!_.flags.reloader) {
      die();
    }
  });
});

// clean exit
process.on('exit', exitCode => {
  if (!isDev && !exitCode) {
    logger.write('\r\n');
  }
});

logger.info('{% log Output to: %} {% yellow %s %}\n', path.relative(cwd, defaultConfig.output) || '.');

logger.info('{% log Reading from %} {% yellow %s %} {% gray source%s %}\n',
  defaultConfig.from.length,
  defaultConfig.from.length === 1 ? '' : 's');

if (isWatching && defaultConfig.watching.length) {
  logger.info('{% log Watching from %} {% yellow %s %} {% gray source%s %}\n',
    defaultConfig.watching.length,
    defaultConfig.watching.length === 1 ? '' : 's');
}
