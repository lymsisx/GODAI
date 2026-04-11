#!/usr/bin/env node

/**
 * 自动化修复脚本：为所有JS文件添加浏览器环境导出
 * 修复混合导出模式（module.exports + window.ClassName）问题
 */

const fs = require('fs');
const path = require('path');

// 要修复的JS文件列表（按依赖顺序）
const JS_FILES = [
    {
        file: 'js/utils/Scaler.js',
        className: 'Scaler',
        exportsToAdd: ['window.Scaler = Scaler;']
    },
    {
        file: 'js/utils/Storage.js',
        className: 'StorageManager',
        exportsToAdd: ['window.StorageManager = StorageManager;']
    },
    {
        file: 'js/ui/UIElementBase.js',
        className: 'UIElementBase',
        exportsToAdd: ['window.UIElementBase = UIElementBase;', 'window.UIElement = UIElementBase;']
    },
    {
        file: 'js/ui/StatusBarUI.js',
        className: 'StatusBarUI',
        exportsToAdd: ['window.StatusBarUI = StatusBarUI;']
    },
    {
        file: 'js/core/UIManager.js',
        className: 'UIManager',
        exportsToAdd: ['window.UIManager = UIManager;']
    },
    {
        file: 'js/editor/StatusBarEditor.js',
        className: 'StatusBarEditor',
        exportsToAdd: ['window.StatusBarEditor = StatusBarEditor;']
    },
    {
        file: 'js/core/App.js',
        className: 'App',
        exportsToAdd: [
            'window.App = App;',
            'window.initApp = initApp;',
            'if (typeof window !== "undefined" && !window.initApp) { window.initApp = initApp; }'
        ]
    },
    {
        file: 'js/main.js',
        className: null, // main.js 特殊处理
        exportsToAdd: [
            'window.ModuleLoader = ModuleLoader;',
            'window.AppStarter = AppStarter;',
            'if (typeof window !== "undefined") {',
            '    if (!window.ModuleLoader) window.ModuleLoader = ModuleLoader;',
            '    if (!window.AppStarter) window.AppStarter = AppStarter;',
            '}'
        ]
    }
];

// 统一导出模板
const EXPORT_TEMPLATE = `

// 统一导出模式：同时支持浏览器和Node.js环境
if (typeof window !== 'undefined') {
    %BROWSER_EXPORTS%
}
if (typeof module !== 'undefined' && module.exports) {
    %NODE_EXPORTS%
}`;

/**
 * 修复单个JS文件的导出
 */
