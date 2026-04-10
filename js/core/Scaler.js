/**
 * 自适应缩放系统
 * 基于基准分辨率(2560×1440)的自动缩放
 * 使用静态方法和属性，保持API简单一致
 */
class Scaler {
    // 基准分辨率（设计稿尺寸）
    static BASE_WIDTH = 2560;
    static BASE_HEIGHT = 1440;
    
    // 当前缩放比例
    static currentScale = 1;
    
    // 初始化标记
    static isInitialized = false;
    
    /**
     * 初始化缩放系统
     */
    static init() {
        if (this.isInitialized) return;
        
        // 初始更新
        this._updateScale();
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => this._updateScale());
        
        this.isInitialized = true;
        console.log(`📏 缩放系统已初始化: 基准=${this.BASE_WIDTH}×${this.BASE_HEIGHT}`);
    }
    
    /**
     * 更新缩放比例
     */
    static _updateScale() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // 计算基于宽度的缩放比例
        const scaleX = windowWidth / this.BASE_WIDTH;
        
        // 计算基于高度的缩放比例
        const scaleY = windowHeight / this.BASE_HEIGHT;
        
        // 使用较小的缩放比例以确保内容可见
        this.currentScale = Math.min(scaleX, scaleY);
        
        console.log(`📏 缩放更新: 窗口=${windowWidth}×${windowHeight}, 基准=${this.BASE_WIDTH}×${this.BASE_HEIGHT}, 比例=${this.currentScale.toFixed(3)}`);
    }
    
    /**
     * 获取当前缩放比例
     * @returns {number} 缩放比例
     */
    static getScale() {
        if (!this.isInitialized) this.init();
        return this.currentScale;
    }
    
    /**
     * 获取缩放信息
     * @returns {Object} 缩放信息对象
     */
    static getScaleInfo() {
        if (!this.isInitialized) this.init();
        
        const actualWidth = Math.round(this.BASE_WIDTH * this.currentScale);
        const actualHeight = Math.round(this.BASE_HEIGHT * this.currentScale);
        
        return {
            baseWidth: this.BASE_WIDTH,
            baseHeight: this.BASE_HEIGHT,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            scale: this.currentScale,
            actualWidth: actualWidth,
            actualHeight: actualHeight
        };
    }
    
    /**
     * 缩放位置（基准坐标 → 实际坐标）
     * @param {number} x 基准X坐标
     * @param {number} y 基准Y坐标
     * @returns {{x: number, y: number}} 实际坐标
     */
    static scalePosition(x, y) {
        if (!this.isInitialized) this.init();
        
        return {
            x: Math.round(x * this.currentScale),
            y: Math.round(y * this.currentScale)
        };
    }
    
    /**
     * 缩放尺寸（基准尺寸 → 实际尺寸）
     * @param {number} width 基准宽度
     * @param {number} height 基准高度
     * @returns {{width: number, height: number}} 实际尺寸
     */
    static scaleSize(width, height) {
        if (!this.isInitialized) this.init();
        
        return {
            width: Math.round(width * this.currentScale),
            height: Math.round(height * this.currentScale)
        };
    }
    
    /**
     * 将基准值转换为实际值
     * @param {number} value 基准值
     * @returns {number} 实际值
     */
    static toActual(value) {
        if (!this.isInitialized) this.init();
        
        return Math.round(value * this.currentScale);
    }
    
    /**
     * 将实际值转换为基准值
     * @param {number} value 实际值
     * @returns {number} 基准值
     */
    static toBase(value) {
        if (!this.isInitialized) this.init();
        
        return Math.round(value / this.currentScale);
    }
    
    /**
     * 检查是否需要重新缩放（窗口大小变化超过阈值）
     * @param {number} threshold 阈值百分比（默认5%）
     * @returns {boolean} 是否需要重新缩放
     */
    static needsRescale(threshold = 0.05) {
        if (!this.isInitialized) this.init();
        
        const oldScale = this.currentScale;
        const newScale = Math.min(
            window.innerWidth / this.BASE_WIDTH,
            window.innerHeight / this.BASE_HEIGHT
        );
        
        return Math.abs(newScale - oldScale) > oldScale * threshold;
    }
    
    /**
     * 应用缩放到整个页面（可选功能）
     */
    static applyToPage() {
        if (!this.isInitialized) this.init();
        
        document.documentElement.style.fontSize = `${this.currentScale * 16}px`;
        console.log(`📏 应用字体缩放: ${this.currentScale * 16}px`);
    }
    
    /**
     * 创建缩放友好的CSS样式
     * @param {Object} baseStyles 基准样式
     * @returns {Object} 缩放后的样式
     */
    static createScaledStyles(baseStyles) {
        if (!this.isInitialized) this.init();
        
        const scaledStyles = {};
        
        for (const [key, value] of Object.entries(baseStyles)) {
            if (typeof value === 'number' && 
                (key.includes('width') || key.includes('height') || 
                 key.includes('top') || key.includes('bottom') || 
                 key.includes('left') || key.includes('right') || 
                 key.includes('margin') || key.includes('padding') ||
                 key.includes('border') || key.includes('fontSize'))) {
                scaledStyles[key] = `${this.toActual(value)}px`;
            } else {
                scaledStyles[key] = value;
            }
        }
        
        return scaledStyles;
    }
    
    /**
     * 获取浏览器缩放级别（用于兼容性检查）
     * @returns {number} 浏览器缩放级别（1.0表示100%）
     */
    static getBrowserZoom() {
        return window.devicePixelRatio || 1;
    }
    
    /**
     * 获取设备信息
     * @returns {Object} 设备信息
     */
    static getDeviceInfo() {
        return {
            dpr: window.devicePixelRatio || 1,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            orientation: window.screen.orientation ? window.screen.orientation.type : 'unknown',
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0
        };
    }
    
    /**
     * 检查是否处于基准分辨率
     * @returns {boolean} 是否处于基准分辨率
     */
    static isBaseResolution() {
        return Math.abs(this.currentScale - 1) < 0.01;
    }
}

// 导出Scaler类
// 统一导出模式：同时支持浏览器和Node.js环境
if (typeof window !== 'undefined') {
    window.Scaler = Scaler;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Scaler;
}