/**
 * 本地存储管理工具类
 * 处理配置的持久化和加载
 */
class Storage {
    /** 配置键名前缀 */
    static PREFIX = 'ui_preview_';
    
    /**
     * 保存数据到localStorage
     * @param {string} key 键名
     * @param {any} value 值（会被JSON.stringify序列化）
     * @returns {boolean} 是否保存成功
     */
    static save(key, value) {
        try {
            const fullKey = this.PREFIX + key;
            const serialized = JSON.stringify(value);
            localStorage.setItem(fullKey, serialized);
            return true;
        } catch (error) {
            console.error('保存数据失败:', error);
            return false;
        }
    }
    
    /**
     * 从localStorage加载数据
     * @param {string} key 键名
     * @param {any} defaultValue 默认值（如果不存在）
     * @returns {any} 加载的值或默认值
     */
    static load(key, defaultValue = null) {
        try {
            const fullKey = this.PREFIX + key;
            const serialized = localStorage.getItem(fullKey);
            if (serialized === null) {
                return defaultValue;
            }
            return JSON.parse(serialized);
        } catch (error) {
            console.error('加载数据失败:', error);
            return defaultValue;
        }
    }
    
    /**
     * 保存UI配置
     * @param {Object} config UI配置对象
     * @returns {boolean} 是否保存成功
     */
    static saveConfig(config) {
        return this.save('config', config);
    }
    
    /**
     * 加载UI配置
     * @param {Object} defaultConfig 默认配置
     * @returns {Object} 加载的配置或默认配置
     */
    static loadConfig(defaultConfig = {}) {
        return this.load('config', defaultConfig);
    }
    
    /**
     * 保存指定UI元素的配置
     * @param {string} elementId 元素ID
     * @param {Object} config 元素配置
     * @returns {boolean} 是否保存成功
     */
    static saveElementConfig(elementId, config) {
        const allConfig = this.loadConfig();
        allConfig[elementId] = config;
        return this.saveConfig(allConfig);
    }
    
    /**
     * 加载指定UI元素的配置
     * @param {string} elementId 元素ID
     * @param {Object} defaultConfig 默认配置
     * @returns {Object} 元素配置
     */
    static loadElementConfig(elementId, defaultConfig = {}) {
        const allConfig = this.loadConfig();
        return allConfig[elementId] || defaultConfig;
    }
    
    /**
     * 保存图片数据到localStorage
     * @param {string} key 图片键名
     * @param {string} dataUrl 图片的data URL
     * @returns {boolean} 是否保存成功
     */
    static saveImage(key, dataUrl) {
        try {
            const fullKey = this.PREFIX + 'image_' + key;
            localStorage.setItem(fullKey, dataUrl);
            return true;
        } catch (error) {
            console.error('保存图片失败:', error);
            return false;
        }
    }
    
    /**
     * 从localStorage加载图片
     * @param {string} key 图片键名
     * @returns {string|null} 图片的data URL或null
     */
    static loadImage(key) {
        try {
            const fullKey = this.PREFIX + 'image_' + key;
            return localStorage.getItem(fullKey);
        } catch (error) {
            console.error('加载图片失败:', error);
            return null;
        }
    }
    
    /**
     * 清除指定键名的数据
     * @param {string} key 键名
     */
    static remove(key) {
        const fullKey = this.PREFIX + key;
        localStorage.removeItem(fullKey);
    }
    
    /**
     * 清除所有UI预览工具的数据
     */
    static clearAll() {
        const keysToRemove = [];
        
        // 找出所有属于UI预览工具的数据
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.PREFIX)) {
                keysToRemove.push(key);
            }
        }
        
        // 删除这些数据
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        
        return keysToRemove.length;
    }
    
    /**
     * 获取已保存的所有配置信息
     * @returns {Object} 所有配置
     */
    static getAllConfigs() {
        return this.loadConfig({});
    }
    
    /**
     * 检查localStorage是否可用
     * @returns {boolean} localStorage是否可用
     */
    static isAvailable() {
        try {
            const testKey = this.PREFIX + 'test';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * 获取存储使用情况
     * @returns {string} 存储使用情况描述
     */
    static getStorageUsage() {
        let totalSize = 0;
        let itemCount = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            totalSize += key.length + value.length;
            itemCount++;
        }
        
        const kb = totalSize / 1024;
        const mb = kb / 1024;
        
        return `总共 ${itemCount} 个项目, ${kb.toFixed(2)} KB (${mb.toFixed(2)} MB)`;
    }
}

// 导出Storage类
// 统一导出模式：同时支持浏览器和Node.js环境
if (typeof window !== 'undefined') {
    window.Storage = Storage;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}