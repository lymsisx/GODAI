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
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 10000;
            width: 400px;
            max-height: 80vh;
            overflow-y: auto;
            display: none;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
            border: 1px solid #333;
        `;
        
        // 标题
        const title = document.createElement('h3');
        title.textContent = 'UI元素编辑器';
        title.style.marginTop = '0';
        title.style.color = '#4CAF50';
        title.style.borderBottom = '1px solid #444';
        title.style.paddingBottom = '10px';
        panel.appendChild(title);
        
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
        
        // 为每个元素创建选择按钮
        let elementCount = 0;
        for (const [elementId, uiElement] of elements.entries()) {
            const button = document.createElement('button');
            button.textContent = elementId;
            button.dataset.elementId = elementId;
            
            // 设置按钮样式
            button.style.cssText = `
                background: ${this.currentElementId === elementId ? '#4CAF50' : '#333'};
                color: white;
                border: 1px solid ${this.currentElementId === elementId ? '#4CAF50' : '#555'};
                padding: 6px 10px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 11px;
                text-align: center;
                transition: all 0.2s ease;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            `;
            
            // 悬停效果
            button.addEventListener('mouseenter', () => {
                if (this.currentElementId !== elementId) {
                    button.style.background = '#444';
                }
            });
            button.addEventListener('mouseleave', () => {
                if (this.currentElementId !== elementId) {
                    button.style.background = '#333';
                }
            });
            
            // 点击事件
            button.addEventListener('click', () => {
                this.selectElement(elementId);
            });
            
            elementList.appendChild(button);
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
}

// 导出编辑器管理器类
if (typeof window !== 'undefined') {
    window.EditorManager = EditorManager;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EditorManager;
}