#!/usr/bin/env node

/**
 * 回滚脚本：恢复原始JS文件
 */

const fs = require('fs');
const path = require('path');

// JS文件列表
const JS_FILES = [
    'js/utils/Scaler.js',
    'js/utils/Storage.js',
    'js/ui/UIElementBase.js',
    'js/ui/StatusBarUI.js',
    'js/core/UIManager.js',
    'js/editor/StatusBarEditor.js',
    'js/core/App.js',
    'js/main.js',
    'js/modern-loader.js'
];

function rollbackFile(filePath) {
    const backupPath = filePath + '.bak';
    
    if (fs.existsSync(backupPath)) {
        // 恢复备份
        fs.writeFileSync(filePath, fs.readFileSync(backupPath));
        console.log(`✅ 恢复: ${filePath}`);
        
        // 可选：删除备份文件
        // fs.unlinkSync(backupPath);
        
        return true;
    } else {
        console.log(`⚠️  无备份: ${filePath}`);
        return false;
    }
}

function main() {
    console.log('🔄 UI预览工具 - 模块导出回滚工具');
    console.log('========================================');
    
    const projectRoot = process.cwd();
    let restoredCount = 0;
    
    for (const file of JS_FILES) {
        const filePath = path.join(projectRoot, file);
        
        if (fs.existsSync(filePath)) {
            const restored = rollbackFile(filePath);
            if (restored) restoredCount++;
        } else {
            console.log(`⚠️  文件不存在: ${filePath}`);
        }
    }
    
    // 删除modern-loader.js（如果存在）
    const loaderPath = path.join(projectRoot, 'js/modern-loader.js');
    if (fs.existsSync(loaderPath) && !fs.existsSync(loaderPath + '.bak')) {
        fs.unlinkSync(loaderPath);
        console.log(`🗑️  删除: ${loaderPath}`);
    }
    
    // 删除说明文件
    const readmePath = path.join(projectRoot, 'MODULE_FIX_README.md');
    if (fs.existsSync(readmePath)) {
        fs.unlinkSync(readmePath);
        console.log(`🗑️  删除: ${readmePath}`);
    }
    
    console.log(`\n📊 回滚完成: 恢复了 ${restoredCount} 个文件`);
    console.log('🔧 项目已恢复到原始状态');
}

if (require.main === module) {
    main();
}

module.exports = { rollbackFile };
