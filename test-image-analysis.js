const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function analyzeImage() {
    const imagePath = path.join(__dirname, 'pic', 'icons', '图片参考-6b9d81d3-4e3a1d477ed.png');
    
    console.log('分析源图片:', imagePath);
    console.log('文件存在:', fs.existsSync(imagePath));
    
    // 获取基本信息
    const metadata = await sharp(imagePath).metadata();
    console.log('\n=== 图片基本信息 ===');
    console.log('尺寸:', metadata.width, 'x', metadata.height);
    console.log('格式:', metadata.format);
    console.log('颜色空间:', metadata.space);
    console.log('通道数:', metadata.channels);
    console.log('深度:', metadata.depth, 'bit');
    console.log('是否有透明度:', metadata.hasAlpha);
    
    // 取样几个像素点看看
    console.log('\n=== 像素取样分析 ===');
    const image = sharp(imagePath);
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    
    // 检查图片四个角和中心点的像素
    const samplePoints = [
        { x: 0, y: 0, label: '左上角' },
        { x: metadata.width - 1, y: 0, label: '右上角' },
        { x: metadata.width - 1, y: metadata.height - 1, label: '右下角' },
        { x: 0, y: metadata.height - 1, label: '左下角' },
        { x: Math.floor(metadata.width / 2), y: Math.floor(metadata.height / 2), label: '中心点' }
    ];
    
    for (const point of samplePoints) {
        const idx = (point.y * info.width + point.x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];
        
        console.log(`${point.label} (${point.x},${point.y}): RGBA(${r}, ${g}, ${b}, ${a})`);
    }
    
    // 统计一下非透明像素的数量
    console.log('\n=== 像素分布统计 ===');
    let totalPixels = info.width * info.height;
    let opaquePixels = 0;
    let semiTransparentPixels = 0;
    let transparentPixels = 0;
    
    // 随机抽样 10000 个像素（性能考虑）
    const SAMPLE_COUNT = 10000;
    let samples = 0;
    
    for (let i = 0; i < SAMPLE_COUNT; i++) {
        const x = Math.floor(Math.random() * info.width);
        const y = Math.floor(Math.random() * info.height);
        const idx = (y * info.width + x) * 4;
        const alpha = data[idx + 3];
        
        if (alpha === 0) {
            transparentPixels++;
        } else if (alpha < 255) {
            semiTransparentPixels++;
        } else {
            opaquePixels++;
        }
        samples++;
    }
    
    console.log(`随机采样 ${samples} 个像素:`);
    console.log(`  完全不透明: ${opaquePixels} (${(opaquePixels/samples*100).toFixed(1)}%)`);
    console.log(`  半透明: ${semiTransparentPixels} (${(semiTransparentPixels/samples*100).toFixed(1)}%)`);
    console.log(`  完全透明: ${transparentPixels} (${(transparentPixels/samples*100).toFixed(1)}%)`);
    
    // 检查是否有非黑色像素
    let nonBlackCount = 0;
    for (let i = 0; i < Math.min(1000, data.length / 4); i++) {
        const idx = i * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];
        
        if (a > 10 && (r > 15 || g > 15 || b > 15)) {
            nonBlackCount++;
        }
    }
    console.log(`\n前1000像素中检测到的非背景像素: ${nonBlackCount}`);
}

analyzeImage().catch(err => {
    console.error('分析出错:', err);
    process.exit(1);
});