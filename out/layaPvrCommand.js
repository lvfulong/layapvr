"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const os = require('os');
const assert = require('assert');
exports.command = 'texturepacker';
exports.describe = 'laya纹理压缩工具';
exports.builder = {
    inputdir: {
        alias: 'i',
        default: '.',
        required: false,
        requiresArg: true,
        description: '输入目录,可选,默认当前目录'
    },
    outputdir: {
        alias: 'o',
        default: '.',
        required: false,
        requiresArg: true,
        description: '输出目录,可选,默认当前目录'
    },
    format: {
        alias: 'f',
        choices: ['PVRTCI_2BPP_RGB', 'PVRTCI_4BPP_RGB', 'PVRTCI_2BPP_RGBA', 'PVRTCI_4BPP_RGBA', 'ETC1_RGB', 'ETC2_RGB', 'ETC2_RGBA'],
        required: true,
        requiresArg: true,
        description: '像素格式,同TexturePacker--opt,必选,可选'
    },
    extrude: {
        required: false,
        requiresArg: true,
        description: '同TexturePacker --extrude'
    },
    etc1quality: {
        choices: ['low', 'low-perceptual', 'high', 'high-perceptual'],
        required: false,
        requiresArg: true,
        description: '同TexturePacker --etc1-quality,可选'
    },
    etc2quality: {
        choices: ['low', 'low-perceptual', 'high', 'high-perceptual'],
        required: false,
        requiresArg: true,
        description: '同TexturePacker --etc2-quality,可选'
    },
    pvrquality: {
        choices: ['very-low', 'low', 'normal', 'high', 'best'],
        required: false,
        requiresArg: true,
        description: '同TexturePacker --pvr-quality,可选'
    },
    dithertype: {
        choices: ['NearestNeighbour', 'Linear', 'FloydSteinberg', 'FloydSteinbergAlpha', 'Atkinson', 'AtkinsonAlpha'],
        required: false,
        requiresArg: true,
        description: '同TexturePacker --dither-type,可选'
    },
};
exports.handler = function (argv) {
    return __awaiter(this, void 0, void 0, function* () {
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
        let files = fs.readdirSync(inputDir);
        for (let file of files) {
            let inputTexturePath = path.join(inputDir, file);
            let outputTexturePath = path.join(outputDir, path.parse(file).name + '.pvr');
            console.log('处理文件 ' + inputTexturePath + ' 中 ... ');
            if (fs.existsSync(outputTexturePath)) {
                fs.unlinkSync(outputTexturePath);
            }
            let cmd = 'TexturePacker';
            cmd += ' ' + inputTexturePath + ' ';
            cmd += ' --sheet ';
            cmd += ' ' + outputTexturePath + ' ';
            cmd += ' --texture-format pvr3 --trim-mode None';
            cmd += ' --format phaser';
            cmd += ' --data ';
            let outputDataPath = path.join(outputDir, path.parse(file).name + '.json');
            cmd += ' ' + outputDataPath + ' ';
            cmd += ' --size-constraints POT ';
            cmd += ' --alpha-handling PremultiplyAlpha ';
            cmd += ' --opt ';
            cmd += ' ' + argv.format + ' ';
            if (isPVRTC(argv.format)) {
                cmd += ' --force-squared ';
            }
            if (argv.extrude) {
                cmd += ' --extrude ';
                cmd += ' ' + argv.extrude + ' ';
            }
            if (argv.etc1quality) {
                cmd += ' --etc1-quality ';
                cmd += ' ' + argv.etc1quality + ' ';
            }
            if (argv.etc2quality) {
                cmd += ' --etc2-quality ';
                cmd += ' ' + argv.etc2quality + ' ';
            }
            if (argv.pvrquality) {
                cmd += ' --pvr-quality ';
                cmd += ' ' + argv.pvrquality + ' ';
            }
            if (argv.dithertype) {
                cmd += ' --dither-type ';
                cmd += ' ' + argv.dithertype + ' ';
            }
            child_process.execSync(cmd);
            cmd = path.join(__dirname, '../tools/win/PVRTool.exe');
            cmd += ' ' + outputTexturePath + ' ';
            cmd += ' ' + path.join(outputDir, path.parse(file).name) + ' ';
            var dataJson = fs.readFileSync(outputDataPath, 'utf8');
            let frame = JSON.parse(dataJson).textures[0].frames[0].frame;
            cmd += ' ' + frame.x + ' ';
            cmd += ' ' + frame.y + ' ';
            cmd += ' ' + frame.w + ' ';
            cmd += ' ' + frame.h + ' ';
            child_process.execSync(cmd);
            fs.unlinkSync(outputDataPath);
        }
    });
};
function isPVRTC(format) {
    return (format === 'PVRTCI_2BPP_RGB' ||
        format === 'PVRTCI_4BPP_RGB' ||
        format === 'PVRTCI_2BPP_RGBA' ||
        format === 'PVRTCI_4BPP_RGBA');
}
function getAbsPath(dir) {
    if (path.isAbsolute(dir))
        return dir;
    return path.join(process.cwd(), dir);
}
