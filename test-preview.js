const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function previewImage() {
    const imagePath = path.join(__dirname, 'pic', 'icons', '图片参考-6b9d81d3-4e3a1d477ed.png');
    
    console.log('生成图片预览...');
    
    // 生成缩略图预览
    const outputPath = path.join(__dirname, 'preview.png');
    
    await sharp(imagePath)
        .resize(400, 400, { fit: 'inside' })
        .toFile(outputPath);
    
    console.log('预览已保存:', outputPath);
    
    // 生成亮度热力图
    const { data, info } = await sharp(imagePath).raw().toBuffer({ resolveWithObject: true });
    
    const heatmap = new Uint8Array(info.width * info.height * 4);
    const pixelCount = info.width * info.height;
    
    // 找到最小和最大亮度值
    let minBrightness = 255;
    let maxBrightness = 0;
    
    for (let i = 0; i < pixelCount; i++) {
        const idx = i * info.channels;
        const r = data[idx];
        const g = data[idx + 1] || r;
        const b = data[idx + 2] || r;
        
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        minBrightness = Math.min(minBrightness, brightness);
        maxBrightness = Math.max(maxBrightness, brightness);
    }
    
    console.log(`亮度范围: ${minBrightness} - ${maxBrightness}`);
    
    // 创建热力图
    for (let i = 0; i < pixelCount; i++) {
        const rgbIdx = i * info.channels;
        const rgbaIdx = i * 4;
        
        const r = data[rgbIdx];
        const g = data[rgbIdx + 1] || r;
        const b = data[rgbIdx + 2] || r;
        
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // 归一化亮度到0-1
        const normalized = (brightness - minBrightness) / (maxBrightness - minBrightness || 1);
        
        // 使用热力图颜色：蓝→绿→黄→红
        let heatR, heatG, heatB;
        if (normalized < 0.25) {
            // 蓝到青
            heatR = 0;
            heatG = Math.floor(normalized * 4 * 255);
            heatB = 255;
        } else if (normalized < 0.5) {
            // 青到绿
            heatR = 0;
            heatG = 255;
            heatB = Math.floor((0.5 - normalized) * 4 * 255);
        } else if (normalized < 0.75) {
            // 绿到黄
            heatR = Math.floor((normalized - 0.5) * 4 * 255);
            heatG = 255;
            heatB = 0;
        } else {
            // 黄到红
            heatR = 255;
            heatG = Math.floor((1 - normalized) * 4 * 255);
            heatB = 0;
        }
        
        heatmap[rgbaIdx] = heatR;
        heatmap[rgbaIdx + 1] = heatG;
        heatmap[rgbaIdx + 2] = heatB;
        heatmap[rgbaIdx + 3] = 255; // 不透明
    }
    
    // 保存热力图
    const heatmapPath = path.join(__dirname, 'heatmap.png');
    await sharp(heatmap, { raw: { width: info.width, height: info.height, channels: 4 } })
        .resize(400, 400, { fit: 'inside' })
        .toFile(heatmapPath);
    
    console.log('亮度热力图已保存:', heatmapPath);
    
    // 分析图片直方图
    console.log('\n=== 亮度直方图 ===');
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < pixelCount; i += 10) { // 抽样
        const idx = i * info.channels;
        const r = data[idx];
        const g = data[idx + 1] || r;
        const b = data[idx + 2] || r;
        
        const brightness = Math.floor(0.299 * r + 0.587 * g + 0.114 * b);
        histogram[brightness]++;
    }
    
    // 打印亮度分布
    console.log('亮度 | 像素数');
    console.log('----|--------');
    for (let i = 0; i < 256; i += 16) {
        const sum = histogram.slice(i, i + 16).reduce((a, b) => a + b, 0);
        if (sum > 0) {
            console.log(`${i}-${i+15} | ${sum}`);
        }
    }
}

previewImage().catch(err => {
    console.error('预览出错:', err);
    process.exit(1);
});