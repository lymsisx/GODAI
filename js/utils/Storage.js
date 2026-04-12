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
     * 自动清洗历史遗留的 image 字段（base64 应存 IndexedDB 而非 localStorage）
     * @param {Object} defaultConfig 默认配置
     * @returns {Object} 加载的配置或默认配置
     */
    static loadConfig(defaultConfig = {}) {
        const result = this.load('config', defaultConfig);
        // 自动清洗：如果历史数据中有 image 字段（旧版遗留），就地删除并回写
        let dirty = false;
        if (result && typeof result === 'object') {
            for (const key of Object.keys(result)) {
                if (result[key] && typeof result[key] === 'object' && result[key].image) {
                    delete result[key].image;
                    dirty = true;
                }
            }
            if (dirty) {
                // 回写清洗后的数据，释放 localStorage 空间
                this.save('config', result);
                console.log('🧹 已清洗 localStorage 中残留的 image 数据');
            }
        }
        return result;
    }
    
    /**
     * 保存指定UI元素的配置
     * 注意：写回前会清洗所有元素的 image 字段（base64 走 IndexedDB，不能留在 localStorage）
     * @param {string} elementId 元素ID
     * @param {Object} config 元素配置
     * @returns {boolean} 是否保存成功
     */
    static saveElementConfig(elementId, config) {
        const allConfig = this.loadConfig();
        // 清洗入参中的 image（防御性，调用方应已剥离）
        const cleanConfig = { ...config };
        delete cleanConfig.image;
        allConfig[elementId] = cleanConfig;
        // 清洗历史数据中所有元素的 image 字段（防止旧数据残留撑爆 localStorage）
        for (const key of Object.keys(allConfig)) {
            if (allConfig[key] && typeof allConfig[key] === 'object' && allConfig[key].image) {
                delete allConfig[key].image;
            }
        }
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

    // ─────────────────────────────────────────────
    // IndexedDB 异步图片存取（无大小限制）
    // ─────────────────────────────────────────────

    /**
     * 获取（或初始化）IndexedDB 实例
     * @returns {Promise<IDBDatabase>}
     */
    static _getDB() {
        if (this._dbPromise) return this._dbPromise;
        this._dbPromise = new Promise((resolve, reject) => {
            const req = indexedDB.open('ui_preview_db', 1);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('images')) {
                    db.createObjectStore('images');
                }
            };
            req.onsuccess = (e) => resolve(e.target.result);
            req.onerror   = (e) => reject(e.target.error);
        });
        return this._dbPromise;
    }

    /**
     * 异步保存图片到 IndexedDB
     * @param {string} key  图片键名（元素 ID）
     * @param {string} dataUrl 图片 DataURL
     * @returns {Promise<boolean>}
     */
    static async saveImageAsync(key, dataUrl) {
        try {
            const db = await this._getDB();
            return new Promise((resolve) => {
                const tx  = db.transaction('images', 'readwrite');
                const req = tx.objectStore('images').put(dataUrl, key);
                req.onsuccess = () => resolve(true);
                req.onerror   = () => { console.warn('⚠️ IndexedDB 存图失败:', req.error); resolve(false); };
            });
        } catch (err) {
            console.warn('⚠️ IndexedDB 存图异常:', err);
            return false;
        }
    }

    /**
     * 异步从 IndexedDB 加载图片
     * @param {string} key 图片键名（元素 ID）
     * @returns {Promise<string|null>}
     */
    static async loadImageAsync(key) {
        try {
            const db = await this._getDB();
            return new Promise((resolve) => {
                const tx  = db.transaction('images', 'readonly');
                const req = tx.objectStore('images').get(key);
                req.onsuccess = () => resolve(req.result || null);
                req.onerror   = () => resolve(null);
            });
        } catch (err) {
            return null;
        }
    }

    /**
     * 异步从 IndexedDB 删除图片
     * @param {string} key 图片键名
     * @returns {Promise<void>}
     */
    static async removeImageAsync(key) {
        try {
            const db = await this._getDB();
            return new Promise((resolve) => {
                const tx  = db.transaction('images', 'readwrite');
                const req = tx.objectStore('images').delete(key);
                req.onsuccess = () => resolve();
                req.onerror   = () => resolve();
            });
        } catch (err) {
            // 忽略
        }
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

        // 同步清除 IndexedDB 图片库
        this._getDB().then(db => {
            const tx = db.transaction('images', 'readwrite');
            tx.objectStore('images').clear();
        }).catch(() => {});
        
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

// 导出UIStorageManager类
// 统一导出模式：同时支持浏览器和Node.js环境
if (typeof window !== 'undefined') {
    window.UIStorageManager = Storage;  // 类名是 Storage，导出为 UIStorageManager
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}