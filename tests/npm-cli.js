'use strict';
/* Run npm through its JS CLI so Windows hosts do not need an executable shim. */
const cp=require('node:child_process'),path=require('node:path');
const cli=process.env.npm_execpath||path.join(path.dirname(process.execPath),'node_modules','npm','bin','npm-cli.js');
function runNpm(args,options){
  if(!cli||!require('node:fs').existsSync(cli))throw Error('Cannot locate npm CLI; run tests with npm test');
  return cp.execFileSync(process.execPath,[cli,...args],options);
}
module.exports={runNpm,cli};
