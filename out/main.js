#!/usr/bin/env node
if (process.argv.length === 2) {
  console.log();
  console.log('用法：');
  return;
}
if (process.argv.length > 2 && process.argv[2] !== 'layapvr'){
  console.log('错误： 命令 ' + process.argv[2] + ' 不存在，请重新输入');
}
require('yargs')
  .command(require('./layaPvrCommand'))
  .locale('zh_CN')
  .help()
  .argv
