const os = require('os');
const path = require('path');
const {execSync} = require('child_process');
const cliRepl = require('./internal/repl');

const contextPath = path.join(os.homedir(), '.repl-enhance');
const packagePath = path.join(contextPath, 'node_modules');
const reg = /^(?:const|var|let)\s+(\w)\s*=\s*require\(['"](.*)['"]\)[;\s]*$/;

cliRepl.createInternalRepl(process.env, (err, repl) => {
  if (err) throw err;

  repl.context.module.paths.push(packagePath);

  const defaultEval = repl.eval;
  // eslint-disable-next-line no-param-reassign
  repl.eval = function evaluation(cmd, context, filename, callback) {
    const m = cmd
      .split('\n')
      .join(' ')
      .match(reg);
    if (m) {
      install(m[2]);
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
  console.log(contextPath);
  try {
    execSync(`npm i ${pkg}`, {cwd: contextPath, stdio: 'inherit'});
  } catch (e) {
    console.error(e);
  }
}
