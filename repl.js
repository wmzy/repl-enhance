#!/usr/bin/env node

const os = require('os');
const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');
const util = require('util');
const rmdir = require('rimraf');
const cliRepl = require('./internal/repl');

const debug = util.debuglog('repl-enhance');

const contextPath = path.join(os.homedir(), '.repl-enhance');
const packageJSONPath = path.join(contextPath, 'package.json');
const packagePath = path.join(contextPath, 'node_modules');
const reg = /^(?:const|var|let)\s+(\w)\s*=\s*require\(['"]([^./].*)['"]\)[;\s]*$/;

function noop() {}

module.paths.push(packagePath);

let packageJSON = {
  private: true,
  dependencies: {}
};

try {
  // eslint-disable-next-line global-require, import/no-dynamic-require
  packageJSON = require(packageJSONPath);
} catch (e) {
  fs.mkdir(contextPath, () => {
    fs.writeFile(packageJSONPath, JSON.stringify(packageJSON), noop);
  });
}

cliRepl.createInternalRepl(process.env, (err, repl) => {
  if (err) throw err;

  repl.defineCommand('clean', {
    help: 'remove all cached packages',
    action: clean
  });
  repl.defineCommand('update', {
    help: 'update [package]\n\t\tupdate cached packages',
    action: update
  });

  Object.keys(packageJSON.dependencies).forEach(dep => {
    if (!repl.context[dep]) {
      // eslint-disable-next-line no-param-reassign, global-require, import/no-dynamic-require
      repl.context[dep] = require(dep);
    }
  });

  repl.context.module.paths.push(packagePath);

  const defaultEval = repl.eval;
  // eslint-disable-next-line no-param-reassign
  repl.eval = function evaluation(cmd, context, filename, callback) {
    const m = cmd
      .split('\n')
      .join(' ')
      .match(reg);
    if (m) {
      const pkg = m[2];
      try {
        require.resolve(pkg);
      } catch (e) {
        install(pkg);
      }
    }
    defaultEval(cmd, context, filename, callback);
  };
  repl.on('exit', () => {
    // eslint-disable-next-line no-underscore-dangle
    if (repl._flushing) {
      repl.pause();
      return void repl.once('flushHistory', () => process.exit());
    }
    process.exit();
  });
});

function install(pkg) {
  try {
    execSync(`npm i ${pkg}`, {cwd: contextPath, stdio: 'inherit'});
  } catch (e) {
    debug(e.stack);
  }
}

function clean() {
  rmdir(contextPath, noop);
  this.displayPrompt();
}

function update(pkg) {
  try {
    execSync(`npm update ${pkg}`, {cwd: contextPath, stdio: 'inherit'});
  } catch (e) {
    debug(e.stack);
  }
  this.displayPrompt();
}
