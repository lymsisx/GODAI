/**
 * Icon Extractor - 从精灵图中自动提取每个icon
 * 
 * 功能：
 * 1. 检测黑色背景上的非透明区域（连通分量分析）
 * 2. 自动裁剪每个icon的边界框
 * 3. 输出为200x200透明PNG，icon居中
 * 4. 按批次+时间戳存放在 assets/buttons/ 下
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// ========== 配置 ==========
const SOURCE_IMAGE = path.join(__dirname, 'pic', 'icons', '图片参考-6b9d81d3-4e3a1d477ed.png');
const OUTPUT_BASE_DIR = path.join(__dirname, 'assets', 'buttons');
const OUTPUT_SIZE = 200; // 输出图片尺寸

// ========== 调试信息 ==========
console.log('当前工作目录:', process.cwd());
console.log('脚本路径:', __dirname);
console.log('源图片路径:', SOURCE_IMAGE);
console.log('源图片是否存在:', fs.existsSync(SOURCE_IMAGE));

// ========== 主逻辑 ==========
async function extractIcons() {
    // 0. 验证文件存在
    if (!fs.existsSync(SOURCE_IMAGE)) {
        console.error(`错误：源图片不存在！`);
        console.error(`请检查路径: ${SOURCE_IMAGE}`);
        return;
    }

    // 1. 加载源图片
    console.log(`\n[1/5] 加载源图片: ${path.basename(SOURCE_IMAGE)}`);
    console.log(`      完整路径: ${SOURCE_IMAGE}`);
    const image = sharp(SOURCE_IMAGE);
    const metadata = await image.metadata();
    console.log(`      尺寸: ${metadata.width} x ${metadata.height}, 格式: ${metadata.format}`);

    // 获取RGB原始像素数据（没有alpha通道）
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    const { width, height, channels } = info;
    console.log(`      像素数据: ${data.length} bytes (${width}x${height}), 通道数: ${channels}`);
    
    // 如果图片没有alpha通道，我们添加一个
    let rgbaData;
    if (channels === 3) {
        console.log('      图片没有Alpha通道，将添加默认不透明alpha通道');
        rgbaData = new Uint8Array(width * height * 4);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const rgbIdx = (y * width + x) * 3;
                const rgbaIdx = (y * width + x) * 4;
                
                rgbaData[rgbaIdx] = data[rgbIdx];     // R
                rgbaData[rgbaIdx + 1] = data[rgbIdx + 1]; // G
                rgbaData[rgbaIdx + 2] = data[rgbIdx + 2]; // B
                rgbaData[rgbaIdx + 3] = 255;              // A (完全不透明)
            }
        }
    } else {
        rgbaData = data;
    }

    // 2. 检测非黑像素（基于亮度检测）
    console.log('\n[2/5] 分析图像，检测icon区域...');
    const nonBlackPixels = [];
    const brightnessThreshold = 150; // 提高亮度阈值，因为背景是深色，icon是亮色
    
    // 统计亮度分布，帮助确定阈值
    const brightnessHistogram = new Array(256).fill(0);
    let totalPixels = width * height;
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = rgbaData[idx];
            const g = rgbaData[idx + 1];
            const b = rgbaData[idx + 2];
            
            // 计算亮度 (加权平均)
            const brightness = Math.floor(0.299 * r + 0.587 * g + 0.114 * b);
            brightnessHistogram[brightness]++;
            
            // 亮度高于阈值视为icon内容（图片背景是深色，icon是亮色）
            if (brightness >= brightnessThreshold) {
                nonBlackPixels.push({ x, y, brightness });
            }
        }
    }
    
    console.log(`      检测到 ${nonBlackPixels.length} 个非背景像素 (亮度 >= ${brightnessThreshold})`);
    
    // 输出亮度分布
    console.log('      亮度分布 (>=150):');
    let brightCount = 0;
    for (let i = 150; i <= 255; i++) {
        if (brightnessHistogram[i] > 0) {
            brightCount += brightnessHistogram[i];
        }
    }
    console.log(`      亮度>=150的像素总数: ${brightCount} (约${((brightCount/totalPixels)*100).toFixed(2)}%)`);

    // 3. 连通分量分析（分组相邻像素为独立icon）
    console.log('\n[3/5] 执行连通分量分析，分离各icon...');
    const components = findConnectedComponents(nonBlackPixels, width, height);

    // 过滤太小的组件（噪点）
    const MIN_ICON_PIXELS = 50; // 降低阈值，因为icon可能较小
    const validComponents = components.filter(c => c.pixels.length >= MIN_ICON_PIXELS);
    console.log(`      发现 ${components.length} 个连通组件, 其中 ${validComponents.length} 个有效icon (过滤 <${MIN_ICON_PIXELS} 像素的噪点)`);

    // 按位置排序：从上到下、从左到右
    validComponents.sort((a, b) => {
        if (Math.abs(a.bbox.minY - b.bbox.minY) < 50) return a.bbox.minX - b.bbox.minX;
        return a.bbox.minY - b.bbox.minY;
    });

    // 打印每个icon的信息
    validComponents.forEach((c, i) => {
        const bb = c.bbox;
        console.log(`      [${i + 1}] (${bb.minX},${bb.minY})-(${bb.maxX},${bb.maxY}) 尺寸:${bb.width}x${bb.height} 像素数:${c.pixels.length}`);
    });

    // 4. 创建输出目录并导出每个icon
    console.log('\n[4/5] 提取并保存icon...');
    
    // 批次文件夹名: batch_YYYYMMDD_HHmmss
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    const batchDir = path.join(OUTPUT_BASE_DIR, `batch_${timestamp}`);
    
    if (!fs.existsSync(batchDir)) {
        fs.mkdirSync(batchDir, { recursive: true });
    }
    console.log(`      输出目录: ${path.relative(process.cwd(), batchDir)}`);

    const sourceImage = sharp(SOURCE_IMAGE).ensureAlpha();

    for (let i = 0; i < validComponents.length; i++) {
        const comp = validComponents[i];
        const bbox = comp.bbox;
        const outputName = `img${i + 1}.png`;
        const outputPath = path.join(batchDir, outputName);

        // 裁剪icon区域 → 缩放适应200x200 → 居中放到透明画布上
        await sourceImage.clone()
            .extract({
                left: Math.max(0, bbox.minX - 2),
                top: Math.max(0, bbox.minY - 2),
                width: bbox.width + 4,
                height: bbox.height + 4,
            })
            .resize(OUTPUT_SIZE, OUTPUT_SIZE, { 
                fit: 'contain', 
                background: { r: 0, g: 0, b: 0, alpha: 0 } 
            })
            .toFile(outputPath);

        console.log(`      ✓ ${outputName} (${bbox.width}x${bbox.height} → ${OUTPUT_SIZE}x${OUTPUT_SIZE})`);
    }

    // 5. 完成
    console.log(`\n[5/5] 完成！共提取 ${validComponents.length} 个icon`);
    console.log(`\n存放路径: ${batchDir}`);
    console.log('文件列表:');
    validComponents.forEach((_, i) => {
        console.log(`  - img${i + 1}.png`);
    });

    return { count: validComponents.length, outputDir: batchDir };
}

/**
 * 连通分量分析 (BFS)
 * 将相邻的非背景像素分组为独立的icon组件
 */
