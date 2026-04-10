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
            backgroundColor: 'transparent'
        };
        
        // 合并配置
        this.config = { ...this.defaultConfig, ...config };
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
            this.imageElement.style.width = '100%';
            this.imageElement.style.height = '100%';
            this.imageElement.style.objectFit = 'cover';
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
        
        // 保存配置
        this.saveConfig();
        
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
     */
    saveConfig() {
        try {
            const Storage = window.Storage;
            if (Storage && typeof Storage.saveElementConfig === 'function') {
                Storage.saveElementConfig(this.id, this.config);
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
            const Storage = window.Storage;
            if (Storage && typeof Storage.loadElementConfig === 'function') {
                const savedConfig = Storage.loadElementConfig(this.id, this.config);
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
        console.log(`🖼️ 更新元素 ${this.id} 的图片:`, imageSrc ? imageSrc.substring(0, 50) + '...' : '空');
        
        // 更新配置
        this.config.image = imageSrc;
        
        // 更新DOM
        if (this.imageElement) {
            this.imageElement.src = imageSrc;
        } else {
            // 如果没有图片元素，重新渲染
            this.render();
        }
        
        // 保存配置
        this.saveConfig();
        
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
     * @returns {Object} UI元素配置
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
            zIndex: this.config.zIndex || 100
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