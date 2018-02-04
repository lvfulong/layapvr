const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const os = require('os');
const assert = require('assert');

exports.command = 'layapvr'
exports.describe = 'laya纹理压缩工具'

export var builder = {
  inputdir:
  {
    alias: 'i',
    default: '.',
    required: false,
    requiresArg: true,
    description: '输入目录,可选,默认当前目录'
  },
  outputdir:
  {
    alias: 'o',
    default: '.',
    required: false,
    requiresArg: true,
    description: '输出目录,可选,默认当前目录'
  },
  format:
  {
    alias: 'f',
    choices: ['PVRTCI_2BPP_RGB', 'PVRTCI_4BPP_RGB', 'PVRTCI_2BPP_RGBA', 'PVRTCI_4BPP_RGBA', 'ETC1_RGB', 'ETC2_RGB', 'ETC2_RGBA'],
    required: true,
    requiresArg: true,
    description: '像素格式，必选'
  }
}

exports.handler = async function (argv) {

  let inputDir = getAbsPath(argv.inputdir);
  if (!fs.existsSync(inputDir)) {
    console.log('错误! 找不到输入目录 ' + inputDir);
    return;
  }

  let outputDir = getAbsPath(argv.outputdir);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  if (os.platform() !== 'win32') {
    console.log('当前只支持Windows平台');
    return;
  }

  //TODO 递归目录
  let files = fs.readdirSync(inputDir);
  for (let file of files) {
    let inputTexturePath = path.join(inputDir, file);
    let outputTexturePath = path.join(outputDir, path.parse(file).name + '.pvr');

    let cmd = "TexturePacker ";

    cmd += "\"" + inputTexturePath + "\"";

    cmd += " --sheet ";
    cmd += "\"" + outputTexturePath + "\"";

    cmd += " --texture-format pvr3 ";

    cmd += " --format xml --extrude 5";//TODO
    cmd += " --data ";
    let outputDataPath = path.join(outputDir, path.parse(file).name + '.xml');
    cmd += "\"" + outputDataPath + "\"";

    cmd += " --size-constraints POT ";
    cmd += " --alpha-handling PremultiplyAlpha ";
    cmd += " --opt ";
    cmd += "\"" + argv.format + "\"";

    if (isPVRTC(argv.format)) {
      cmd += " --force-squared ";
    }

    child_process.execSync(cmd);

    let x = 5;
    let y = 5;
    let width = 20;
    let height = 20;
    let originBuffer = fs.readFileSync(outputTexturePath);

    let metadataLength = 0;
    if (os.endianness() === 'BE') {
      metadataLength = originBuffer.readUInt32BE(PVR3_HEADER_META_DATA_LENGTH_OFFSET);
    }
    else {
      metadataLength = originBuffer.readUInt32LE(PVR3_HEADER_META_DATA_LENGTH_OFFSET);
    }
    let newBuffer = Buffer.alloc(originBuffer.byteLength - metadataLength + PVR3_LAYA_MEATA_BYTE_LENGTH);
   
    originBuffer.copy(newBuffer, 0, 0, PVR3_HEADER_BYTE_LENGTH);
    if (os.endianness() === 'BE') {
      newBuffer.writeUInt32BE(PVR3_LAYA_MEATA_BYTE_LENGTH, PVR3_HEADER_META_DATA_LENGTH_OFFSET);
    }
    else {
      newBuffer.writeUInt32LE(PVR3_LAYA_MEATA_BYTE_LENGTH, PVR3_HEADER_META_DATA_LENGTH_OFFSET);
    }
 
    let offset = PVR3_HEADER_BYTE_LENGTH;

    //_fourCC = LAYA
    newBuffer.writeInt8(0x4c, offset); offset += 1;//L
    newBuffer.writeInt8(0x41, offset); offset += 1;//A
    newBuffer.writeInt8(0x59, offset); offset += 1;//Y
    newBuffer.writeInt8(0x41, offset); offset += 1;//A
    // _key = 0
    newBuffer.writeUInt32LE(0, offset); offset += 4;
    // _dataSize sizeof(rect)
    newBuffer.writeUInt32LE(4 * 4, offset); offset += 4;
    //_data rect
    newBuffer.writeUInt32LE(x, offset); offset += 4;
    newBuffer.writeUInt32LE(y, offset); offset += 4;
    newBuffer.writeUInt32LE(width, offset); offset += 4;
    newBuffer.writeUInt32LE(height, offset);

    originBuffer.copy(newBuffer, PVR3_HEADER_BYTE_LENGTH + metadataLength, PVR3_HEADER_BYTE_LENGTH + PVR3_LAYA_MEATA_BYTE_LENGTH);
    fs.writeFileSync(outputTexturePath, newBuffer);
  }
}
function isPVRTC(format: string): boolean {
  return (format === 'PVRTCI_2BPP_RGB' ||
    format === 'PVRTCI_4BPP_RGB' ||
    format === 'PVRTCI_2BPP_RGBA' ||
    format === 'PVRTCI_4BPP_RGBA');
}
function getAbsPath(dir: string): string {
  if (path.isAbsolute(dir))
    return dir;
  return path.join(process.cwd(), dir);
}
/*typedef struct
{
    uint32_t version;
    uint32_t flags;
    uint64_t pixelFormat;
    uint32_t colorSpace;
    uint32_t channelType;
    uint32_t height;
    uint32_t width;
    uint32_t depth;
    uint32_t numberOfSurfaces;
    uint32_t numberOfFaces;
    uint32_t numberOfMipmaps;
    uint32_t metadataLength;
} PVRv3TexHeader;
*/

const PVR3_HEADER_BYTE_LENGTH: number = 52;
const PVR3_HEADER_META_DATA_LENGTH_OFFSET: number = 12 * 4;
/*
struct rect
{
  uint32_t x;  
  uint32_t y;
  uint32_t width;
  uint32_t height;
};
struct LayaMeta
{
  uint32_t _fourCC;     // LAYA
	uint32_t  _key;       // 0
	uint32_t  _dataSize;  // sizeof(rect)
  uint8_t*  _data;      // rect
};
*/
const PVR3_LAYA_MEATA_BYTE_LENGTH: number = 4 * 3 + 4 * 4;