function findConnectedComponents(pixels, imgWidth, imgHeight) {
    const visited = new Set();
    const components = [];

    // 使用坐标编码的key
    const key = (x, y) => `${x},${y}`;

    for (const start of pixels) {
        const k = key(start.x, start.y);
        if (visited.has(k)) continue;

        // BFS找连通区域
        const componentPixels = [];
        const queue = [start];
        visited.add(k);

        let minX = start.x, maxX = start.x;
        let minY = start.y, maxY = start.y;

        while (queue.length > 0) {
            const p = queue.shift();
            componentPixels.push(p);

            // 更新边界框
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);

            // 检查8邻域
            for (const n of getNeighbors(p.x, p.y, pixels)) {
                const nk = key(n.x, n.y);
                if (!visited.has(nk)) {
                    visited.add(nk);
                    queue.push(n);
                }
            }
        }

        components.push({
            pixels: componentPixels,
            bbox: {
                minX, minY, maxX, maxY,
                width: maxX - minX + 1,
                height: maxY - minY + 1,
            }
        });
    }

    return components;
}

/**
 * 获取8邻域内的邻居像素（仅返回在pixels集合中的）
 */
function getNeighbors(x, y, pixelSet) {
    const neighbors = [];
    const offsets = [
        [-1, -1], [0, -1], [1, -1],
        [-1, 0],          [1, 0],
        [-1, 1],  [0, 1],  [1, 1],
    ];

    for (const [dx, dy] of offsets) {
        const nx = x + dx;
        const ny = y + dy;
        
        // 在pixelSet中快速查找
        // 线性搜索对于小数据量够用
        for (const p of pixelSet) {
            if (p.x === nx && p.y === ny) {
                neighbors.push(p);
                break;
            }
        }
    }

    return neighbors;
}

// ========== 运行 ==========
extractIcons().catch(err => {
    console.error('执行出错:', err);
    process.exit(1);
});
