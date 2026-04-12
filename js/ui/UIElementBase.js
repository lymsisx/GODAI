/**
 * UI元素基类
 * 所有UI组件的基类，提供通用功能
 */
class UIElementBase {
    /**
     * 构造函数
     * @param {Object} config 元素配置
     * @param {string} config.id 元素ID
     * @param {string} config.type 元素类型
     * @param {Object} config.basePosition 基准位置 {x, y}
     * @param {Object} config.baseSize 基准尺寸 {width, height}
     * @param {number} config.zIndex 层级索引
     */
    constructor(config) {
        this.id = config.id;
        this.type = config.type;
        this.config = config;
        this.domElement = null;
        this.shadowElement = null;
        
        // 默认配置
        this.defaultConfig = {
            basePosition: { x: 0, y: 0 },
            baseSize: { width: 100, height: 100 },
            zIndex: 100,
            visible: true,
            opacity: 1,
            backgroundColor: 'transparent',
            objectFit: 'cover'
        };
        
        // 合并配置
        this.config = { ...this.defaultConfig, ...config };
        
        // 从Storage加载已保存配置（在渲染前）
        this._loadSavedConfig();
    }
    
    /**
     * 从Storage加载已保存配置（私有方法）
     * 处理扁平配置转换为嵌套配置
     * 注意：图片从 IndexedDB 异步加载，加载完成后自动更新 img.src
     */
    _loadSavedConfig() {
        try {
            const UIStorageManager = window.UIStorageManager;
            if (UIStorageManager && typeof UIStorageManager.loadElementConfig === 'function') {
                const savedConfig = UIStorageManager.loadElementConfig(this.id, null);
                if (savedConfig && typeof savedConfig === 'object' && Object.keys(savedConfig).length > 0) {
                    // 处理扁平配置转换为嵌套配置
                    if (savedConfig.x !== undefined && savedConfig.y !== undefined) {
                        this.config.basePosition = { x: savedConfig.x, y: savedConfig.y };
                    }
                    if (savedConfig.width !== undefined && savedConfig.height !== undefined) {
                        this.config.baseSize = { width: savedConfig.width, height: savedConfig.height };
                    }
                    if (savedConfig.shadow) {
                        this.config.shadow = savedConfig.shadow;
                    }
                    if (savedConfig.zIndex !== undefined) {
                        this.config.zIndex = savedConfig.zIndex;
                    }
                    if (savedConfig.visible !== undefined) {
                        this.config.visible = savedConfig.visible;
                    }
                    if (savedConfig.objectFit !== undefined) {
                        this.config.objectFit = savedConfig.objectFit;
                    }
                    if (savedConfig.name !== undefined) {
                        this.config.name = savedConfig.name;
                    }
                    if (savedConfig.backgroundColor !== undefined) {
                        this.config.backgroundColor = savedConfig.backgroundColor;
                    }

                    // 图片加载优先级：IndexedDB > localStorage 旧 key > config.image 旧字段
                    const tryLoadImage = async () => {
                        // 1. 尝试 IndexedDB（新方案，无大小限制）
                        if (typeof UIStorageManager.loadImageAsync === 'function') {
                            const idbImage = await UIStorageManager.loadImageAsync(this.id);
                            if (idbImage) {
                                this._applyRestoredImage(idbImage);
                                return;
                            }
                        }
                        // 2. 回退：尝试 localStorage 独立 key（上一版遗留数据）
                        if (typeof UIStorageManager.loadImage === 'function') {
                            const lsImage = UIStorageManager.loadImage(this.id);
                            if (lsImage) {
                                this._applyRestoredImage(lsImage);
                                // 顺手迁移到 IndexedDB，并清除旧 key
                                if (typeof UIStorageManager.saveImageAsync === 'function') {
                                    UIStorageManager.saveImageAsync(this.id, lsImage).then(() => {
                                        try { localStorage.removeItem('ui_preview_image_' + this.id); } catch (_) {}
                                    });
                                }
                                return;
                            }
                        }
                        // 3. 回退：config.image 旧字段（更早版本遗留数据）
                        if (savedConfig.image) {
                            this._applyRestoredImage(savedConfig.image);
                        }
                    };

                    tryLoadImage().catch(err => console.warn('⚠️ 图片恢复失败:', err));

                    console.log(`📂 已从UIStorageManager加载元素 ${this.id} 的配置`);
                }
            }
        } catch (error) {
            console.warn('⚠️ 构造时配置加载失败:', error.message);
        }
    }