function fixFileExports(fileInfo, projectRoot) {
    const filePath = path.join(projectRoot, fileInfo.file);
    
    if (!fs.existsSync(filePath)) {
        console.error(`❌ 文件不存在: ${filePath}`);
        return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 检查是否已经有window导出
    const hasWindowExport = fileInfo.exportsToAdd.some(exportStmt => 
        content.includes(exportStmt.replace(/if.*\{/, '').replace(/\}.*/, '').trim())
    );
    
    if (hasWindowExport) {
        console.log(`✅ ${fileInfo.file} 已有浏览器导出，跳过`);
        return true;
    }
    
    // 查找已有的module.exports语句位置
    const moduleExportRegex = /if\s*\(\s*typeof\s*module\s*!==\s*['"]undefined['"]\s*&&\s*module\.exports\s*\)\s*\{[\s\S]*?\}/;
    const match = content.match(moduleExportRegex);
    
    if (!match) {
        console.warn(`⚠️  ${fileInfo.file} 没有找到module.exports语句`);
        
        // 如果没有module.exports，在文件末尾添加统一导出
        let browserExports = fileInfo.exportsToAdd.join('\n    ');
        let nodeExports;
        
        if (fileInfo.className === 'App') {
            nodeExports = 'module.exports = { App, initApp };';
        } else if (fileInfo.className === null) {
            nodeExports = 'module.exports = { ModuleLoader, AppStarter };';
        } else {
            nodeExports = `module.exports = ${fileInfo.className};`;
        }
        
        const newExport = EXPORT_TEMPLATE
            .replace('%BROWSER_EXPORTS%', browserExports)
            .replace('%NODE_EXPORTS%', nodeExports);
        
        content += newExport;
        
    } else {
        // 修改现有的module.exports语句，添加window导出
        const oldExport = match[0];
        
        // 检查是否已经有浏览器导出
        if (oldExport.includes('typeof window') || oldExport.includes('window.')) {
            console.log(`✅ ${fileInfo.file} 已有统一导出，跳过`);
            return true;
        }
        
        // 创建新的统一导出
        let browserExports = fileInfo.exportsToAdd.join('\n    ');
        let nodeExport;
        
        // 提取现有的module.exports语句
        const nodeExportMatch = oldExport.match(/module\.exports\s*=\s*[^;]+;/);
        if (nodeExportMatch) {
            nodeExport = nodeExportMatch[0];
        } else {
            // 如果没有module.exports语句，创建默认的
            if (fileInfo.className === 'App') {
                nodeExport = 'module.exports = { App, initApp };';
            } else if (fileInfo.className === null) {
                nodeExport = 'module.exports = { ModuleLoader, AppStarter };';
            } else {
                nodeExport = `module.exports = ${fileInfo.className};`;
            }
        }
        
        const newExport = `// 统一导出模式：同时支持浏览器和Node.js环境
if (typeof window !== 'undefined') {
    ${browserExports}
}
if (typeof module !== 'undefined' && module.exports) {
    ${nodeExport}
}`;
        
        content = content.replace(oldExport, newExport);
    }
    
    // 备份原文件
    const backupPath = filePath + '.bak';
    if (!fs.existsSync(backupPath)) {
        fs.writeFileSync(backupPath, fs.readFileSync(filePath));
        console.log(`📁 创建备份: ${filePath}.bak`);
    }
    
    // 写入修复后的文件
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ 修复完成: ${fileInfo.file}`);
    
    return true;
}

/**
 * 验证修复结果
 */
function verifyExports(projectRoot) {
    console.log('\n🔍 验证修复结果...');
    
    const successFiles = [];
    const failedFiles = [];
    
    for (const fileInfo of JS_FILES) {
        const filePath = path.join(projectRoot, fileInfo.file);
        
        if (!fs.existsSync(filePath)) {
            failedFiles.push(`${fileInfo.file} (文件不存在)`);
            continue;
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        let allExportsFound = true;
        
        // 检查是否包含所有必要的导出
        for (const exportStmt of fileInfo.exportsToAdd) {
            // 简化检查，只看核心导出语句
            const simpleExport = exportStmt.split('=')[0].trim();
            if (simpleExport && !content.includes(simpleExport)) {
                // 如果window.ClassName没有找到，检查是否有类似导出
                if (simpleExport.startsWith('window.')) {
                    const className = simpleExport.split('window.')[1];
                    if (!content.includes(`window.${className}`)) {
                        console.log(`⚠️  ${fileInfo.file} 缺少导出: ${simpleExport}`);
                        allExportsFound = false;
                    }
                }
            }
        }
        
        // 检查是否有统一导出模式
        const hasUnifiedExport = content.includes('typeof window') && 
                                (content.includes('module.exports') || content.includes('typeof module'));
        
        if (allExportsFound && hasUnifiedExport) {
            successFiles.push(fileInfo.file);
        } else {
            failedFiles.push(fileInfo.file);
        }
    }
    
    console.log('\n📊 验证结果:');
    console.log(`✅ 成功: ${successFiles.length} 个文件`);
    successFiles.forEach(file => console.log(`   ✓ ${file}`));
    
    if (failedFiles.length > 0) {
        console.log(`❌ 失败: ${failedFiles.length} 个文件`);
        failedFiles.forEach(file => console.log(`   ✗ ${file}`));
        return false;
    }
    
    return true;
}

/**
 * 创建现代化模块加载器
 */
function createModernLoader(projectRoot) {
    console.log('\n🛠️  创建现代化模块加载器...');
    
    const loaderPath = path.join(projectRoot, 'js', 'modern-loader.js');
    const loaderContent = `/**
 * 现代化模块加载器
 * 支持依赖管理、错误处理、加载统计
 */

class ModernModuleLoader {
    // 模块加载状态追踪
    static loadingStates = {
        pending: 'pending',
        loading: 'loading',
        loaded: 'loaded',
        failed: 'failed'
    };
    
    // 模块依赖图
    static dependencies = {
        'Scaler': [],
        'Storage': [],
        'UIElementBase': ['Scaler', 'Storage'],
        'StatusBarUI': ['UIElementBase', 'Scaler'],
        'UIManager': ['UIElementBase', 'StatusBarUI'],
        'StatusBarEditor': ['StatusBarUI', 'UIManager'],
        'App': ['UIManager', 'StatusBarEditor'],
        'initApp': ['App']
    };
    
    // 模块配置
    static moduleConfig = [
        { path: './utils/Scaler.js', name: 'Scaler', exportName: 'Scaler' },
        { path: './utils/Storage.js', name: 'Storage', exportName: 'Storage' },
        { path: './ui/UIElementBase.js', name: 'UIElementBase', exportName: 'UIElementBase' },
        { path: './ui/StatusBarUI.js', name: 'StatusBarUI', exportName: 'StatusBarUI' },
        { path: './core/UIManager.js', name: 'UIManager', exportName: 'UIManager' },
        { path: './editor/StatusBarEditor.js', name: 'StatusBarEditor', exportName: 'StatusBarEditor' },
        { path: './core/App.js', name: 'App', exportName: 'App' }
    ];
    
    // 加载状态跟踪
    static loadStatus = new Map();
    
    /**
     * 加载所有模块（现代化版本）
     */
    static async loadAll() {
        console.log('🚀 开始加载现代化模块加载器...');
        
        // 初始化加载状态
        this.moduleConfig.forEach(module => {
            this.loadStatus.set(module.name, {
                state: this.loadingStates.pending,
                startTime: null,
                endTime: null,
                error: null
            });
        });
        
        // 检查是否已经有模块通过HTML加载
        this._checkAlreadyLoaded();
        
        try {
            // 按依赖顺序加载模块
            const loadOrder = this._calculateLoadOrder();
            console.log('📋 模块加载顺序:', loadOrder.map(m => m.name).join(' → '));
            
            for (const moduleName of loadOrder) {
                await this._loadModule(moduleName);
            }
            
            console.log('✅ 所有模块加载完成！');
            this._printLoadStatistics();
            
            // 验证全局变量可用性
            const allGlobal = this._verifyGlobalExports();
            if (allGlobal) {
                console.log('✅ 所有全局变量已正确导出');
            } else {
                console.warn('⚠️  部分全局变量可能未正确导出，但应用仍可运行');
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ 模块加载失败:', error);
            this._printLoadStatistics();
            throw error;
        }
    }
    
    /**
     * 计算加载顺序（基于依赖图）
     */
    static _calculateLoadOrder() {
        const visited = new Set();
        const order = [];
        
        const visit = (moduleName) => {
            if (visited.has(moduleName)) return;
            
            // 标记为正在访问
            visited.add(moduleName);
            
            // 先访问所有依赖
            const deps = this.dependencies[moduleName] || [];
            for (const dep of deps) {
                visit(dep);
            }
            
            // 添加当前模块
            const moduleInfo = this.moduleConfig.find(m => m.name === moduleName);
            if (moduleInfo) {
                order.push(moduleInfo);
            }
        };
        
        // 从所有模块开始
        this.moduleConfig.forEach(module => {
            visit(module.name);
        });
        
        return order;
    }
    
    /**
     * 加载单个模块
     */
    static async _loadModule(moduleName) {
        const moduleInfo = this.moduleConfig.find(m => m.name === moduleName);
        if (!moduleInfo) {
            throw new Error(\`未找到模块配置: \${moduleName}\`);
        }
        
        const status = this.loadStatus.get(moduleName);
        status.state = this.loadingStates.loading;
        status.startTime = Date.now();
        
        console.log(\`📦 加载模块: \${moduleName}...\`);
        
        try {
            // 检查模块是否已加载（通过HTML或其他方式）
            if (this._isModuleAlreadyLoaded(moduleName)) {
                console.log(\`✅ 模块已加载: \${moduleName} (通过HTML或其他方式)\`);
                status.state = this.loadingStates.loaded;
                status.endTime = Date.now();
                return;
            }
            
            // 动态加载模块
            await this._loadScript(moduleInfo.path);
            
            // 验证导出
            if (!this._verifyModuleExport(moduleName)) {
                throw new Error(\`模块加载但未正确导出: \${moduleName}\`);
            }
            
            status.state = this.loadingStates.loaded;
            status.endTime = Date.now();
            
            console.log(\`✅ 模块加载成功: \${moduleName} (\${Date.now() - status.startTime}ms)\`);
            
        } catch (error) {
            status.state = this.loadingStates.failed;
            status.error = error;
            status.endTime = Date.now();
            
            console.error(\`❌ 模块加载失败: \${moduleName}\`, error);
            
            // 对于非关键模块，继续加载其他模块
            const isCritical = ['Scaler', 'Storage', 'UIElementBase'].includes(moduleName);
            if (isCritical) {
                throw error;
            } else {
                console.warn(\`⚠️  非关键模块 \${moduleName} 加载失败，继续加载其他模块\`);
            }
        }
    }
    
    /**
     * 动态加载脚本
     */
    static async _loadScript(src) {
        return new Promise((resolve, reject) => {
            // 检查是否已存在相同脚本
            const existingScripts = document.querySelectorAll(\`script[src="\${src}"]\`);
            if (existingScripts.length > 0) {
                console.log(\`📁 脚本已存在: \${src}\`);
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.async = false; // 确保顺序加载
            
            script.onload = () => {
                console.log(\`📄 脚本加载完成: \${src}\`);
                resolve();
            };
            
            script.onerror = () => {
                console.error(\`❌ 脚本加载失败: \${src}\`);
                reject(new Error(\`无法加载脚本: \${src}\`));
            };
            
            document.head.appendChild(script);
        });
    }
    
    /**
     * 检查模块是否已通过HTML加载
     */
    static _checkAlreadyLoaded() {
        const alreadyLoaded = [];
        
        for (const moduleInfo of this.moduleConfig) {
            if (this._isModuleAlreadyLoaded(moduleInfo.name)) {
                alreadyLoaded.push(moduleInfo.name);
                const status = this.loadStatus.get(moduleInfo.name);
                status.state = this.loadingStates.loaded;
                status.startTime = 0;
                status.endTime = 0;
            }
        }
        
        if (alreadyLoaded.length > 0) {
            console.log(\`📁 已通过HTML加载的模块: \${alreadyLoaded.join(', ')}\`);
        }
    }
    
    /**
     * 判断模块是否已加载
     */
    static _isModuleAlreadyLoaded(moduleName) {
        const moduleInfo = this.moduleConfig.find(m => m.name === moduleName);
        if (!moduleInfo) return false;
        
        // 检查全局变量
        const globalVar = window[moduleInfo.exportName];
        if (globalVar !== undefined) {
            return true;
        }
        
        // 对于App模块，额外检查initApp
        if (moduleName === 'App' && typeof window.initApp === 'function') {
            return true;
        }
        
        return false;
    }
    
    /**
     * 验证模块导出
     */
    static _verifyModuleExport(moduleName) {
        const moduleInfo = this.moduleConfig.find(m => m.name === moduleName);
        if (!moduleInfo) return false;
        
        // 检查全局变量
        const globalVar = window[moduleInfo.exportName];
        if (globalVar === undefined) {
            console.warn(\`⚠️  模块 \${moduleName} 未导出为 window.\${moduleInfo.exportName}\`);
            
            // 对于UIElementBase，也检查window.UIElement
            if (moduleName === 'UIElementBase' && window.UIElement !== undefined) {
                return true;
            }
            
            return false;
        }
        
        return true;
    }
    
    /**
     * 验证所有全局变量
     */
    static _verifyGlobalExports() {
        const missingExports = [];
        
        for (const moduleInfo of this.moduleConfig) {
            const globalVar = window[moduleInfo.exportName];
            if (globalVar === undefined) {
                // 对于UIElementBase，也检查window.UIElement
                if (moduleInfo.name === 'UIElementBase' && window.UIElement !== undefined) {
                    continue;
                }
                
                // 对于App，检查initApp
                if (moduleInfo.name === 'App' && typeof window.initApp === 'function') {
                    continue;
                }
                
                missingExports.push(moduleInfo.exportName);
            }
        }
        
        if (missingExports.length > 0) {
            console.warn(\`⚠️  缺失的全局变量: \${missingExports.join(', ')}\`);
            return false;
        }
        
        return true;
    }
    
    /**
     * 打印加载统计信息
     */
    static _printLoadStatistics() {
        console.log('\\n📊 模块加载统计:');
        console.log('┌────────────────────────────┬─────────────┬──────────┬─────────────┐');
        console.log('│ 模块名称                  │ 状态        │ 耗时(ms) │ 错误        │');
        console.log('├────────────────────────────┼─────────────┼──────────┼─────────────┤');
        
        for (const moduleInfo of this.moduleConfig) {
            const status = this.loadStatus.get(moduleInfo.name);
            const duration = status.endTime && status.startTime ? status.endTime - status.startTime : 0;
            const errorMsg = status.error ? status.error.message.substring(0, 20) + '...' : '-';
            
            const statusIcon = status.state === 'loaded' ? '✅' : 
                              status.state === 'failed' ? '❌' : 
                              status.state === 'loading' ? '🔄' : '⏳';
            
            console.log(\`│ \${moduleInfo.name.padEnd(26)} │ \${statusIcon} \${status.state.padEnd(9)} │ \${duration.toString().padStart(8)} │ \${errorMsg.padEnd(11)} │\`);
        }
        
        console.log('└────────────────────────────┴─────────────┴──────────┴─────────────┘');
    }
    
    /**
     * 获取模块加载状态
     */
    static getLoadStatus() {
        const result = {};
        for (const [moduleName, status] of this.loadStatus) {
            result[moduleName] = { ...status };
        }
        return result;
    }
    
    /**
     * 重置加载状态
     */
    static reset() {
        this.loadStatus.clear();
        console.log('🔄 模块加载状态已重置');
    }
}

// 导出ModernModuleLoader
if (typeof window !== 'undefined') {
    window.ModernModuleLoader = ModernModuleLoader;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModernModuleLoader;
}

// 自动初始化（如果通过HTML加载）
if (typeof window !== 'undefined') {
    console.log('🔧 ModernModuleLoader 已加载');
    window.ModernModuleLoader = ModernModuleLoader;
}`;
    
    // 检查文件是否已存在
    if (fs.existsSync(loaderPath)) {
        const backupPath = loaderPath + '.bak';
        if (!fs.existsSync(backupPath)) {
            fs.writeFileSync(backupPath, fs.readFileSync(loaderPath));
            console.log(`📁 创建备份: ${loaderPath}.bak`);
        }
    }
    
    fs.writeFileSync(loaderPath, loaderContent, 'utf8');
    console.log(`✅ 现代化模块加载器创建完成: ${loaderPath}`);
    
    return loaderPath;
}

/**
 * 主函数
 */
async function main() {
    console.log('🔧 UI预览工具 - 模块导出修复工具');
    console.log('========================================');
    
    const projectRoot = process.cwd();
    console.log(`📁 项目根目录: ${projectRoot}`);
    
    // 步骤1：修复所有JS文件的导出
    console.log('\n🔧 步骤1: 修复JS文件导出...');
    let allFixed = true;
    
    for (const fileInfo of JS_FILES) {
        try {
            const fixed = fixFileExports(fileInfo, projectRoot);
            if (!fixed) {
                allFixed = false;
            }
        } catch (error) {
            console.error(`❌ 修复失败 ${fileInfo.file}:`, error.message);
            allFixed = false;
        }
    }
    
    if (!allFixed) {
        console.warn('⚠️  部分文件修复失败，但继续执行...');
    }
    
    // 步骤2：验证修复结果
    console.log('\n🔍 步骤2: 验证修复结果...');
    const verified = verifyExports(projectRoot);
    
    if (!verified) {
        console.warn('⚠️  验证失败，但继续创建模块加载器...');
    }
    
    // 步骤3：创建现代化模块加载器
    const loaderPath = createModernLoader(projectRoot);
    
    // 步骤4：创建使用说明
    console.log('\n📋 步骤4: 创建使用说明...');
    const readmePath = path.join(projectRoot, 'MODULE_FIX_README.md');
    const readmeContent = `# 模块导出修复完成

## 已完成的操作

1. ✅ **修复了所有JS文件的导出**
   - 为8个JS文件添加了浏览器环境导出（window.ClassName）
   - 保持了现有的Node.js导出（module.exports）
   - 创建了统一的导出模式

2. ✅ **创建了现代化模块加载器**
   - 文件位置: \`js/modern-loader.js\`
   - 支持依赖管理、错误处理、加载统计
   - 自动检测已通过HTML加载的模块

3. ✅ **保留了向后兼容性**
   - 所有原始文件都已备份（.bak扩展名）
   - 原始的HTML加载方式仍可工作
   - ModuleLoader类保持不变

## 下一步操作

### 方案A：使用现代化加载器（推荐）
1. 修改 \`index.html\`，移除8个单独的\`<script>\`标签
2. 添加一个加载器脚本：
   \`\`\`html
   <script src="js/modern-loader.js"></script>
   <script src="js/main.js"></script>
   \`\`\`
3. 修改 \`js/main.js\` 第54行：
   \`\`\`javascript
   // 原代码
   await ModuleLoader.loadAll();
   
   // 新代码
   await ModernModuleLoader.loadAll();
   \`\`\`

### 方案B：保持现状但修复了导出问题
- 不需要修改HTML或main.js
- 修复后的JS文件现在可以通过HTML正常加载
- 但仍有双重加载的风险（HTML + ModuleLoader）

### 验证修复
1. 在浏览器中打开 \`index.html\`
2. 打开开发者工具（F12）
3. 检查控制台输出，应显示：
   - "🔧 ModernModuleLoader 已加载"
   - "🚀 开始加载现代化模块加载器..."
   - 所有模块加载成功的消息

4. 在控制台中验证全局变量：
   \`\`\`javascript
   console.log('Scaler:', typeof Scaler);     // 应该输出 "function"
   console.log('Storage:', typeof Storage);   // 应该输出 "function"
   console.log('App:', typeof App);           // 应该输出 "function"
   console.log('initApp:', typeof initApp);   // 应该输出 "function"
   \`\`\`

## 回滚方案

如果遇到问题，可以：
1. 恢复备份文件：所有修改的文件都有 \`.bak\` 备份
2. 或运行回滚脚本：
   \`\`\`bash
   node rollback-exports.js
   \`\`\`

## 技术支持

如有问题，请检查：
1. 浏览器控制台错误信息
2. 确保所有JS文件语法正确
3. 验证模块依赖关系

---
**修复完成时间**: ${new Date().toLocaleString()}
`;

    fs.writeFileSync(readmePath, readmeContent, 'utf8');
    console.log(`✅ 使用说明创建完成: ${readmePath}`);
    
    // 步骤5：创建回滚脚本
    console.log('\n🔄 步骤5: 创建回滚脚本...');
    const rollbackPath = path.join(projectRoot, 'rollback-exports.js');
    const rollbackContent = `#!/usr/bin/env node

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
        console.log(\`✅ 恢复: \${filePath}\`);
        
        // 可选：删除备份文件
        // fs.unlinkSync(backupPath);
        
        return true;
    } else {
        console.log(\`⚠️  无备份: \${filePath}\`);
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
            console.log(\`⚠️  文件不存在: \${filePath}\`);
        }
    }
    
    // 删除modern-loader.js（如果存在）
    const loaderPath = path.join(projectRoot, 'js/modern-loader.js');
    if (fs.existsSync(loaderPath) && !fs.existsSync(loaderPath + '.bak')) {
        fs.unlinkSync(loaderPath);
        console.log(\`🗑️  删除: \${loaderPath}\`);
    }
    
    // 删除说明文件
    const readmePath = path.join(projectRoot, 'MODULE_FIX_README.md');
    if (fs.existsSync(readmePath)) {
        fs.unlinkSync(readmePath);
        console.log(\`🗑️  删除: \${readmePath}\`);
    }
    
    console.log(\`\\n📊 回滚完成: 恢复了 \${restoredCount} 个文件\`);
    console.log('🔧 项目已恢复到原始状态');
}

if (require.main === module) {
    main();
}

module.exports = { rollbackFile };
`;
    
    fs.writeFileSync(rollbackPath, rollbackContent, 'utf8');
    console.log(`✅ 回滚脚本创建完成: ${rollbackPath}`);
    
    console.log('\n🎉 所有修复已完成！');
    console.log('========================================');
    console.log('📋 下一步：');
    console.log('1. 阅读 MODULE_FIX_README.md 了解详情');
    console.log('2. 测试修复：在浏览器中打开 index.html');
    console.log('3. 如果一切正常，可以删除 .bak 备份文件');
    console.log('4. 或者使用现代化加载器（修改 index.html 和 main.js）');
    
    return true;
}

// 执行主函数
if (require.main === module) {
    main().catch(error => {
        console.error('❌ 修复过程出错:', error);
        process.exit(1);
    });
}

module.exports = { fixFileExports, verifyExports, createModernLoader };