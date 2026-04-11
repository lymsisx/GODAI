/**
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
    
    // 模块依赖图（仅包含真正的模块，initApp是全局函数不是模块）
    static dependencies = {
        'Scaler': [],
        'UIStorageManager': [],
        'UIElementBase': ['Scaler', 'UIStorageManager'],
        'StatusBarUI': ['UIElementBase', 'Scaler'],
        'UIManager': ['UIElementBase', 'StatusBarUI'],
        'StatusBarEditor': ['StatusBarUI', 'UIManager'],
        'UIElementEditor': ['UIElementBase', 'UIManager'],
        'EditorManager': ['UIManager', 'UIElementEditor', 'StatusBarEditor'],
        'App': ['UIManager', 'StatusBarEditor', 'EditorManager']
    };
    
    // 模块配置（路径基于HTML的base URL即GODAI/目录）
    static moduleConfig = [
        { path: 'js/utils/Scaler.js', name: 'Scaler', exportName: 'Scaler' },
        { path: 'js/utils/Storage.js', name: 'UIStorageManager', exportName: 'UIStorageManager' },
        { path: 'js/ui/UIElementBase.js', name: 'UIElementBase', exportName: 'UIElementBase' },
        { path: 'js/ui/StatusBarUI.js', name: 'StatusBarUI', exportName: 'StatusBarUI' },
        { path: 'js/core/UIManager.js', name: 'UIManager', exportName: 'UIManager' },
        { path: 'js/editor/StatusBarEditor.js', name: 'StatusBarEditor', exportName: 'StatusBarEditor' },
        { path: 'js/editor/UIElementEditor.js', name: 'UIElementEditor', exportName: 'UIElementEditor' },
        { path: 'js/editor/EditorManager.js', name: 'EditorManager', exportName: 'EditorManager' },
        { path: 'js/core/App.js', name: 'App', exportName: 'App' }
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
            
            for (const moduleInfo of loadOrder) {
                await this._loadModule(moduleInfo.name);
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
            throw new Error(`未找到模块配置: ${moduleName}`);
        }
        
        const status = this.loadStatus.get(moduleName);
        status.state = this.loadingStates.loading;
        status.startTime = Date.now();
        
        console.log(`📦 加载模块: ${moduleName}...`);
        
        try {
            // 检查模块是否已加载（通过HTML或其他方式）
            if (this._isModuleAlreadyLoaded(moduleName)) {
                console.log(`✅ 模块已加载: ${moduleName} (通过HTML或其他方式)`);
                status.state = this.loadingStates.loaded;
                status.endTime = Date.now();
                return;
            }
            
            // 动态加载模块
            await this._loadScript(moduleInfo.path);
            
            // 验证导出
            if (!this._verifyModuleExport(moduleName)) {
                throw new Error(`模块加载但未正确导出: ${moduleName}`);
            }
            
            status.state = this.loadingStates.loaded;
            status.endTime = Date.now();
            
            console.log(`✅ 模块加载成功: ${moduleName} (${Date.now() - status.startTime}ms)`);
            
        } catch (error) {
            status.state = this.loadingStates.failed;
            status.error = error;
            status.endTime = Date.now();
            
            console.error(`❌ 模块加载失败: ${moduleName}`, error);
            
            // 对于非关键模块，继续加载其他模块
            const isCritical = ['Scaler', 'UIStorageManager', 'UIElementBase'].includes(moduleName);
            if (isCritical) {
                throw error;
            } else {
                console.warn(`⚠️  非关键模块 ${moduleName} 加载失败，继续加载其他模块`);
            }
        }
    }
    
    /**
     * 动态加载脚本
     */
    static async _loadScript(src) {
        return new Promise((resolve, reject) => {
            // 检查是否已存在相同脚本
            const existingScripts = document.querySelectorAll(`script[src="${src}"]`);
            if (existingScripts.length > 0) {
                console.log(`📁 脚本已存在: ${src}`);
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.async = false; // 确保顺序加载
            
            script.onload = () => {
                console.log(`📄 脚本加载完成: ${src}`);
                resolve();
            };
            
            script.onerror = () => {
                console.error(`❌ 脚本加载失败: ${src}`);
                reject(new Error(`无法加载脚本: ${src}`));
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
            console.log(`📁 已通过HTML加载的模块: ${alreadyLoaded.join(', ')}`);
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
            // 额外验证：对于 UIStorageManager，检查是否有 PREFIX 属性（我们自己的模块特征）
            if (moduleName === 'UIStorageManager' && typeof globalVar.PREFIX !== 'string') {
                return false; // 是浏览器内置 API，不是我们自定义的模块
            }
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
            console.warn(`⚠️  模块 ${moduleName} 未导出为 window.${moduleInfo.exportName}`);
            
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
            console.warn(`⚠️  缺失的全局变量: ${missingExports.join(', ')}`);
            return false;
        }
        
        return true;
    }
    
    /**
     * 打印加载统计信息
     */
    static _printLoadStatistics() {
        console.log('\n📊 模块加载统计:');
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
            
            console.log(`│ ${moduleInfo.name.padEnd(26)} │ ${statusIcon} ${status.state.padEnd(9)} │ ${duration.toString().padStart(8)} │ ${errorMsg.padEnd(11)} │`);
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
}