    /**
     * 将恢复的图片 DataURL 应用到元素（供 _loadSavedConfig 异步回调使用）
     * @param {string} dataUrl
     * @private
     */
    _applyRestoredImage(dataUrl) {
        this.config.image = dataUrl;
        // 如果 DOM 已渲染，直接更新 img.src（异步加载完成时 DOM 可能已存在）
        if (this.imageElement) {
            this.imageElement.src = dataUrl;
        } else if (this.domElement) {
            // 尚无 img 节点，就地挂载
            const img = document.createElement('img');
            img.className = 'generic-ui-image';
            img.src = dataUrl;
            img.alt = this.config.name || this.id;
            img.draggable = false;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = this.config.objectFit || 'cover';
            img.style.pointerEvents = 'none';
            if (this.textElement) { this.textElement.remove(); this.textElement = null; }
            this.domElement.appendChild(img);
            this.imageElement = img;
            this.domElement.style.backgroundColor = 'transparent';
        }
    }
    
    /**
     * 渲染元素（通用实现）
     */
    render() {
        console.log(`🎨 渲染元素 ${this.id} (${this.type})`);
        
        // 创建容器
        const container = this.createContainer();
        container.className = 'generic-ui-element';
        this.domElement = container;
        
        // 设置基本样式
        container.style.position = 'absolute';
        container.style.zIndex = this.config.zIndex;
        container.style.visibility = this.config.visible ? 'visible' : 'hidden';
        container.style.opacity = this.config.opacity;
        container.style.backgroundColor = this.config.backgroundColor;
        
        // 如果有图片，创建图片元素
        if (this.config.image || this.config.defaultImage) {
            const imageSrc = this.config.image || this.config.defaultImage;
            this.imageElement = document.createElement('img');
            this.imageElement.className = 'generic-ui-image';
            this.imageElement.src = imageSrc;
            this.imageElement.alt = this.config.name || this.id;
            this.imageElement.draggable = false; // 禁止浏览器原生图片拖拽
            this.imageElement.style.width = '100%';
            this.imageElement.style.height = '100%';
            this.imageElement.style.pointerEvents = 'none'; // 点击穿透到 container，保证自定义拖拽
            this.imageElement.style.objectFit = this.config.objectFit || 'cover';
            container.appendChild(this.imageElement);
            console.log(`📸 添加图片: ${imageSrc}`);
        } else if (this.config.text) {
            // 如果没有图片但有文本，显示文本
            this.textElement = document.createElement('div');
            this.textElement.className = 'generic-ui-text';
            this.textElement.textContent = this.config.text;
            this.textElement.style.position = 'absolute';
            this.textElement.style.top = '50%';
            this.textElement.style.left = '50%';
            this.textElement.style.transform = 'translate(-50%, -50%)';
            this.textElement.style.color = 'white';
            this.textElement.style.fontSize = '16px';
            this.textElement.style.fontWeight = 'normal';
            this.textElement.style.textShadow = '1px 1px 2px rgba(0,0,0,0.5)';
            container.appendChild(this.textElement);
            console.log(`📝 添加文本: ${this.config.text}`);
        } else {
            // 既无图片也无文本，显示占位符
            this.textElement = document.createElement('div');
            this.textElement.className = 'generic-ui-placeholder';
            this.textElement.textContent = this.config.name || this.id || 'UI元素';
            this.textElement.style.position = 'absolute';
            this.textElement.style.top = '50%';
            this.textElement.style.left = '50%';
            this.textElement.style.transform = 'translate(-50%, -50%)';
            this.textElement.style.color = '#666';
            this.textElement.style.fontSize = '14px';
            container.appendChild(this.textElement);
            console.log(`🔄 显示占位符: ${this.id}`);
        }
        
        // 应用缩放
        this.applyScale();
        
        // 应用阴影（如果配置了阴影）
        if (this.config.shadow) {
            this.applyShadow(this.config.shadow);
        }
        
        // 将容器添加到body
        document.body.appendChild(container);
        
        // 注意：render() 不主动调用 saveConfig()
        // 配置保存由用户操作（拖拽、编辑、上传图片）触发，避免注册时触发存图炸 localStorage
        
        console.log(`✅ 元素 ${this.id} 渲染完成`);
    }
    
