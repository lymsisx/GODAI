/**
 * UI预览工具主应用模块
 * 整合缩放、UI元素管理、编辑模式等功能
 */
class App {
    constructor() {
        this.uiManager = null;
        this.statusBar = null;
        this.editorManager = null;
        this.isInitialized = false;
    }

    /**
     * 初始化应用
     */
    async init() {
        try {
            console.log('🚀 初始化UI预览工具...');
            
            // 1. 初始化缩放器
            console.log('📏 初始化缩放系统...');
            this._initScaler();
            
            // 2. 加载配置
            console.log('⚙️ 加载配置...');
            await this._loadConfig();
            
            // 3. 初始化UI管理器
            console.log('🖥️ 初始化UI管理器...');
            this.uiManager = new UIManager();
            
            // 4. 创建所有UI元素
            console.log('📊 创建UI元素...');
            
            // 注册状态栏（专用类型，支持阴影和特殊配置）
            const statusBarConfig = { id: 'statusBar', type: 'status-bar' };
            const statusBarInstance = this.uiManager.registerElement(statusBarConfig);
            if (statusBarInstance) {
                this.statusBar = statusBarInstance;
            }
            
            // 注册其他UI元素（通用类型，暂用基类）
            const genericElements = [
                { 
                    id: 'buttons', 
                    type: 'generic', 
                    name: '按钮区', 
                    defaultImage: 'assets/buttons/default.png',
                    basePosition: { x: 2000, y: 1200 },  // 右下角
                    baseSize: { width: 400, height: 150 }
                },
                { 
                    id: 'chatBox', 
                    type: 'generic', 
                    name: '聊天框', 
                    defaultImage: 'assets/chatbox/default.png',
                    basePosition: { x: 100, y: 1200 },  // 左下角
                    baseSize: { width: 500, height: 200 }
                },
                { 
                    id: 'popupTip', 
                    type: 'generic', 
                    name: '弹出提示', 
                    defaultImage: 'assets/popuptip/default.png',
                    basePosition: { x: 1100, y: 50 },  // 顶部居中
                    baseSize: { width: 400, height: 100 }
                },
                { 
                    id: 'floatWindow1', 
                    type: 'generic', 
                    name: '其他浮窗1', 
                    defaultImage: 'assets/floatwindow1/default.png',
                    basePosition: { x: 2100, y: 200 },  // 右上角
                    baseSize: { width: 350, height: 400 }
                },
                { 
                    id: 'moodUI', 
                    type: 'generic', 
                    name: '心情UI', 
                    defaultImage: 'assets/moodui/default.png',
                    basePosition: { x: 2200, y: 100 },  // 顶部右侧
                    baseSize: { width: 250, height: 80 }
                },
                { 
                    id: 'referenceDesktop', 
                    type: 'generic', 
                    name: '参考桌面', 
                    defaultImage: null,
                    basePosition: { x: 0, y: 0 },  // 全屏覆盖
                    baseSize: { width: 2560, height: 1440 },
                    zIndex: -100  // 在壁纸之上，其他UI之下
                }
            ];
            
            genericElements.forEach(elementConfig => {
                this.uiManager.registerElement(elementConfig);
            });
            
            console.log(`✅ 已注册 ${this.uiManager.elements.size} 个UI元素`);
            
            // 5. 初始化编辑器
            console.log('✏️ 初始化编辑器...');
            this._initEditor();
            
            // 6. 设置事件监听
            console.log('🔗 设置事件监听...');
            this._setupEventListeners();
            
            // 7. 首次渲染
            console.log('🎨 首次渲染...');
            this.uiManager.renderAll();
            
            // 8. 更新缩放信息
            this._updateScaleInfo();
            
            this.isInitialized = true;
            console.log('✅ UI预览工具初始化完成！');
            console.log(Scaler.getScaleInfo());
            
        } catch (error) {
            console.error('❌ 应用初始化失败:', error);
            alert('应用初始化失败: ' + error.message);
        }
    }

    /**
     * 初始化缩放系统
     */
    _initScaler() {
        // Scaler类已全局可用
        console.log('基准分辨率:', Scaler.BASE_WIDTH, '×', Scaler.BASE_HEIGHT);
        console.log('当前分辨率:', window.innerWidth, '×', window.innerHeight);
        console.log('缩放比例:', Scaler.getScale().toFixed(3));
    }

