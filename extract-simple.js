const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function extractIconsSimple() {
    const SOURCE_IMAGE = path.join(__dirname, 'pic', 'icons', '图片参考-6b9d81d3-4e3a1d477ed.png');
    const OUTPUT_BASE_DIR = path.join(__dirname, 'assets', 'buttons');
    
    console.log('简单版图标提取器');
    console.log('源图片:', SOURCE_IMAGE);
    console.log('文件存在:', fs.existsSync(SOURCE_IMAGE));
    
    // 获取图片信息
    const metadata = await sharp(SOURCE_IMAGE).metadata();
    console.log(`\n图片信息: ${metadata.width}x${metadata.height}, 格式: ${metadata.format}, 通道: ${metadata.channels}`);
    
    // 生成批次目录
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const batchDir = path.join(OUTPUT_BASE_DIR, `batch_${timestamp}`);
    
    if (!fs.existsSync(batchDir)) {
        fs.mkdirSync(batchDir, { recursive: true });
    }
    console.log(`\n输出目录: ${batchDir}`);
    
    // 方法1：尝试根据图片内容手动提取（假设图标是网格排列的）
    // 1003x1024 的图片，假设图标是大约100x100
    const iconSize = 100;
    const margin = 5;
    
    // 估算行列数
    const cols = Math.floor(metadata.width / (iconSize + margin));
    const rows = Math.floor(metadata.height / (iconSize + margin));
    
    console.log(`\n假设图标布局: ${cols}列 x ${rows}行 (每个约${iconSize}x${iconSize})`);
    
    let iconCount = 0;
    
    // 尝试提取每个网格
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const left = col * (iconSize + margin);
            const top = row * (iconSize + margin);
            
            // 确保在图片范围内
            if (left + iconSize <= metadata.width && top + iconSize <= metadata.height) {
                iconCount++;
                const outputName = `icon_${row+1}_${col+1}.png`;
                const outputPath = path.join(batchDir, outputName);
                
                try {
                    await sharp(SOURCE_IMAGE)
                        .extract({ left, top, width: iconSize, height: iconSize })
                        .resize(200, 200, { 
                            fit: 'contain', 
                            background: { r: 0, g: 0, b: 0, alpha: 0 } 
                        })
                        .toFile(outputPath);
                    
                    console.log(`✓ ${outputName} (位置: ${left},${top})`);
                } catch (err) {
                    console.log(`✗ ${outputName} 提取失败: ${err.message}`);
                }
            }
        }
    }
    
    console.log(`\n完成！共尝试提取 ${iconCount} 个图标`);
    console.log(`查看目录: ${batchDir}`);
}

// 方法2：使用边缘检测找到图标边界
async function extractWithEdgeDetection() {
    console.log('\n\n=== 尝试边缘检测方法 ===');
    
    const SOURCE_IMAGE = path.join(__dirname, 'pic', 'icons', '图片参考-6b9d81d3-4e3a1d477ed.png');
    const OUTPUT_BASE_DIR = path.join(__dirname, 'assets', 'buttons');
    
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}_edges`;
    const batchDir = path.join(OUTPUT_BASE_DIR, `batch_${timestamp}`);
    
    if (!fs.existsSync(batchDir)) {
        fs.mkdirSync(batchDir, { recursive: true });
    }
    
    // 生成边缘检测图
    const edgeImagePath = path.join(batchDir, 'edges.png');
    await sharp(SOURCE_IMAGE)
        .grayscale() // 转为灰度
        .threshold(200) // 高阈值，只保留亮的部分
        .toFile(edgeImagePath);
    
    console.log(`边缘检测图已保存: ${edgeImagePath}`);
    
    // 分析边缘检测结果
    const { data, info } = await sharp(edgeImagePath).raw().toBuffer({ resolveWithObject: true });
    const stats = {
        whitePixels: 0,
        blackPixels: 0
    };
    
    for (let i = 0; i < data.length; i++) {
        if (data[i] > 200) {
            stats.whitePixels++;
        } else {
            stats.blackPixels++;
        }
    }
    
    console.log(`边缘检测结果: 白色像素=${stats.whitePixels}, 黑色像素=${stats.blackPixels}`);
    console.log(`白像素占比: ${(stats.whitePixels/(stats.whitePixels+stats.blackPixels)*100).toFixed(2)}%`);
    
    return batchDir;
}

// 主函数
async function main() {
    console.log('=== UI图标提取工具 ===');
    console.log('选择提取方法:');
    console.log('1. 网格分割法（快速，假设图标网格排列）');
    console.log('2. 边缘检测法（较慢，但更精确）');
    
    // 默认使用方法1
    await extractIconsSimple();
    
    // 可选：使用方法2
    // await extractWithEdgeDetection();
}

main().catch(err => {
    console.error('执行出错:', err);
    process.exit(1);
});