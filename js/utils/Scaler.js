/**
 * 缩放计算工具类
 * 处理基于2560×1440基准分辨率的自适应缩放
 */
class Scaler {
    /** 基准宽度（2560x1440分辨率） */
    static BASE_WIDTH = 2560;
    /** 基准高度（2560x1440分辨率） */
    static BASE_HEIGHT = 1440;
    
    /**
     * 获取当前窗口相对于基准分辨率的缩放比例
     * 使用最小缩放比例确保内容完全显示在视口内
     * @returns {number} 缩放比例
     */
    static getScale() {
        return Math.min(
            window.innerWidth / this.BASE_WIDTH,
            window.innerHeight / this.BASE_HEIGHT
        );
    }
    
    /**
     * 将基准像素值转换为实际像素值
     * @param {number} baseValue 基准像素值
     * @returns {number} 实际像素值
     */
    static toActual(baseValue) {
        return baseValue * this.getScale();
    }
    
    /**
     * 将实际像素值转换回基准像素值
     * @param {number} actualValue 实际像素值
     * @returns {number} 基准像素值
     */
    static toBase(actualValue) {
        return actualValue / this.getScale();
    }
    
    /**
     * 缩放位置坐标
     * @param {number} baseX 基准X坐标
     * @param {number} baseY 基准Y坐标
     * @returns {{x: number, y: number}} 缩放后的位置对象
     */
    static scalePosition(baseX, baseY) {
        return {
            x: this.toActual(baseX),
            y: this.toActual(baseY)
        };
    }
    
    /**
     * 缩放尺寸
     * @param {number} baseWidth 基准宽度
     * @param {number} baseHeight 基准高度
     * @returns {{width: number, height: number}} 缩放后的尺寸对象
     */
    static scaleSize(baseWidth, baseHeight) {
        return {
            width: this.toActual(baseWidth),
            height: this.toActual(baseHeight)
        };
    }
    
    /**
     * 获取当前缩放比例的描述信息
     * @returns {string} 缩放比例描述
     */
    static getScaleInfo() {
        const scale = this.getScale();
        const actualWidth = this.BASE_WIDTH * scale;
        const actualHeight = this.BASE_HEIGHT * scale;
        
        return `基准分辨率: ${this.BASE_WIDTH}×${this.BASE_HEIGHT}\n当前分辨率: ${window.innerWidth}×${window.innerHeight}\n缩放比例: ${scale.toFixed(3)}\n实际渲染尺寸: ${Math.round(actualWidth)}×${Math.round(actualHeight)}`;
    }
    
    /**
     * 检查是否处于基准分辨率
     * @returns {boolean} 是否处于基准分辨率
     */
    static isBaseResolution() {
        return Math.abs(window.innerWidth - this.BASE_WIDTH) < 10 && 
               Math.abs(window.innerHeight - this.BASE_HEIGHT) < 10;
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