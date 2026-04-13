/**
 * UI预览工具主入口文件
 * 使用 ModernModuleLoader 加载所有模块并启动应用
 */

// 应用启动器（已统一使用 ModernModuleLoader，移除旧的 ModuleLoader）
class AppStarter {
    static async start() {
        console.log('🚀 启动UI预览工具...');
        
        try {
            // 1. 加载所有模块（使用现代化加载器）
            await ModernModuleLoader.loadAll();
            
            // 2. 启动应用
            const app = initApp();
            
            // 3. 等待应用初始化完成
            await new Promise((resolve, reject) => {
                const checkInit = setInterval(() => {
                    if (app.isInitialized) {
                        clearInterval(checkInit);
                        resolve();
                    }
                }, 100);
                
                // 超时处理
                setTimeout(() => {
                    clearInterval(checkInit);
                    reject(new Error('应用初始化超时'));
                }, 5000);
            });
            
            console.log('🎉 UI预览工具启动成功！');
            
            // 4. 导出全局变量供调试
            window.App = app;
            window.Scaler = Scaler;
            // UIStorageManager 已在 Storage.js 中通过 window.UIStorageManager = Storage 导出，无需重复赋值
            
            // 4.5. 恢复壁纸/桌面层图片（从 IndexedDB）
            if (typeof _restoreLayerImages === 'function') {
                _restoreLayerImages();
            }
            
            // 5. 显示欢迎信息
            this._showWelcome();
            
        } catch (error) {
            console.error('❌ 应用启动失败:', error);
            this._showError(error);
        }
    }
    
    static _showWelcome() {
        console.log(`
╔══════════════════════════════════════════════════════╗
║             🎨 UI预览工具 v1.0.0                    ║
║                                                      ║
║  功能特性:                                           ║
║  • 基于2560×1440基准分辨率的像素级缩放             ║
║  • 状态栏组件（带硬阴影系统）                       ║
║  • 实时编辑器（位置/尺寸/阴影/颜色）                ║
║  • 配置持久化（本地存储）                           ║
║  • 响应式布局（窗口大小自适应）                     ║
║                                                      ║
║  快捷键:                                            ║
║  • \`\` 键 - 切换编辑面板                            ║
║                                                      ║
║  调试信息:                                          ║
║  • 在控制台输入 App.getStatus() 查看应用状态       ║
║  • 在控制台输入 App.exportConfig() 导出配置       ║
║  • 在控制台输入 App.reset() 重置应用               ║
╚══════════════════════════════════════════════════════╝
        `);
    }
    
    static _showError(error) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 50, 50, 0.9);
            color: white;
            padding: 30px;
            border-radius: 10px;
            z-index: 9999;
            max-width: 500px;
            text-align: center;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        `;
        
        errorDiv.innerHTML = `
            <h3 style="margin-top:0;color:#ffcccc">❌ 应用启动失败</h3>
            <p style="margin: 15px 0;font-family:monospace">${error.message}</p>
            <p style="font-size:14px">请检查控制台查看详细错误信息。</p>
            <button onclick="location.reload()" style="
                background: white;
                color: #ff3333;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                margin-top: 15px;
            ">🔄 重新加载</button>
        `;
        
        document.body.appendChild(errorDiv);
    }
}

// DOM加载完成后启动应用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        AppStarter.start();
    });
} else {
    // DOM已加载完成
    AppStarter.start();
}

// 统一导出模式
if (typeof window !== 'undefined') {
    window.AppStarter = AppStarter;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AppStarter };
}