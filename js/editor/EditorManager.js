/**
 * 编辑器管理模块
 * 统一管理所有UI元素编辑器和编辑面板功能
 */
class EditorManager {
    constructor(app) {
        this.app = app;
        this.editors = new Map();
        this.isEditMode = false;
        this.currentElementId = null;
        this._CUSTOM_ELEMENTS_KEY = 'ui_preview_custom_elements';
        
        this._init();
    }

    /**
     * 初始化编辑器管理器
     */
    _init() {
        console.log('👨‍💼 初始化编辑器管理器');
        
        // 绑定全局快捷键
        this._bindGlobalShortcuts();
        
        // 初始化编辑面板
        this._initEditPanel();
        
        // 初始化元素选择器
        this._initElementSelector();
        
        // 恢复自定义元素
        this._loadCustomElements();

        // 监听拖动结束事件，刷新编辑器面板 X/Y 输入框
        document.addEventListener('ui-element-dragged', (e) => {
            const { id } = e.detail;
            if (id !== this.currentElementId) return;
            const editor = this.editors.get(id);
            if (editor && typeof editor.refresh === 'function') {
                editor.refresh();
            }
        });
    }

    /**
     * 绑定全局快捷键
     */
    _bindGlobalShortcuts() {
        document.addEventListener('keydown', (e) => {
            // 反引号键（`）切换编辑模式
            if (e.key === '`' || e.key === '~') {
                e.preventDefault();
                this.toggleEditMode();
            }
            
            // ESC键退出编辑模式
            if (e.key === 'Escape') {
                this.exitEditMode();
            }
        });
        
        console.log('⌨️ 全局快捷键已绑定');
    }

    /**
     * 初始化编辑面板
     */
    _initEditPanel() {
        // 删除旧版静态面板（如果存在），使用新的动态面板
        const existingPanel = document.getElementById('editPanel');
        if (existingPanel) {
            existingPanel.remove();
            console.log('🗑️ 已删除旧版静态编辑面板');
        }
        // 始终创建新的动态编辑面板
        this._createEditPanel();
    }