    /**
     * 创建DOM容器
     * @returns {HTMLElement} 创建的DOM元素
     */
    createContainer() {
        const container = document.createElement('div');
        container.id = this.id + 'Container';
        container.className = 'ui-element-container';
        container.dataset.type = this.type;
        container.dataset.elementId = this.id;
        
        // 设置样式
        container.style.position = 'fixed';
        container.style.pointerEvents = 'auto'; // 允许交互
        
        return container;
    }
    
    /**
     * 应用缩放
     */
    applyScale() {
        if (!this.domElement) return;
        
        const Scaler = window.Scaler;
        if (!Scaler) {
            console.error('Scaler未加载');
            return;
        }
        
        // 计算实际位置和尺寸
        const actualPosition = Scaler.scalePosition(
            this.config.basePosition.x,
            this.config.basePosition.y
        );
        
        const actualSize = Scaler.scaleSize(
            this.config.baseSize.width,
            this.config.baseSize.height
        );
        
        // 应用位置
        this.domElement.style.left = `${actualPosition.x}px`;
        this.domElement.style.top = `${actualPosition.y}px`;
        
        // 应用尺寸
        this.domElement.style.width = `${actualSize.width}px`;
        this.domElement.style.height = `${actualSize.height}px`;
        
        // 应用层级
        this.domElement.style.zIndex = this.config.zIndex;
        
        // 应用可见性
        this.domElement.style.display = this.config.visible ? 'block' : 'none';
        
        // 应用透明度
        this.domElement.style.opacity = this.config.opacity;
        
        // 应用背景色
        this.domElement.style.backgroundColor = this.config.backgroundColor;
    }
    
    /**
     * 应用阴影效果
     * @param {Object} shadowConfig 阴影配置
     * @param {number} shadowConfig.offsetX X轴偏移
     * @param {number} shadowConfig.offsetY Y轴偏移
     * @param {string} shadowConfig.color 阴影颜色
     * @param {number} shadowConfig.opacity 阴影透明度
     */
    applyShadow(shadowConfig) {
        if (!shadowConfig || !this.domElement) return;
        
        // 确保阴影元素存在
        if (!this.shadowElement) {
            this.shadowElement = document.createElement('div');
            this.shadowElement.className = 'ui-element-shadow';
            this.shadowElement.dataset.elementId = this.id;
            this.shadowElement.dataset.type = 'shadow';
            
            // 插入到容器前面
            if (this.domElement.parentNode) {
                this.domElement.parentNode.insertBefore(this.shadowElement, this.domElement);
            }
        }
        
        const Scaler = window.Scaler;
        if (!Scaler) {
            console.error('Scaler未加载');
            return;
        }
        
        // 计算实际位置和尺寸
        const actualPosition = Scaler.scalePosition(
            this.config.basePosition.x,
            this.config.basePosition.y
        );
        
        const actualSize = Scaler.scaleSize(
            this.config.baseSize.width,
            this.config.baseSize.height
        );
        
        // 计算阴影位置（向右下角偏移）
        const actualOffsetX = Scaler.toActual(shadowConfig.offsetX || 0);
        const actualOffsetY = Scaler.toActual(shadowConfig.offsetY || 0);
        
        // 设置阴影样式
        this.shadowElement.style.position = 'fixed';
        this.shadowElement.style.left = `${actualPosition.x + actualOffsetX}px`;
        this.shadowElement.style.top = `${actualPosition.y + actualOffsetY}px`;
        this.shadowElement.style.width = `${actualSize.width}px`;
        this.shadowElement.style.height = `${actualSize.height}px`;
        this.shadowElement.style.backgroundColor = shadowConfig.color || 'rgba(0, 0, 0, 0.5)';
        this.shadowElement.style.opacity = shadowConfig.opacity || 0.7;
        this.shadowElement.style.zIndex = (this.config.zIndex || 100) - 1; // 低于主层
        this.shadowElement.style.pointerEvents = 'none'; // 阴影不响应鼠标事件
        this.shadowElement.style.display = this.config.visible ? 'block' : 'none';
    }
    