    /**
     * 加载配置
     */
    async _loadConfig() {
        try {
            // 安全加载：UIStorageManager 模块可能未就绪
            const savedConfig = (typeof UIStorageManager !== 'undefined' && typeof UIStorageManager.loadConfig === 'function')
                ? UIStorageManager.loadConfig(null)
                : null;
            
            if (savedConfig && savedConfig.statusBar) {
                console.log('📂 加载已保存的状态栏配置:', savedConfig.statusBar);
                // 配置会在StatusBarUI创建时通过_loadSavedConfig()应用
            } else {
                console.log('📂 使用默认配置（首次运行）');
                // 注意：不再写入默认配置到存储，避免覆盖用户自定义配置
                // 默认配置由各组件的 defaultConfig 提供
            }
            
        } catch (error) {
            console.warn('⚠️ 配置加载失败，使用默认配置:', error);
        }
    }

    /**
     * 初始化编辑器
     */
    _initEditor() {
        try {
            // 创建编辑器管理器
            this.editorManager = new EditorManager(this);
            console.log('👨‍💼 编辑器管理器初始化完成');
        } catch (error) {
            console.error('❌ 编辑器管理器初始化失败:', error);
            
            // 向后兼容：使用旧版状态栏编辑器
            try {
                this.editor = new StatusBarEditor(this.statusBar);
                console.log('⚠️ 使用旧版状态栏编辑器作为备选');
            } catch (fallbackError) {
                console.error('❌ 旧版编辑器也初始化失败:', fallbackError);
            }
        }
    }

    /**
     * 设置事件监听
     */
    _setupEventListeners() {
        // 窗口大小改变时重新渲染
        window.addEventListener('resize', () => {
            this._handleResize();
        });

        // 快捷键监听：反引号键切换编辑模式（由EditorManager统一处理）

        // 编辑按钮点击事件由 index.html 的 onclick="toggleEdit()" 统一处理
        // EditorManager 的 _bindGlobalShortcuts() 负责快捷键
        // 这里不再重复绑定 editBtn 的 click 事件，避免重复触发

        console.log('🔗 事件监听器已设置');
    }

    /**
     * 处理窗口大小改变
     */
    _handleResize() {
        console.log('🔄 窗口大小改变:', window.innerWidth, '×', window.innerHeight);
        
        // 重新渲染所有UI元素
        if (this.uiManager) {
            this.uiManager.renderAll();
        }
        
        // 更新缩放信息显示
        this._updateScaleInfo();
    }

    /**
     * 切换编辑面板（委托给EditorManager）
     */
    _toggleEditPanel() {
        if (this.editorManager) {
            this.editorManager.toggleEditMode();
        }
    }

    /**
     * 更新缩放信息显示
     */
    _updateScaleInfo() {
        const infoDiv = document.getElementById('scaleInfo');
        if (!infoDiv) {
            // 创建缩放信息显示元素
            const div = document.createElement('div');
            div.id = 'scaleInfo';
            div.style.cssText = `
                position: fixed;
                bottom: 10px;
                left: 10px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 12px;
                font-family: monospace;
                z-index: 9999;
                max-width: 300px;
                white-space: pre-line;
            `;
            document.body.appendChild(div);
        }
        
        const scale = Scaler.getScale();
        const actualWidth = Scaler.BASE_WIDTH * scale;
        const actualHeight = Scaler.BASE_HEIGHT * scale;
        
        document.getElementById('scaleInfo').innerHTML = `
            <strong>缩放信息</strong><br>
            基准: ${Scaler.BASE_WIDTH}×${Scaler.BASE_HEIGHT}<br>
            当前: ${window.innerWidth}×${window.innerHeight}<br>
            缩放: ${scale.toFixed(3)}<br>
            状态栏尺寸: ${Math.round(Scaler.toActual(2000))}×${Math.round(Scaler.toActual(200))}px
        `;
    }

    /**
     * 获取应用状态
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            scale: Scaler.getScale(),
            windowSize: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            uiElements: this.uiManager ? this.uiManager.elements.size : 0,
            configLoaded: !!(window.UIStorageManager && window.UIStorageManager.load('ui_statusbar_config', null))
        };
    }

    /**
     * 重置应用
     */
    reset() {
        if (confirm('确定要重置所有配置吗？这将清除所有自定义设置。')) {
            // 清除本地存储
            if (window.UIStorageManager && typeof window.UIStorageManager.remove === 'function') {
                window.UIStorageManager.remove('ui_statusbar_config');
            }
            
            // 重新加载页面
            window.location.reload();
        }
    }