    /**
     * 创建编辑面板
     */
    _createEditPanel() {
        const panel = document.createElement('div');
        panel.id = 'editPanel';
        panel.className = 'edit-panel';
        panel.style.cssText = `
            position: fixed;
            top: 60px;
            left: 20px;
            background: rgba(0, 0, 0, 0.95);
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 10000;
            width: 380px;
            max-height: calc(100vh - 80px);
            overflow-y: auto;
            display: none;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
            border: 1px solid #333;
        `;
        
        // 标题容器（带关闭按钮）
        const titleContainer = document.createElement('div');
        titleContainer.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 0;
            margin-bottom: 15px;
            border-bottom: 1px solid #444;
            padding-bottom: 10px;
        `;

        // 标题
        const title = document.createElement('h3');
        title.textContent = 'UI元素编辑器';
        title.style.cssText = `
            margin: 0;
            color: #4CAF50;
            font-size: 18px;
        `;

        // 关闭按钮（右上角）
        const headerCloseBtn = document.createElement('button');
        headerCloseBtn.innerHTML = '✕';
        headerCloseBtn.title = '关闭编辑器 (ESC)';
        headerCloseBtn.style.cssText = `
            background: transparent;
            color: #999;
            border: 1px solid #555;
            width: 28px;
            height: 28px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            line-height: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        `;
        headerCloseBtn.addEventListener('mouseenter', () => {
            headerCloseBtn.style.background = '#f44336';
            headerCloseBtn.style.color = 'white';
            headerCloseBtn.style.borderColor = '#f44336';
        });
        headerCloseBtn.addEventListener('mouseleave', () => {
            headerCloseBtn.style.background = 'transparent';
            headerCloseBtn.style.color = '#999';
            headerCloseBtn.style.borderColor = '#555';
        });
        headerCloseBtn.addEventListener('click', () => {
            this.exitEditMode();
        });

        titleContainer.appendChild(title);
        titleContainer.appendChild(headerCloseBtn);
        panel.appendChild(titleContainer);
        
        // 元素选择器容器
        const selectorContainer = document.createElement('div');
        selectorContainer.id = 'elementSelectorContainer';
        selectorContainer.style.marginBottom = '20px';
        panel.appendChild(selectorContainer);
        
        // 编辑器容器
        const editorContainer = document.createElement('div');
        editorContainer.id = 'editorContainer';
        editorContainer.innerHTML = '<p style="color: #888; text-align: center;">请从左侧选择要编辑的UI元素</p>';
        panel.appendChild(editorContainer);
        
        // 操作按钮
        const actionButtons = document.createElement('div');
        actionButtons.style.marginTop = '20px';
        actionButtons.style.borderTop = '1px solid #444';
        actionButtons.style.paddingTop = '15px';
        
        const exportBtn = this._createButton('📤 导出配置', '#2196F3', () => {
            this.exportConfig();
        });
        exportBtn.style.marginRight = '10px';
        
        const importBtn = this._createButton('📥 导入配置', '#FF9800', () => {
            this.importConfig();
        });
        importBtn.style.marginRight = '10px';
        
        const resetAllBtn = this._createButton('🔄 全部重置', '#f44336', () => {
            if (confirm('确定要重置所有UI元素配置吗？')) {
                this.resetAllElements();
            }
        });
        
        const closeBtn = this._createButton('❌ 关闭', '#777', () => {
            this.exitEditMode();
        });
        closeBtn.style.marginLeft = '10px';
        closeBtn.style.float = 'right';
        
        actionButtons.appendChild(exportBtn);
        actionButtons.appendChild(importBtn);
        actionButtons.appendChild(resetAllBtn);
        actionButtons.appendChild(closeBtn);
        
        panel.appendChild(actionButtons);
        
        // 添加到页面
        document.body.appendChild(panel);
        
        console.log('📋 创建了新的编辑面板');
    }

    /**
     * 初始化元素选择器
     */
    _initElementSelector() {
        const container = document.getElementById('elementSelectorContainer');
        if (!container) return;
        
        // 创建元素选择器标题
        const selectorTitle = document.createElement('div');
        selectorTitle.innerHTML = '<strong>🎯 选择要编辑的UI元素:</strong>';
        selectorTitle.style.marginBottom = '10px';
        selectorTitle.style.fontSize = '14px';
        container.appendChild(selectorTitle);
        
        // 创建元素列表容器
        const elementList = document.createElement('div');
        elementList.id = 'elementList';
        elementList.style.display = 'grid';
        elementList.style.gridTemplateColumns = 'repeat(2, 1fr)';
        elementList.style.gap = '8px';
        elementList.style.maxHeight = '200px';
        elementList.style.overflowY = 'auto';
        elementList.style.padding = '10px';
        elementList.style.background = 'rgba(255, 255, 255, 0.05)';
        elementList.style.borderRadius = '5px';
        container.appendChild(elementList);
        
        // 添加组件按钮
        const addBtn = this._createButton('➕ 添加组件', '#4CAF50', () => {
            this._showAddElementDialog();
        });
        addBtn.style.marginTop = '10px';
        addBtn.style.width = '100%';
        container.appendChild(addBtn);
        
        console.log('🎯 初始化了元素选择器');
    }

    /**
     * 创建按钮
     */
    _createButton(text, color, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            background: ${color};
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
            transition: all 0.2s ease;
        `;
        button.addEventListener('mouseenter', () => {
            button.style.opacity = '0.9';
            button.style.transform = 'translateY(-1px)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.opacity = '1';
            button.style.transform = 'translateY(0)';
        });
        button.addEventListener('click', onClick);
        return button;
    }