    /**
     * 更新配置
     * @param {Object} newConfig 新配置
     */
    update(newConfig) {
        // 合并配置
        this.config = { ...this.config, ...newConfig };
        
        // 重新应用样式
        this.applyScale();
        
        // 如果有阴影配置，应用阴影
        if (this.config.shadow) {
            this.applyShadow(this.config.shadow);
        }
        
        // 保存配置
        this.saveConfig();
    }
    
    /**
     * 保存配置到本地存储
     * 图片 base64 走 IndexedDB（无大小限制），其他配置走 localStorage。
     */
    saveConfig() {
        try {
            const UIStorageManager = window.UIStorageManager;
            if (UIStorageManager && typeof UIStorageManager.saveElementConfig === 'function') {
                // 剥离 image 字段，config 对象只存非图片数据到 localStorage
                const imageDataUrl = this.config.image;
                const configToSave = { ...this.config };
                delete configToSave.image;
                UIStorageManager.saveElementConfig(this.id, configToSave);

                // 图片走 IndexedDB（异步，不阻塞）
                if (typeof UIStorageManager.saveImageAsync === 'function') {
                    if (imageDataUrl) {
                        UIStorageManager.saveImageAsync(this.id, imageDataUrl).catch(err => {
                            console.warn('⚠️ IndexedDB 存图失败:', err);
                        });
                    } else {
                        // 清除图片时同步删除 IndexedDB 记录
                        if (typeof UIStorageManager.removeImageAsync === 'function') {
                            UIStorageManager.removeImageAsync(this.id).catch(() => {});
                        }
                        // 兼容：也清除旧的 localStorage 独立 key
                        try { localStorage.removeItem('ui_preview_image_' + this.id); } catch (_) {}
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ 配置保存失败（存储模块可能未就绪）:', error.message);
        }
    }
    
    /**
     * 从本地存储加载配置
     */
    loadConfig() {
        try {
            const UIStorageManager = window.UIStorageManager;
            if (UIStorageManager && typeof UIStorageManager.loadElementConfig === 'function') {
                const savedConfig = UIStorageManager.loadElementConfig(this.id, this.config);
                if (savedConfig && typeof savedConfig === 'object') {
                    this.config = { ...this.config, ...savedConfig };
                }
            }
        } catch (error) {
            console.warn('⚠️ 配置加载失败（存储模块可能未就绪）:', error.message);
        }
    }
    
    /**
     * 显示元素
     */
    show() {
        this.config.visible = true;
        if (this.domElement) {
            this.domElement.style.display = 'block';
        }
        if (this.shadowElement) {
            this.shadowElement.style.display = 'block';
        }
        this.saveConfig();
    }
    
    /**
     * 隐藏元素
     */
    hide() {
        this.config.visible = false;
        if (this.domElement) {
            this.domElement.style.display = 'none';
        }
        if (this.shadowElement) {
            this.shadowElement.style.display = 'none';
        }
        this.saveConfig();
    }
    
    /**
     * 切换显示/隐藏
     */
    toggle() {
        if (this.config.visible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    /**
     * 设置位置
     * @param {number} x 基准X坐标
     * @param {number} y 基准Y坐标
     */
    setPosition(x, y) {
        this.config.basePosition = { x, y };
        this.applyScale();
        if (this.config.shadow) {
            this.applyShadow(this.config.shadow);
        }
        this.saveConfig();
    }
    
    /**
     * 设置尺寸
     * @param {number} width 基准宽度
     * @param {number} height 基准高度
     */
    setSize(width, height) {
        this.config.baseSize = { width, height };
        this.applyScale();
        if (this.config.shadow) {
            this.applyShadow(this.config.shadow);
        }
        this.saveConfig();
    }

    /**
     * 更新图片
     * @param {string} imageSrc 图片URL或DataURL
     */
    updateImage(imageSrc) {
        console.log(`🖼️ 更新元素 ${this.id} 的图片:`, imageSrc ? imageSrc.substring(0, 50) + '...' : '空（清除）');
        
        this.config.image = imageSrc || null;

        if (!imageSrc) {
            // 清除图片：移除 img 节点，显示 backgroundColor
            if (this.imageElement) {
                this.imageElement.remove();
                this.imageElement = null;
            }
            // 还原为配置的背景色，默认粉色
            if (!this.config.backgroundColor || this.config.backgroundColor === 'transparent') {
                this.config.backgroundColor = '#ff6b9d';
            }
            if (this.domElement) {
                this.domElement.style.backgroundColor = this.config.backgroundColor;
            }
        } else if (this.imageElement) {
            // 已有 img 节点，直接换 src
            this.imageElement.src = imageSrc;
            this.config.backgroundColor = 'transparent';
            if (this.domElement) {
                this.domElement.style.backgroundColor = 'transparent';
            }
        } else {
            // 尚无 img 节点：就地创建并挂到现有 container，不重建 DOM（避免拖拽事件丢失）
            this.config.backgroundColor = 'transparent';
            if (this.domElement) {
                this.domElement.style.backgroundColor = 'transparent';
                const img = document.createElement('img');
                img.className = 'generic-ui-image';
                img.src = imageSrc;
                img.alt = this.config.name || this.id;
                img.draggable = false;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = this.config.objectFit || 'cover';
                img.style.pointerEvents = 'none';
                // 移除旧的占位文字（如果有）
                if (this.textElement) {
                    this.textElement.remove();
                    this.textElement = null;
                }
                this.domElement.appendChild(img);
                this.imageElement = img;
                console.log(`📸 就地挂载图片节点: ${this.id}`);
            } else {
                // domElement 尚未创建，走完整渲染流程
                this.render();
            }
        }
        
        this.saveConfig();

        // 同步自定义组件列表中的 image/backgroundColor（上传图片后持久化）
        this._syncCustomElementImage();

        console.log(`✅ 元素 ${this.id} 图片更新完成`);
    }
    
    /**
     * 设置阴影
     * @param {number} offsetX X轴偏移
     * @param {number} offsetY Y轴偏移
     * @param {string} color 阴影颜色
     * @param {number} opacity 阴影透明度
     */
    setShadow(offsetX, offsetY, color, opacity = 0.7) {
        this.config.shadow = {
            offsetX,
            offsetY,
            color,
            opacity
        };
        this.applyShadow(this.config.shadow);
        this.saveConfig();
    }
    
    /**
     * 移除阴影
     */
    removeShadow() {
        if (this.shadowElement) {
            this.shadowElement.remove();
            this.shadowElement = null;
        }
        delete this.config.shadow;
        this.saveConfig();
    }
    
    /**
     * 获取当前实际像素位置
     * @returns {{x: number, y: number}} 实际位置
     */
    getActualPosition() {
        const Scaler = window.Scaler;
        if (!Scaler) return { x: 0, y: 0 };
        
        return Scaler.scalePosition(
            this.config.basePosition.x,
            this.config.basePosition.y
        );
    }
    
    /**
     * 获取当前实际像素尺寸
     * @returns {{width: number, height: number}} 实际尺寸
     */
    getActualSize() {
        const Scaler = window.Scaler;
        if (!Scaler) return { width: 0, height: 0 };
        
        return Scaler.scaleSize(
            this.config.baseSize.width,
            this.config.baseSize.height
        );
    }
    
    // ─────────────────────────────────────────────
    // 拖动系统
    // ─────────────────────────────────────────────

    /**
     * 启用拖动（编辑模式下由 EditorManager 调用）
     */
    enableDrag() {
        if (this._dragEnabled) return;
        this._dragEnabled = true;
        this._isDragging = false;
        this._dragStartMouseX = 0;
        this._dragStartMouseY = 0;
        this._dragStartLeft = 0;
        this._dragStartTop = 0;

        // 阻止浏览器原生拖拽（img/a 等元素的默认 drag 行为）
        this._onDragStart = (e) => { e.preventDefault(); };
        this.domElement.addEventListener('dragstart', this._onDragStart);
        // 阻止文本选择干扰
        this._onSelectStart = (e) => { e.preventDefault(); };
        this.domElement.addEventListener('selectstart', this._onSelectStart);

        this._onMouseDown = (e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();

            this._isDragging = true;
            this._dragStartMouseX = e.clientX;
            this._dragStartMouseY = e.clientY;
            this._dragStartLeft = parseFloat(this.domElement.style.left) || 0;
            this._dragStartTop  = parseFloat(this.domElement.style.top)  || 0;

            // 拖动中样式
            this.domElement.style.cursor = 'grabbing';
            this.domElement.style.userSelect = 'none';
            this.domElement.style.zIndex = String((parseInt(this.config.zIndex) || 100) + 5000);

            document.addEventListener('mousemove', this._onMouseMove);
            document.addEventListener('mouseup',   this._onMouseUp);
        };

        this._onMouseMove = (e) => {
            if (!this._isDragging) return;
            const dx = e.clientX - this._dragStartMouseX;
            const dy = e.clientY - this._dragStartMouseY;
            this.domElement.style.left = `${this._dragStartLeft + dx}px`;
            this.domElement.style.top  = `${this._dragStartTop  + dy}px`;

            // 同步阴影
            if (this.shadowElement) {
                const Scaler = window.Scaler;
                const ox = Scaler ? Scaler.toActual(this.config.shadow?.offsetX || 0) : 0;
                const oy = Scaler ? Scaler.toActual(this.config.shadow?.offsetY || 0) : 0;
                this.shadowElement.style.left = `${this._dragStartLeft + dx + ox}px`;
                this.shadowElement.style.top  = `${this._dragStartTop  + dy + oy}px`;
            }
        };

        this._onMouseUp = () => {
            if (!this._isDragging) return;
            this._isDragging = false;

            // 恢复样式
            this.domElement.style.cursor = 'grab';
            this.domElement.style.userSelect = '';
            this.domElement.style.zIndex = String(this.config.zIndex || 100);

            // 将实际像素坐标反算为基准坐标
            const actualLeft = parseFloat(this.domElement.style.left) || 0;
            const actualTop  = parseFloat(this.domElement.style.top)  || 0;
            const Scaler = window.Scaler;
            if (Scaler && typeof Scaler.toBase === 'function') {
                this.config.basePosition = {
                    x: Scaler.toBase(actualLeft),
                    y: Scaler.toBase(actualTop)
                };
            }

            // 持久化
            this.saveConfig();

            // 同步自定义组件列表中的 x/y
            this._syncCustomElementPosition();

            // 通知编辑器面板刷新
            this.domElement.dispatchEvent(new CustomEvent('ui-element-dragged', {
                bubbles: true,
                detail: {
                    id: this.id,
                    x: this.config.basePosition.x,
                    y: this.config.basePosition.y
                }
            }));

            document.removeEventListener('mousemove', this._onMouseMove);
            document.removeEventListener('mouseup',   this._onMouseUp);
        };

        this.domElement.addEventListener('mousedown', this._onMouseDown);
        this.domElement.style.cursor = 'grab';
    }

    /**
     * 禁用拖动
     */
    disableDrag() {
        if (!this._dragEnabled) return;
        this._dragEnabled = false;
        if (this._onMouseDown) {
            this.domElement.removeEventListener('mousedown', this._onMouseDown);
        }
        if (this._onDragStart) {
            this.domElement.removeEventListener('dragstart', this._onDragStart);
        }
        if (this._onSelectStart) {
            this.domElement.removeEventListener('selectstart', this._onSelectStart);
        }
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mouseup',   this._onMouseUp);
        this._onMouseDown = null;
        this._onMouseMove = null;
        this._onMouseUp   = null;
        this._onDragStart = null;
        this._onSelectStart = null;
        if (this.domElement) {
            this.domElement.style.cursor = '';
        }
    }


    /**
     * 选中高亮（编辑模式）
     */
    select() {
        if (this.domElement) {
            // 发光边框（box-shadow 不受 overflow 裁切，比 outline 更可靠）
            this.domElement.style.boxShadow = '0 0 0 2px #4CAF50, 0 0 12px 3px rgba(76, 175, 80, 0.6)';
            this.domElement.style.outline = 'none';

            // 创建选中角点层（4个角点 + 顶部标签）
            if (!this._selectOverlay) {
                this._selectOverlay = document.createElement('div');
                this._selectOverlay.style.cssText = `
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    z-index: 9999;
                `;

                // 4个角点
                const corners = [
                    { top: '-4px', left: '-4px' },
                    { top: '-4px', right: '-4px' },
                    { bottom: '-4px', left: '-4px' },
                    { bottom: '-4px', right: '-4px' }
                ];
                corners.forEach(pos => {
                    const dot = document.createElement('div');
                    dot.style.cssText = `
                        position: absolute;
                        width: 8px;
                        height: 8px;
                        background: #4CAF50;
                        border: 2px solid white;
                        border-radius: 50%;
                        box-shadow: 0 0 4px rgba(0,0,0,0.5);
                    `;
                    Object.assign(dot.style, pos);
                    this._selectOverlay.appendChild(dot);
                });

                // 顶部标签条
                const label = document.createElement('div');
                label.textContent = this.config.name || this.id;
                label.style.cssText = `
                    position: absolute;
                    top: -22px;
                    left: -2px;
                    background: #4CAF50;
                    color: white;
                    font-size: 11px;
                    font-weight: bold;
                    padding: 1px 6px;
                    border-radius: 3px 3px 0 0;
                    white-space: nowrap;
                    line-height: 18px;
                    box-shadow: 0 -2px 6px rgba(76,175,80,0.4);
                    font-family: monospace;
                `;
                this._selectOverlay.appendChild(label);

                this.domElement.style.position = 'fixed';
                this.domElement.style.overflow = 'visible';
                this.domElement.appendChild(this._selectOverlay);
            }
        }
        this.enableDrag();
    }

    /**
     * 取消选中高亮
     */
    deselect() {
        if (this.domElement) {
            this.domElement.style.boxShadow = '';
            this.domElement.style.outline = '';
            this.domElement.style.overflow = '';
        }
        if (this._selectOverlay) {
            this._selectOverlay.remove();
            this._selectOverlay = null;
        }
        this.disableDrag();
    }

    /**
     * 同步自定义组件列表中的 x/y 位置（拖动后持久化）
     * @private
     */
    _syncCustomElementPosition() {
        try {
            const key = 'ui_preview_custom_elements';
            const raw = localStorage.getItem(key);
            if (!raw) return;
            const list = JSON.parse(raw);
            const item = list.find(c => c.id === this.id);
            if (!item) return;
            item.x = this.config.basePosition.x;
            item.y = this.config.basePosition.y;
            localStorage.setItem(key, JSON.stringify(list));
        } catch (e) {
            // 非自定义组件或存储失败，静默忽略
        }
    }

    /**
     * 同步自定义组件列表中的 image/backgroundColor（上传图片后持久化）
     * 注意：不存 base64 数据（防止撑爆 localStorage），只存 hasImage 标记。
     * 图片实际数据已由 saveConfig() → Storage.saveImage() 独立存储。
     * @private
     */
    _syncCustomElementImage() {
        try {
            const key = 'ui_preview_custom_elements';
            const raw = localStorage.getItem(key);
            if (!raw) return;
            const list = JSON.parse(raw);
            const item = list.find(c => c.id === this.id);
            if (!item) return;
            // 只存标记，不存 base64 数据
            item.hasImage = !!this.config.image;
            item.backgroundColor = this.config.backgroundColor || null;
            localStorage.setItem(key, JSON.stringify(list));
        } catch (e) {
            // 非自定义组件或存储失败，静默忽略
        }
    }

    /**
     * 销毁元素
     */
    destroy() {
        if (this.domElement && this.domElement.parentNode) {
            this.domElement.parentNode.removeChild(this.domElement);
        }
        if (this.shadowElement && this.shadowElement.parentNode) {
            this.shadowElement.parentNode.removeChild(this.shadowElement);
        }
        this.domElement = null;
        this.shadowElement = null;
    }

    /**
     * 获取当前配置（供编辑器使用）
     * 注意：不包含 image 字段（base64 数据存 IndexedDB，不通过 config 传递），
     * 避免调用方意外把 base64 写入 localStorage 撑爆 5MB 限制。
     * 如需读取图片，直接访问 uiElement.config.image 或从 IndexedDB 加载。
     * @returns {Object} UI元素配置（不含 image）
     */
    getConfig() {
        return {
            id: this.id,
            type: this.type,
            x: this.config.basePosition?.x ?? 0,
            y: this.config.basePosition?.y ?? 0,
            width: this.config.baseSize?.width ?? 0,
            height: this.config.baseSize?.height ?? 0,
            shadow: this.config.shadow || {},
            visible: this.config.visible !== false,
            zIndex: this.config.zIndex || 100,
            // image 故意不暴露：base64 数据只存 IndexedDB，不走 localStorage 通道
            defaultImage: this.config.defaultImage || null,
            objectFit: this.config.objectFit || 'cover'
        };
    }

    /**
     * 通用更新方法（供编辑器实时预览使用）
     * @param {Object} updates 更新对象，可以是 {x: value}、{width: value}、{shadow: {...}} 等
     */
    update(updates) {
        console.log('🔄 更新UI元素配置:', this.id, updates);
        
        // 处理位置更新
        if (updates.x !== undefined || updates.y !== undefined) {
            this.config.basePosition = {
                x: updates.x !== undefined ? updates.x : this.config.basePosition?.x ?? 0,
                y: updates.y !== undefined ? updates.y : this.config.basePosition?.y ?? 0
            };
        }
        
        // 处理尺寸更新
        if (updates.width !== undefined || updates.height !== undefined) {
            this.config.baseSize = {
                width: updates.width !== undefined ? updates.width : this.config.baseSize?.width ?? 0,
                height: updates.height !== undefined ? updates.height : this.config.baseSize?.height ?? 0
            };
        }
        
        // 处理阴影更新
        if (updates.shadow) {
            this.config.shadow = { ...(this.config.shadow || {}), ...updates.shadow };
        }
        
        // 处理可见性更新
        if (updates.visible !== undefined) {
            this.config.visible = updates.visible;
            if (updates.visible) {
                this.show();
            } else {
                this.hide();
            }
        }
        
        // 处理Z-Index更新
        if (updates.zIndex !== undefined) {
            this.config.zIndex = updates.zIndex;
            if (this.domElement) {
                this.domElement.style.zIndex = updates.zIndex.toString();
            }
            if (this.shadowElement) {
                this.shadowElement.style.zIndex = (updates.zIndex - 1).toString();
            }
        }
        
        // 应用缩放（如果位置或尺寸发生变化）
        if ((updates.x !== undefined || updates.y !== undefined) || 
            (updates.width !== undefined || updates.height !== undefined)) {
            this.applyScale();
        }
        
        // 应用阴影（如果阴影发生变化）
        if (updates.shadow) {
            this.applyShadow(this.config.shadow);
        }
        
        // 保存配置
        this.saveConfig();
    }

    /**
     * 导出配置
     * @returns {Object} UI元素配置
     */
    exportConfig() {
        return this.getConfig();
    }

    /**
     * 导入配置
     * @param {Object} config 配置对象
     */
    importConfig(config) {
        const { id, type, x, y, width, height, ...restConfig } = config;
        
        // 更新配置
        this.config = {
            ...this.config,
            ...restConfig
        };
        
        // 更新位置和尺寸
        if (x !== undefined && y !== undefined) {
            this.config.basePosition = { x, y };
        }
        if (width !== undefined && height !== undefined) {
            this.config.baseSize = { width, height };
        }
        
        // 重新渲染
        this.applyScale();
        if (this.config.shadow) {
            this.applyShadow(this.config.shadow);
        }
        
        // 应用可见性
        if (this.config.visible !== undefined) {
            if (this.config.visible) {
                this.show();
            } else {
                this.hide();
            }
        }
        
        // 应用Z-Index
        if (this.config.zIndex !== undefined) {
            if (this.domElement) {
                this.domElement.style.zIndex = this.config.zIndex.toString();
            }
            if (this.shadowElement) {
                this.shadowElement.style.zIndex = (this.config.zIndex - 1).toString();
            }
        }
        
        this.saveConfig();
    }

    /**
     * 重置为默认配置
     */
    resetToDefault() {
        this.config = { ...this.defaultConfig };
        this.applyScale();
        if (this.config.shadow) {
            this.applyShadow(this.config.shadow);
        }
        this.saveConfig();
    }
}

// 导出UIElementBase类
// 统一导出模式：同时支持浏览器和Node.js环境
if (typeof window !== 'undefined') {
    window.UIElementBase = UIElementBase;
    window.UIElement = UIElementBase;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIElementBase;
}