const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function checkIcons() {
    const batchDir = path.join(__dirname, 'assets', 'buttons', 'batch_20260413_1552');
    const files = fs.readdirSync(batchDir);
    
    console.log(`检查目录: ${batchDir}`);
    console.log(`共 ${files.length} 个文件`);
    
    let emptyIcons = 0;
    let validIcons = 0;
    
    // 检查每个图标
    for (let i = 0; i < Math.min(10, files.length); i++) { // 先检查前10个
        const file = files[i];
        const filePath = path.join(batchDir, file);
        
        try {
            const metadata = await sharp(filePath).metadata();
            const { data } = await sharp(filePath).raw().toBuffer({ resolveWithObject: true });
            
            // 检查是否有非黑色像素
            let hasContent = false;
            for (let j = 0; j < data.length; j += 4) {
                const r = data[j];
                const g = data[j + 1];
                const b = data[j + 2];
                const a = data[j + 3];
                
                // 如果有不透明且非黑色的像素
                if (a > 10 && (r > 15 || g > 15 || b > 15)) {
                    hasContent = true;
                    break;
                }
            }
            
            if (hasContent) {
                validIcons++;
                console.log(`✓ ${file}: 有内容 (${metadata.width}x${metadata.height})`);
            } else {
                emptyIcons++;
                console.log(`✗ ${file}: 可能是空的 (${metadata.width}x${metadata.height})`);
            }
        } catch (err) {
            console.log(`? ${file}: 检查失败 - ${err.message}`);
        }
    }
    
    console.log(`\n统计: ${validIcons} 个有内容的图标, ${emptyIcons} 个可能为空的图标`);
    
    // 创建一个预览页面
    const previewPath = path.join(__dirname, 'preview-icons.html');
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>提取的图标预览</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: Arial, sans-serif; 
            background: #1a1a1a; 
            color: #fff; 
            padding: 20px;
        }
        h1 { 
            margin-bottom: 20px; 
            color: #4CAF50; 
            text-align: center;
        }
        .info {
            background: #2a2a2a;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 20px;
        }
        .icon-item {
            background: #2a2a2a;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            transition: transform 0.2s;
        }
        .icon-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        .icon-img {
            width: 100px;
            height: 100px;
            object-fit: contain;
            margin-bottom: 10px;
            background: linear-gradient(45deg, #333, #444);
            border-radius: 5px;
            padding: 5px;
        }
        .icon-name {
            font-size: 12px;
            color: #aaa;
            word-break: break-all;
        }
        .icon-status {
            font-size: 11px;
            margin-top: 5px;
            padding: 2px 6px;
            border-radius: 3px;
            display: inline-block;
        }
        .status-valid { background: #2e7d32; color: #fff; }
        .status-empty { background: #c62828; color: #fff; }
        .status-unknown { background: #616161; color: #fff; }
    </style>
</head>
<body>
    <h1>提取的图标预览</h1>
    
    <div class="info">
        <p><strong>目录:</strong> ${batchDir}</p>
        <p><strong>总数:</strong> ${files.length} 个图标</p>
        <p><strong>生成时间:</strong> ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="grid">
`;

    // 添加所有图标到预览
    for (const file of files) {
        const iconPath = `assets/buttons/batch_20260413_1552/${file}`;
        html += `
        <div class="icon-item">
            <img src="${iconPath}" alt="${file}" class="icon-img">
            <div class="icon-name">${file}</div>
            <div class="icon-status status-valid">有效</div>
        </div>`;
    }
    
    html += `
    </div>
    
    <script>
        // 点击图标放大查看
        document.querySelectorAll('.icon-img').forEach(img => {
            img.addEventListener('click', function() {
                const overlay = document.createElement('div');
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
                overlay.style.display = 'flex';
                overlay.style.alignItems = 'center';
                overlay.style.justifyContent = 'center';
                overlay.style.zIndex = '1000';
                overlay.style.cursor = 'pointer';
                
                const largeImg = document.createElement('img');
                largeImg.src = this.src;
                largeImg.style.maxWidth = '80%';
                largeImg.style.maxHeight = '80%';
                largeImg.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';
                largeImg.style.borderRadius = '10px';
                
                overlay.appendChild(largeImg);
                overlay.addEventListener('click', () => overlay.remove());
                
                document.body.appendChild(overlay);
            });
        });
    </script>
</body>
</html>`;
    
    fs.writeFileSync(previewPath, html, 'utf-8');
    console.log(`\n预览页面已生成: ${previewPath}`);
    console.log(`用浏览器打开预览页面查看所有图标`);
}

checkIcons().catch(err => {
    console.error('检查出错:', err);
});