    /**
     * 更新元素列表
     */
    updateElementList() {
        const elementList = document.getElementById('elementList');
        if (!elementList || !this.app.uiManager) return;
        
        // 清空列表
        elementList.innerHTML = '';
        
        // 获取所有UI元素
        const elements = this.app.uiManager.elements;
        if (!elements || elements.size === 0) {
            elementList.innerHTML = '<p style="color: #888; text-align: center; grid-column: span 2;">没有可编辑的UI元素</p>';
            return;
        }
        
        // 读取自定义元素列表（用于判断哪些是自定义元素）
        const customElements = this._getCustomElementsConfig();
        const customIds = new Set(customElements.map(c => c.id));
        
        // 为每个元素创建选择按钮
        let elementCount = 0;
        for (const [elementId] of elements.entries()) {
            const isCustom = customIds.has(elementId);
            const customCfg = isCustom ? customElements.find(c => c.id === elementId) : null;
            const displayName = (customCfg && customCfg.displayName) ? customCfg.displayName : elementId;
            
            // 外层包装（相对定位，用于放删除按钮）
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'position: relative;';
            
            const button = document.createElement('button');
            button.textContent = displayName;
            button.title = isCustom ? `ID: ${elementId}` : elementId;
            button.dataset.elementId = elementId;
            
            // 设置按钮样式
            button.style.cssText = `
                background: ${this.currentElementId === elementId ? '#4CAF50' : (isCustom ? '#1a4a2e' : '#333')};
                color: white;
                border: 1px solid ${this.currentElementId === elementId ? '#4CAF50' : (isCustom ? '#4CAF50' : '#555')};
                padding: 6px ${isCustom ? '22px' : '10px'} 6px ${isCustom ? '22px' : '10px'};
                border-radius: 3px;
                cursor: pointer;
                font-size: 11px;
                text-align: center;
                transition: all 0.2s ease;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                width: 100%;
            `;
            
            button.addEventListener('mouseenter', () => {
                if (this.currentElementId !== elementId) {
                    button.style.background = isCustom ? '#255e38' : '#444';
                }
            });
            button.addEventListener('mouseleave', () => {
                if (this.currentElementId !== elementId) {
                    button.style.background = isCustom ? '#1a4a2e' : '#333';
                }
            });
            button.addEventListener('click', () => {
                this.selectElement(elementId);
            });
            
            wrapper.appendChild(button);
            
            // 自定义元素操作按钮
            if (isCustom) {
                // 改名按钮（左上角）
                const renameBtn = document.createElement('button');
                renameBtn.innerHTML = '✎';
                renameBtn.title = '重命名此组件';
                renameBtn.style.cssText = `
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    width: 16px;
                    height: 16px;
                    background: #2196F3;
                    color: white;
                    border: none;
                    border-radius: 2px;
                    cursor: pointer;
                    font-size: 10px;
                    line-height: 1;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                `;
                renameBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this._inlineRenameElement(elementId, button, displayName);
                });
                wrapper.appendChild(renameBtn);
                
                // 删除按钮（右上角）
                const delBtn = document.createElement('button');
                delBtn.innerHTML = '✕';
                delBtn.title = '删除此自定义组件';
                delBtn.style.cssText = `
                    position: absolute;
                    top: 2px;
                    right: 2px;
                    width: 16px;
                    height: 16px;
                    background: #f44336;
                    color: white;
                    border: none;
                    border-radius: 2px;
                    cursor: pointer;
                    font-size: 9px;
                    line-height: 1;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                `;
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(`确定要删除自定义组件「${displayName}」吗？`)) {
                        this.removeCustomElement(elementId);
                    }
                });
                wrapper.appendChild(delBtn);
            }
            
            elementList.appendChild(wrapper);
            elementCount++;
        }
        
        console.log(`📋 更新了元素列表，共 ${elementCount} 个元素`);
    }

    /**
     * 选择要编辑的元素
     * @param {string} elementId 元素ID
     */
    selectElement(elementId) {
        console.log(`🎯 选择编辑元素: ${elementId}`);
        
        // 清除旧选中元素的高亮和拖动
        if (this.currentElementId && this.currentElementId !== elementId) {
            const prevElement = this.app.uiManager.elements.get(this.currentElementId);
            if (prevElement && typeof prevElement.deselect === 'function') {
                prevElement.deselect();
            }
        }
        
        // 更新当前选中元素
        this.currentElementId = elementId;
        
        // 更新按钮样式
        this.updateElementList();
        
        // 获取UI元素
        const uiElement = this.app.uiManager.elements.get(elementId);
        if (!uiElement) {
            console.error(`❌ 找不到元素: ${elementId}`);
            return;
        }
        
        // 高亮选中元素并启用拖动
        if (typeof uiElement.select === 'function') {
            uiElement.select();
        }
        
        // 获取或创建编辑器
        let editor = this.editors.get(elementId);
        if (!editor) {
            try {
                editor = new UIElementEditor(uiElement);
                this.editors.set(elementId, editor);
                console.log(`✅ 为元素 ${elementId} 创建了编辑器`);
            } catch (error) {
                console.error(`❌ 为元素 ${elementId} 创建编辑器失败:`, error);
                return;
            }
        }
        
        // 创建或更新编辑器面板
        this._showEditor(editor);
    }

    /**
     * 显示编辑器
     * @param {UIElementEditor} editor 编辑器实例
     */
    _showEditor(editor) {
        const editorContainer = document.getElementById('editorContainer');
        if (!editorContainer) return;
        
        // 清空编辑器容器
        editorContainer.innerHTML = '';
        
        // 创建编辑器标题
        const editorTitle = document.createElement('div');
        editorTitle.innerHTML = `<h4 style="margin-top: 0; color: #4CAF50;">✏️ 编辑: ${editor.config.id}</h4>`;
        editorContainer.appendChild(editorTitle);
        
        // 创建编辑器控件组
        const controlGroup = editor._createControlGroup();
        editorContainer.appendChild(controlGroup);
        
        console.log(`✏️ 显示元素 ${editor.config.id} 的编辑器`);
    }

    /**
     * 切换编辑模式
     */
    toggleEditMode() {
        this.isEditMode = !this.isEditMode;
        const editPanel = document.getElementById('editPanel');
        
        if (editPanel) {
            editPanel.style.display = this.isEditMode ? 'block' : 'none';
            
            if (this.isEditMode) {
                // 进入编辑模式：更新元素列表
                this.updateElementList();
                
                // 默认选择第一个元素
                if (this.app.uiManager && this.app.uiManager.elements.size > 0) {
                    const firstElementId = Array.from(this.app.uiManager.elements.keys())[0];
                    if (firstElementId) {
                        this.selectElement(firstElementId);
                    }
                }
            }
        }
        
        // 更新编辑按钮文本
        const editBtn = document.getElementById('editBtn');
        if (editBtn) {
            editBtn.textContent = this.isEditMode ? '退出编辑模式 (`)' : '编辑模式 (`)';
            editBtn.style.background = this.isEditMode ? '#f44336' : '#4CAF50';
        }
        
        console.log(`🎬 编辑模式: ${this.isEditMode ? '开启' : '关闭'}`);
    }

    /**
     * 退出编辑模式
     */
    exitEditMode() {
        if (this.isEditMode) {
            // 清除选中高亮并禁用当前选中元素的拖动
            if (this.currentElementId && this.app.uiManager) {
                const el = this.app.uiManager.elements.get(this.currentElementId);
                if (el && typeof el.deselect === 'function') el.deselect();
            }
            // 确保所有元素都禁用拖动
            if (this.app.uiManager) {
                for (const [, el] of this.app.uiManager.elements.entries()) {
                    if (typeof el.disableDrag === 'function') el.disableDrag();
                }
            }
            this.toggleEditMode();
        }
    }

    /**
     * 导出配置
     */
    exportConfig() {
        if (!this.app || typeof this.app.exportConfig !== 'function') {
            console.error('❌ 无法导出配置: App.exportConfig 方法不可用');
            alert('导出配置功能暂时不可用');
            return;
        }
        
        this.app.exportConfig();
    }

    /**
     * 导入配置
     */
    importConfig() {
        // 创建文件输入框
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none';
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const config = JSON.parse(event.target.result);
                    this._applyImportedConfig(config);
                    alert('配置导入成功！');
                } catch (error) {
                    console.error('❌ 解析配置文件失败:', error);
                    alert('配置文件格式错误！');
                }
            };
            reader.readAsText(file);
            
            // 清理
            input.value = '';
        });
        
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }

    /**
     * 应用导入的配置
     * @param {Object} config 配置文件
     */
    _applyImportedConfig(config) {
        if (!config.uiElements) {
            console.warn('⚠️ 配置文件缺少uiElements字段');
            return;
        }
        
        console.log('📥 应用导入的配置:', config);
        
        // 应用到每个UI元素
        for (const [elementId, elementConfig] of Object.entries(config.uiElements)) {
            const uiElement = this.app.uiManager.elements.get(elementId);
            if (uiElement && typeof uiElement.importConfig === 'function') {
                uiElement.importConfig(elementConfig);
                console.log(`✅ 应用配置到元素: ${elementId}`);
            }
        }
        
        // 刷新编辑器
        if (this.currentElementId) {
            this.selectElement(this.currentElementId);
        }
    }

    /**
     * 重置所有UI元素
     */
    resetAllElements() {
        if (!this.app.uiManager) return;
        
        // 重置每个UI元素
        for (const [elementId, uiElement] of this.app.uiManager.elements.entries()) {
            if (typeof uiElement.resetToDefault === 'function') {
                uiElement.resetToDefault();
                console.log(`🔄 重置元素: ${elementId}`);
            }
        }
        
        // 清除本地存储中的配置
        try {
            localStorage.removeItem('ui_elements_config');
            console.log('🗑️ 清除了本地存储中的配置');
        } catch (e) {
            console.warn('⚠️ 清除本地存储失败:', e);
        }
        
        // 刷新编辑器
        if (this.currentElementId) {
            this.selectElement(this.currentElementId);
        }
        
        alert('所有UI元素已重置为默认设置！');
    }

    /**
     * 获取编辑器管理器状态
     * @returns {Object} 状态信息
     */
    getStatus() {
        return {
            isEditMode: this.isEditMode,
            currentElementId: this.currentElementId,
            editorCount: this.editors.size,
            elementCount: this.app.uiManager ? this.app.uiManager.elements.size : 0
        };
    }

    // ─────────────────────────────────────────────
    // 自定义组件功能
    // ─────────────────────────────────────────────

    /**
     * 从 localStorage 读取自定义元素配置列表
     * @returns {Array}
     */
    _getCustomElementsConfig() {
        try {
            const raw = localStorage.getItem(this._CUSTOM_ELEMENTS_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.warn('⚠️ 读取自定义元素列表失败:', e);
            return [];
        }
    }

    /**
     * 将自定义元素配置列表写入 localStorage
     * @param {Array} list
     */
    _saveCustomElementsConfig(list) {
        try {
            localStorage.setItem(this._CUSTOM_ELEMENTS_KEY, JSON.stringify(list));
        } catch (e) {
            console.warn('⚠️ 保存自定义元素列表失败:', e);
        }
    }

    /**
     * 页面初始化时恢复已保存的自定义元素
     */
    _loadCustomElements() {
        const list = this._getCustomElementsConfig();
        if (!list.length) return;
        
        for (const cfg of list) {
            this._registerCustomElement(cfg, false); // false = 不重复写入存储
        }
        console.log(`📦 恢复了 ${list.length} 个自定义组件`);
    }

    /**
     * 实际向 UIManager 注册自定义元素
     * @param {Object} cfg  { id, displayName, zIndex, x, y, width, height, image?, backgroundColor?, hasImage? }
     * @param {boolean} persist 是否写入 localStorage
     */
    _registerCustomElement(cfg, persist = true) {
        if (!this.app.uiManager) return;

        // 分离图片数据：注册时不传 image，避免 render() 触发 saveConfig() 炸 localStorage
        // 图片数据在注册完成后单独走 updateImage() → saveImageAsync() → IndexedDB
        let imageData = null;
        if (cfg.image) {
            // 用户直接传了 base64（添加对话框场景）
            imageData = cfg.image;
        } else if (cfg.hasImage && window.UIStorageManager &&
                typeof window.UIStorageManager.loadImageAsync === 'function') {
            // 只有标记（恢复场景），从 IndexedDB 异步加载，注册后再 updateImage
            // imageData 留 null，后面异步处理
        }

        const elementConfig = {
            id: cfg.id,
            type: 'generic',
            name: cfg.displayName,
            isCustom: true,
            basePosition: { x: cfg.x, y: cfg.y },
            baseSize: { width: cfg.width, height: cfg.height },
            zIndex: cfg.zIndex,
            // image 故意不传，渲染时用粉色占位背景，避免连锁存储
            backgroundColor: cfg.backgroundColor || '#ff6b9d',
        };

        this.app.uiManager.registerElement(elementConfig);

        // 注册完成后异步设置图片（不阻塞注册流程）
        const uiEl = this.app.uiManager.elements.get(cfg.id);
        if (uiEl && typeof uiEl.updateImage === 'function') {
            if (imageData) {
                // 直接有图片数据，就地更新
                Promise.resolve().then(() => uiEl.updateImage(imageData));
            } else if (cfg.hasImage && window.UIStorageManager &&
                    typeof window.UIStorageManager.loadImageAsync === 'function') {
                // 从 IndexedDB 异步加载再更新
                window.UIStorageManager.loadImageAsync(cfg.id).then(idbImage => {
                    if (idbImage) {
                        uiEl.updateImage(idbImage);
                    } else if (typeof window.UIStorageManager.loadImage === 'function') {
                        // 回退 localStorage 旧 key
                        const lsImage = window.UIStorageManager.loadImage(cfg.id);
                        if (lsImage) uiEl.updateImage(lsImage);
                    }
                }).catch(() => {});
            }
        }

        if (persist) {
            const list = this._getCustomElementsConfig();
            // 防重
            const idx = list.findIndex(c => c.id === cfg.id);
            // 持久化时不存 image base64，只存标记
            const cfgToSave = { ...cfg };
            if (cfgToSave.image) {
                cfgToSave.hasImage = true;
                delete cfgToSave.image;
            }
            if (idx >= 0) {
                list[idx] = cfgToSave;
            } else {
                list.push(cfgToSave);
            }
            this._saveCustomElementsConfig(list);
        }
    }

    /**
     * 删除自定义组件
     * @param {string} elementId
     */
    removeCustomElement(elementId) {
        if (!this.app.uiManager) return;
        
        // 从 UIManager 移除
        this.app.uiManager.unregisterElement(elementId);
        
        // 从持久化列表移除
        const list = this._getCustomElementsConfig().filter(c => c.id !== elementId);
        this._saveCustomElementsConfig(list);
        
        // 清除编辑器缓存
        if (this.editors.has(elementId)) {
            this.editors.delete(elementId);
        }
        
        // 如果当前正在编辑此元素，清空编辑器面板
        if (this.currentElementId === elementId) {
            this.currentElementId = null;
            const editorContainer = document.getElementById('editorContainer');
            if (editorContainer) {
                editorContainer.innerHTML = '<p style="color: #888; text-align: center;">请从左侧选择要编辑的UI元素</p>';
            }
        }
        
        // 刷新列表
        this.updateElementList();
        console.log(`🗑️ 已删除自定义组件: ${elementId}`);
    }

    /**
     * 内联改名：把按钮文字替换成 input，完成后保存
     * @param {string} elementId
     * @param {HTMLButtonElement} button  当前元素列表中的按钮
     * @param {string} currentName        当前显示名称
     */
    _inlineRenameElement(elementId, button, currentName) {
        // 防止重复激活
        if (button.dataset.renaming === '1') return;
        button.dataset.renaming = '1';
        
        const origText = button.textContent;
        
        // 创建内联输入框
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.style.cssText = `
            width: 100%;
            background: #0d0d1a;
            border: 1px solid #4CAF50;
            color: white;
            padding: 3px 6px;
            border-radius: 3px;
            font-size: 11px;
            box-sizing: border-box;
            outline: none;
        `;
        
        const commit = () => {
            const newName = input.value.trim();
            button.dataset.renaming = '';
            if (newName && newName !== currentName) {
                this.renameCustomElement(elementId, newName);
            } else {
                // 没改，恢复原按钮
                button.textContent = origText;
            }
        };
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); commit(); }
            if (e.key === 'Escape') { button.textContent = origText; button.dataset.renaming = ''; }
        });
        input.addEventListener('blur', commit);
        
        // 替换按钮内容为输入框
        button.textContent = '';
        button.appendChild(input);
        setTimeout(() => { input.select(); }, 20);
    }

    /**
     * 持久化保存新的显示名称
     * @param {string} elementId
     * @param {string} newName
     */
    renameCustomElement(elementId, newName) {
        const list = this._getCustomElementsConfig();
        const item = list.find(c => c.id === elementId);
        if (!item) return;
        
        item.displayName = newName;
        this._saveCustomElementsConfig(list);
        
        // 同步更新 UIManager 中的 name 字段
        const uiEl = this.app.uiManager && this.app.uiManager.elements.get(elementId);
        if (uiEl && uiEl.config) {
            uiEl.config.name = newName;
            uiEl.saveConfig();  // 持久化新 name 到 UIStorageManager
        }
        
        // 刷新列表
        this.updateElementList();
        console.log(`✏️ 重命名组件 ${elementId} → ${newName}`);
    }

    /**
     * 显示添加组件对话框
     */
    _showAddElementDialog() {
        // 防止重复弹出
        if (document.getElementById('addElementDialog')) return;
        
        // 遮罩层
        const overlay = document.createElement('div');
        overlay.id = 'addElementDialog';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.7);
            z-index: 20000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        // 对话框
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: #1a1a2e;
            border: 1px solid #444;
            border-radius: 10px;
            padding: 24px;
            width: 360px;
            color: white;
            box-shadow: 0 0 30px rgba(0,0,0,0.8);
        `;
        
        // 标题
        const titleRow = document.createElement('div');
        titleRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;';
        const titleText = document.createElement('h3');
        titleText.textContent = '➕ 添加新 UI 组件';
        titleText.style.cssText = 'margin:0;color:#4CAF50;font-size:16px;';
        const closeX = document.createElement('button');
        closeX.innerHTML = '✕';
        closeX.style.cssText = 'background:transparent;color:#999;border:1px solid #555;width:26px;height:26px;border-radius:4px;cursor:pointer;font-size:14px;';
        closeX.onclick = () => overlay.remove();
        titleRow.appendChild(titleText);
        titleRow.appendChild(closeX);
        dialog.appendChild(titleRow);
        
        // 表单字段
        const fields = [
            { key: 'id',          label: '组件 ID（英文+下划线，唯一）', type: 'text',   default: 'my_component',   placeholder: 'my_component' },
            { key: 'displayName', label: '显示名称（自定义中文名）',       type: 'text',   default: '我的组件',       placeholder: '我的组件' },
            { key: 'zIndex',      label: '层级 z-index',                   type: 'number', default: 100,              min: -999, max: 9999 },
            { key: 'x',           label: '位置 X（基准坐标）',              type: 'number', default: 1280,             min: 0 },
            { key: 'y',           label: '位置 Y（基准坐标）',              type: 'number', default: 720,              min: 0 },
            { key: 'width',       label: '宽度 W',                          type: 'number', default: 300,              min: 10 },
            { key: 'height',      label: '高度 H',                          type: 'number', default: 200,              min: 10 },
        ];
        
        const inputs = {};
        for (const f of fields) {
            const row = document.createElement('div');
            row.style.marginBottom = '12px';
            
            const label = document.createElement('label');
            label.textContent = f.label;
            label.style.cssText = 'display:block;font-size:11px;color:#aaa;margin-bottom:4px;';
            
            const input = document.createElement('input');
            input.type = f.type;
            input.value = f.default;
            if (f.placeholder) input.placeholder = f.placeholder;
            if (f.min !== undefined) input.min = f.min;
            if (f.max !== undefined) input.max = f.max;
            input.style.cssText = `
                width: 100%;
                background: #0d0d1a;
                border: 1px solid #444;
                color: white;
                padding: 6px 8px;
                border-radius: 4px;
                font-size: 13px;
                box-sizing: border-box;
            `;
            input.addEventListener('focus', () => { input.style.borderColor = '#4CAF50'; });
            input.addEventListener('blur',  () => { input.style.borderColor = '#444'; });
            
            row.appendChild(label);
            row.appendChild(input);
            dialog.appendChild(row);
            inputs[f.key] = input;
        }
        
        // ── 图片上传区（可选）──────────────────────────────
        let _pickedImageDataUrl = null; // 闭包内暂存 DataURL

        const imgRow = document.createElement('div');
        imgRow.style.marginBottom = '12px';

        const imgLabel = document.createElement('label');
        imgLabel.textContent = '图片（可选，不传则用粉色占位背景）';
        imgLabel.style.cssText = 'display:block;font-size:11px;color:#aaa;margin-bottom:6px;';
        imgRow.appendChild(imgLabel);

        // 预览框
        const imgPreview = document.createElement('div');
        imgPreview.style.cssText = `
            width: 100%;
            height: 80px;
            background: #ff6b9d;
            border: 2px dashed #555;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            overflow: hidden;
            position: relative;
            margin-bottom: 6px;
            transition: border-color 0.2s;
        `;
        imgPreview.title = '点击选择图片';

        const imgPlaceholderText = document.createElement('span');
        imgPlaceholderText.textContent = '🖼️ 点击上传图片（可选）';
        imgPlaceholderText.style.cssText = 'color:rgba(255,255,255,0.7);font-size:12px;pointer-events:none;';
        imgPreview.appendChild(imgPlaceholderText);

        const imgEl = document.createElement('img');
        imgEl.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:none;';
        imgPreview.appendChild(imgEl);

        // 隐藏的 file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                _pickedImageDataUrl = ev.target.result;
                imgEl.src = _pickedImageDataUrl;
                imgEl.style.display = 'block';
                imgPlaceholderText.style.display = 'none';
                imgPreview.style.background = 'transparent';
                imgPreview.style.borderColor = '#4CAF50';
                clearBtn.style.display = 'inline-block';
            };
            reader.readAsDataURL(file);
            fileInput.value = '';
        });

        imgPreview.addEventListener('click', () => fileInput.click());
        imgPreview.addEventListener('mouseenter', () => { imgPreview.style.borderColor = '#4CAF50'; });
        imgPreview.addEventListener('mouseleave', () => { imgPreview.style.borderColor = _pickedImageDataUrl ? '#4CAF50' : '#555'; });

        imgRow.appendChild(imgPreview);
        imgRow.appendChild(fileInput);

        // 清除按钮
        const clearBtn = document.createElement('button');
        clearBtn.textContent = '✕ 清除图片（使用粉色背景）';
        clearBtn.style.cssText = `
            display: none;
            background: transparent;
            color: #f44336;
            border: 1px solid #f44336;
            padding: 3px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
        `;
        clearBtn.addEventListener('click', () => {
            _pickedImageDataUrl = null;
            imgEl.src = '';
            imgEl.style.display = 'none';
            imgPlaceholderText.style.display = '';
            imgPreview.style.background = '#ff6b9d';
            imgPreview.style.borderColor = '#555';
            clearBtn.style.display = 'none';
        });
        imgRow.appendChild(clearBtn);

        dialog.appendChild(imgRow);
        // ──────────────────────────────────────────────────

        // 错误提示
        const errMsg = document.createElement('div');
        errMsg.style.cssText = 'color:#f44336;font-size:12px;min-height:18px;margin-bottom:8px;';
        dialog.appendChild(errMsg);
        
        // 按钮行
        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex;justify-content:flex-end;gap:10px;margin-top:4px;';
        
        const cancelBtn = this._createButton('取消', '#555', () => overlay.remove());
        
        const confirmBtn = this._createButton('✅ 添加组件', '#4CAF50', () => {
            const cfg = {
                id:              inputs.id.value.trim(),
                displayName:     inputs.displayName.value.trim() || inputs.id.value.trim(),
                zIndex:          parseInt(inputs.zIndex.value) || 100,
                x:               parseInt(inputs.x.value) || 0,
                y:               parseInt(inputs.y.value) || 0,
                width:           parseInt(inputs.width.value) || 300,
                height:          parseInt(inputs.height.value) || 200,
                // 不在 cfg 中存 base64，由 _registerCustomElement 内部处理存图到 IndexedDB
                image:           _pickedImageDataUrl || null,
                backgroundColor: _pickedImageDataUrl ? 'transparent' : '#ff6b9d',
            };
            
            // 校验 ID
            if (!cfg.id) {
                errMsg.textContent = '❌ 组件 ID 不能为空';
                return;
            }
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(cfg.id)) {
                errMsg.textContent = '❌ 组件 ID 只能包含字母、数字、下划线，且不能以数字开头';
                return;
            }
            if (this.app.uiManager && this.app.uiManager.elements.has(cfg.id)) {
                errMsg.textContent = `❌ ID「${cfg.id}」已存在，请换一个`;
                return;
            }
            
            // 注册并持久化（_registerCustomElement 内部会异步存图到 IndexedDB，不会炸 localStorage）
            this._registerCustomElement(cfg, true);
            
            // 刷新列表并关闭对话框
            this.updateElementList();
            overlay.remove();
            
            // 自动选中新元素
            this.selectElement(cfg.id);
            console.log(`✅ 添加了自定义组件: ${cfg.id}`);
        });
        
        btnRow.appendChild(cancelBtn);
        btnRow.appendChild(confirmBtn);
        dialog.appendChild(btnRow);
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // 点击遮罩关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
        
        // 自动聚焦 ID 输入框
        setTimeout(() => inputs.id.focus(), 50);
    }
}

// 导出编辑器管理器类
if (typeof window !== 'undefined') {
    window.EditorManager = EditorManager;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EditorManager;
}