    /**
     * 导出配置（包含图片打包为 ZIP）
     * 从 IndexedDB 读取每个元素的图片 base64，转为文件存入 ZIP 的 images/ 目录，
     * config.json 中记录每个元素的 imagePath 相对路径。
     */
    async exportConfig() {
        // 检查 JSZip 是否可用
        if (typeof JSZip === 'undefined') {
            alert('JSZip 库未加载，无法导出。请检查网络连接。');
            return;
        }

        const zip = new JSZip();
        const imagesFolder = zip.folder('images');

        // 构建基础配置
        const elements = this.uiManager
            ? Array.from(this.uiManager.elements.values())
            : [];

        const elementConfigs = [];

        for (const el of elements) {
            const cfg = el.getConfig();

            // 尝试从 IndexedDB 读取图片
            let imageDataUrl = el.config.image || null;
            if (!imageDataUrl && window.UIStorageManager &&
                typeof window.UIStorageManager.loadImageAsync === 'function') {
                try {
                    imageDataUrl = await window.UIStorageManager.loadImageAsync(el.id);
                } catch (_) {}
            }

            if (imageDataUrl && imageDataUrl.startsWith('data:')) {
                // 解析 MIME 类型确定扩展名
                const mimeMatch = imageDataUrl.match(/^data:(image\/\w+);base64,/);
                let ext = 'png';
                if (mimeMatch) {
                    const mime = mimeMatch[1];
                    if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
                    else if (mime.includes('gif')) ext = 'gif';
                    else if (mime.includes('webp')) ext = 'webp';
                    else if (mime.includes('bmp')) ext = 'bmp';
                }

                const fileName = `${el.id}.${ext}`;
                const relativePath = `images/${fileName}`;

                // 将 base64 转为二进制数据加入 ZIP
                const base64Data = imageDataUrl.split(',')[1];
                imagesFolder.file(fileName, base64Data, { base64: true });

                cfg.imagePath = relativePath;
            }

            elementConfigs.push(cfg);
        }

        const config = {
            version: '2.0.0',
            timestamp: new Date().toISOString(),
            baseResolution: {
                width: Scaler.BASE_WIDTH,
                height: Scaler.BASE_HEIGHT
            },
            currentResolution: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            scale: Scaler.getScale(),
            statusBar: this.statusBar ? this.statusBar.getConfig() : null,
            uiElements: elementConfigs,
            layers: {}
        };

        // 导出壁纸/桌面层图片
        const layerKeys = [
            { configKey: 'wallpaper', idbKey: '_layer_wallpaper' },
            { configKey: 'desktopLayer', idbKey: '_layer_desktopLayer' }
        ];
        for (const layer of layerKeys) {
            if (window.UIStorageManager && typeof window.UIStorageManager.loadImageAsync === 'function') {
                try {
                    const layerDataUrl = await window.UIStorageManager.loadImageAsync(layer.idbKey);
                    if (layerDataUrl && layerDataUrl.startsWith('data:')) {
                        const mimeMatch = layerDataUrl.match(/^data:(image\/\w+);base64,/);
                        let ext = 'png';
                        if (mimeMatch) {
                            const mime = mimeMatch[1];
                            if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
                            else if (mime.includes('bmp')) ext = 'bmp';
                        }
                        const fileName = `${layer.configKey}.${ext}`;
                        const relativePath = `images/${fileName}`;
                        const base64Data = layerDataUrl.split(',')[1];
                        imagesFolder.file(fileName, base64Data, { base64: true });
                        config.layers[layer.configKey] = relativePath;
                    }
                } catch (_) {}
            }
        }

        zip.file('config.json', JSON.stringify(config, null, 2));

        // 生成 ZIP 并触发下载
        try {
            const blob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ui-preview-config-${new Date().toISOString().slice(0, 10)}.zip`;
            a.click();
            URL.revokeObjectURL(url);

            console.log('📤 配置已导出（ZIP 包含图片）:', config);
            alert(`配置已导出为 ZIP 文件！包含 ${elementConfigs.filter(c => c.imagePath).length} 张图片。`);
        } catch (err) {
            console.error('❌ ZIP 打包失败:', err);
            alert('导出失败: ' + err.message);
        }
    }
}

// 初始化应用（使用全局 appInstance，由 index.html 内联脚本初始化为 null）
function initApp() {
    if (!window.appInstance) {
        window.appInstance = new App();
        window.appInstance.init();
    }
    return window.appInstance;
}

// 导出应用类
// 统一导出模式：同时支持浏览器和Node.js环境
if (typeof window !== 'undefined') {
    window.App = App;
    window.initApp = initApp;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { App, initApp };
}