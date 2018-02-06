#!/usr/bin/env node
if (process.argv.length === 2) {
  console.log();
  console.log('用法：');
  console.log('layapvr texturepacker [OPTIONS]');
  console.log('描述：');
  console.log('texturepacker');
  console.log('   用texturepacker命令行工具，转换图片到PVR ETC1 ETC2压缩格式');
  console.log('   具体帮助信息用 layapvr texturepacker --help 查看。');
  return;
}
if (process.argv.length > 2 && process.argv[2] !== 'texturepacker'){
  console.log('错误： 命令 ' + process.argv[2] + ' 不存在，请重新输入');
}
require('yargs')
  .command(require('./layaPvrCommand'))
  .locale('zh_CN')
  .help()
  .argv
