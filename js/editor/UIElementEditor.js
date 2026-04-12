/**
 * 通用UI元素编辑器模块
 * 提供所有UI元素的位置、尺寸和阴影编辑功能
 */
class UIElementEditor {
    constructor(uiElement) {
        this.uiElement = uiElement;
        this.config = null;
        this.controls = {};
        this.editorPanel = null;
        this.isVisible = false;
        
        this._init();
    }

    /**
     * 初始化编辑器
     */
    _init() {
        // 安全加载配置
        this.config = (this.uiElement && typeof this.uiElement.getConfig === 'function')
            ? this.uiElement.getConfig()
            : this._getDefaultConfig();
        console.log('✏️ UI元素编辑器初始化，元素ID:', this.config.id, '配置:', this.config);
    }

    /**
     * 获取默认配置
     */
    _getDefaultConfig() {
        return {
            id: this.uiElement ? this.uiElement.id : 'unknown',
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            shadow: {
                offsetX: 4,
                offsetY: 4,
                color: '#333333',
                opacity: 0.7
            },
            visible: true,
            zIndex: 100,
            image: null,
            defaultImage: null,
            objectFit: 'cover'
        };
    }

    /**
     * 将编辑控件注入到现有编辑面板
     * @param {HTMLElement} editPanel 现有的编辑面板元素
     */
    injectControls(editPanel) {
        // 创建UI元素编辑控制组
        const controlGroup = this._createControlGroup();
        
        // 找到合适的位置插入（在最后重置按钮之前）
        const resetAllBtn = editPanel.querySelector('.reset-all-btn');
        if (resetAllBtn) {
            editPanel.insertBefore(controlGroup, resetAllBtn);
        } else {
            // 如果没有重置按钮，添加到面板末尾
            editPanel.appendChild(controlGroup);
        }
        
        this.editorPanel = editPanel;
        console.log('✏️ UI元素编辑控件已注入到编辑面板，元素ID:', this.config.id);
    }

    /**
     * 创建新的编辑器面板
     */
    createEditorPanel() {
        const panel = document.createElement('div');
        panel.id = `uiElementEditorPanel_${this.config.id}`;
        panel.className = 'editor-panel';
        panel.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 1001;
            width: 320px;
        `;
        
        // 添加标题
        const title = document.createElement('h3');
        title.textContent = `编辑: ${this.config.id}`;
        title.style.marginTop = '0';
        title.style.color = '#4CAF50';
        panel.appendChild(title);
        
        // 添加控制组
        const controlGroup = this._createControlGroup();
        panel.appendChild(controlGroup);
        
        // 添加到页面
        document.body.appendChild(panel);
        this.editorPanel = panel;
        
        console.log('✏️ 创建了独立的UI元素编辑器面板，元素ID:', this.config.id);
    }

    /**
     * 创建控制组
     */
    _createControlGroup() {
        const controlGroup = document.createElement('div');
        controlGroup.className = 'control-group';
        controlGroup.style.cssText = `
            margin: 10px 0;
            padding: 15px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 5px;
        `;
        
        // 标题
        const title = document.createElement('strong');
        title.textContent = `📊 ${this.config.id} 编辑`;
        title.style.display = 'block';
        title.style.marginBottom = '10px';
        title.style.fontSize = '14px';
        title.style.color = '#FF9800';
        controlGroup.appendChild(title);
        
        // 可见性控制
        controlGroup.appendChild(this._createVisibilityControl());
        controlGroup.appendChild(document.createElement('br'));
        
        // 位置控制
        controlGroup.appendChild(this._createPositionControls());
        controlGroup.appendChild(document.createElement('br'));
        
        // 尺寸控制
        controlGroup.appendChild(this._createSizeControls());
        controlGroup.appendChild(document.createElement('br'));
        
        // 阴影控制
        controlGroup.appendChild(this._createShadowControls());
        controlGroup.appendChild(document.createElement('br'));
        
        // 层级控制
        controlGroup.appendChild(this._createZIndexControl());
        controlGroup.appendChild(document.createElement('br'));

        // 图片控制（始终显示，支持上传和更换）
        controlGroup.appendChild(this._createImageControl());
        controlGroup.appendChild(document.createElement('br'));
        controlGroup.appendChild(this._createObjectFitControl());
        controlGroup.appendChild(document.createElement('br'));
        
        // 操作按钮
        controlGroup.appendChild(this._createActionButtons());
        
        return controlGroup;
    }

    /**
     * 创建可见性控制
     */
    _createVisibilityControl() {
        const container = document.createElement('div');
        container.className = 'control-row';
        container.style.marginBottom = '10px';
        
        const label = document.createElement('label');
        label.textContent = '可见性:';
        label.style.display = 'inline-block';
        label.style.marginRight = '10px';
        label.style.fontSize = '12px';
        container.appendChild(label);
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = this.config.visible !== false;
        checkbox.addEventListener('change', () => {
            const visible = checkbox.checked;
            this._updateVisibility(visible);
        });
        checkbox.style.verticalAlign = 'middle';
        checkbox.style.marginRight = '5px';
        container.appendChild(checkbox);
        
        const checkboxLabel = document.createElement('span');
        checkboxLabel.textContent = '显示元素';
        checkboxLabel.style.verticalAlign = 'middle';
        checkboxLabel.style.fontSize = '12px';
        checkboxLabel.style.cursor = 'pointer';
        checkboxLabel.addEventListener('click', () => {
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
        });
        container.appendChild(checkboxLabel);
        
        // 存储控件引用
        this.controls.visibility = checkbox;
        
        return container;
    }

    /**
     * 创建位置控制
     */
    _createPositionControls() {
        const container = document.createElement('div');
        container.className = 'control-row';
        
        const label = document.createElement('label');
        label.textContent = '位置 (基准像素):';
        label.style.display = 'block';
        label.style.marginBottom = '5px';
        label.style.fontSize = '12px';
        container.appendChild(label);
        
        // X坐标输入
        const xContainer = document.createElement('div');
        xContainer.style.display = 'inline-block';
        xContainer.style.marginRight = '10px';
        xContainer.style.marginBottom = '5px';
        
        const xLabel = document.createElement('span');
        xLabel.textContent = 'X:';
        xLabel.style.marginRight = '5px';
        xLabel.style.fontSize = '12px';
        xContainer.appendChild(xLabel);
        
        const xInput = document.createElement('input');
        xInput.type = 'number';
        xInput.value = this.config.x !== undefined ? this.config.x : 0;
        xInput.min = '0';
        xInput.max = '2560';
        xInput.style.width = '70px';
        xInput.style.padding = '3px';
        xInput.style.fontSize = '12px';
        xInput.addEventListener('input', () => {
            this._updatePosition('x', parseInt(xInput.value) || 0);
        });
        xContainer.appendChild(xInput);
        
        // Y坐标输入
        const yContainer = document.createElement('div');
        yContainer.style.display = 'inline-block';
        yContainer.style.marginBottom = '5px';
        
        const yLabel = document.createElement('span');
        yLabel.textContent = 'Y:';
        yLabel.style.marginRight = '5px';
        yLabel.style.fontSize = '12px';
        yContainer.appendChild(yLabel);
        
        const yInput = document.createElement('input');
        yInput.type = 'number';
        yInput.value = this.config.y !== undefined ? this.config.y : 0;
        yInput.min = '0';
        yInput.max = '1440';
        yInput.style.width = '70px';
        yInput.style.padding = '3px';
        yInput.style.fontSize = '12px';
        yInput.addEventListener('input', () => {
            this._updatePosition('y', parseInt(yInput.value) || 0);
        });
        yContainer.appendChild(yInput);
        
        container.appendChild(xContainer);
        container.appendChild(yContainer);
        
        // 存储控件引用
        this.controls.positionX = xInput;
        this.controls.positionY = yInput;
        
        return container;
    }

    /**
     * 创建尺寸控制
     */
    _createSizeControls() {
        const container = document.createElement('div');
        container.className = 'control-row';
        
        const label = document.createElement('label');
        label.textContent = '尺寸 (基准像素):';
        label.style.display = 'block';
        label.style.marginBottom = '5px';
        label.style.fontSize = '12px';
        container.appendChild(label);
        
        // 宽度输入
        const widthContainer = document.createElement('div');
        widthContainer.style.display = 'inline-block';
        widthContainer.style.marginRight = '10px';
        widthContainer.style.marginBottom = '5px';
        
        const widthLabel = document.createElement('span');
        widthLabel.textContent = '宽:';
        widthLabel.style.marginRight = '5px';
        widthLabel.style.fontSize = '12px';
        widthContainer.appendChild(widthLabel);
        
        const widthInput = document.createElement('input');
        widthInput.type = 'number';
        widthInput.value = this.config.width !== undefined ? this.config.width : 100;
        widthInput.min = '10';
        widthInput.max = '2560';
        widthInput.style.width = '70px';
        widthInput.style.padding = '3px';
        widthInput.style.fontSize = '12px';
        widthInput.addEventListener('input', () => {
            this._updateSize('width', parseInt(widthInput.value) || 10);
        });
        widthContainer.appendChild(widthInput);
        
        // 高度输入
        const heightContainer = document.createElement('div');
        heightContainer.style.display = 'inline-block';
        heightContainer.style.marginBottom = '5px';
        
        const heightLabel = document.createElement('span');
        heightLabel.textContent = '高:';
        heightLabel.style.marginRight = '5px';
        heightLabel.style.fontSize = '12px';
        heightContainer.appendChild(heightLabel);
        
        const heightInput = document.createElement('input');
        heightInput.type = 'number';
        heightInput.value = this.config.height !== undefined ? this.config.height : 50;
        heightInput.min = '10';
        heightInput.max = '1440';
        heightInput.style.width = '70px';
        heightInput.style.padding = '3px';
        heightInput.style.fontSize = '12px';
        heightInput.addEventListener('input', () => {
            this._updateSize('height', parseInt(heightInput.value) || 10);
        });
        heightContainer.appendChild(heightInput);
        
        container.appendChild(widthContainer);
        container.appendChild(heightContainer);
        
        // 存储控件引用
        this.controls.width = widthInput;
        this.controls.height = heightInput;
        
        return container;
    }

    /**
     * 创建阴影控制
     */
    _createShadowControls() {
        // 防御：config 或 shadow 缺失时返回空容器
        if (!this.config || !this.config.shadow) {
            console.warn('⚠️ 编辑器配置缺少 shadow 数据，跳过阴影控制创建');
            return document.createElement('div');
        }

        const container = document.createElement('div');
        container.className = 'control-row';
        
        const label = document.createElement('label');
        label.textContent = '阴影设置:';
        label.style.display = 'block';
        label.style.marginBottom = '5px';
        label.style.fontSize = '12px';
        container.appendChild(label);
        
        // 阴影偏移X
        const offsetXContainer = document.createElement('div');
        offsetXContainer.style.display = 'inline-block';
        offsetXContainer.style.marginRight = '10px';
        offsetXContainer.style.marginBottom = '5px';
        
        const offsetXLabel = document.createElement('span');
        offsetXLabel.textContent = '偏移X:';
        offsetXLabel.style.marginRight = '5px';
        offsetXLabel.style.fontSize = '12px';
        offsetXContainer.appendChild(offsetXLabel);
        
        const offsetXInput = document.createElement('input');
        offsetXInput.type = 'number';
        offsetXInput.value = this.config.shadow.offsetX || 0;
        offsetXInput.min = '0';
        offsetXInput.max = '20';
        offsetXInput.style.width = '60px';
        offsetXInput.style.padding = '3px';
        offsetXInput.style.fontSize = '12px';
        offsetXInput.addEventListener('input', () => {
            this._updateShadow('offsetX', parseInt(offsetXInput.value) || 0);
        });
        offsetXContainer.appendChild(offsetXInput);
        
        // 阴影偏移Y
        const offsetYContainer = document.createElement('div');
        offsetYContainer.style.display = 'inline-block';
        offsetYContainer.style.marginRight = '10px';
        offsetYContainer.style.marginBottom = '5px';
        
        const offsetYLabel = document.createElement('span');
        offsetYLabel.textContent = '偏移Y:';
        offsetYLabel.style.marginRight = '5px';
        offsetYLabel.style.fontSize = '12px';
        offsetYContainer.appendChild(offsetYLabel);
        
        const offsetYInput = document.createElement('input');
        offsetYInput.type = 'number';
        offsetYInput.value = this.config.shadow.offsetY || 0;
        offsetYInput.min = '0';
        offsetYInput.max = '20';
        offsetYInput.style.width = '60px';
        offsetYInput.style.padding = '3px';
        offsetYInput.style.fontSize = '12px';
        offsetYInput.addEventListener('input', () => {
            this._updateShadow('offsetY', parseInt(offsetYInput.value) || 0);
        });
        offsetYContainer.appendChild(offsetYInput);
        
        // 阴影颜色
        const colorContainer = document.createElement('div');
        colorContainer.style.display = 'inline-block';
        colorContainer.style.marginBottom = '5px';
        
        const colorLabel = document.createElement('span');
        colorLabel.textContent = '颜色:';
        colorLabel.style.marginRight = '5px';
        colorLabel.style.fontSize = '12px';
        colorContainer.appendChild(colorLabel);
        
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = this.config.shadow.color || '#333333';
        colorInput.style.width = '40px';
        colorInput.style.height = '20px';
        colorInput.style.verticalAlign = 'middle';
        colorInput.addEventListener('input', () => {
            this._updateShadow('color', colorInput.value);
        });
        colorContainer.appendChild(colorInput);
        
        // 颜色预览
        const colorPreview = document.createElement('span');
        colorPreview.textContent = this.config.shadow.color || '#333333';
        colorPreview.style.marginLeft = '5px';
        colorPreview.style.fontSize = '11px';
        colorPreview.style.verticalAlign = 'middle';
        colorContainer.appendChild(colorPreview);
        
        // 阴影透明度
        const opacityContainer = document.createElement('div');
        opacityContainer.style.display = 'block';
        opacityContainer.style.marginTop = '5px';
        
        const opacityLabel = document.createElement('span');
        opacityLabel.textContent = '透明度:';
        opacityLabel.style.marginRight = '5px';
        opacityLabel.style.fontSize = '12px';
        opacityContainer.appendChild(opacityLabel);
        
        const opacityInput = document.createElement('input');
        opacityInput.type = 'range';
        opacityInput.min = '0';
        opacityInput.max = '100';
        opacityInput.step = '5';
        opacityInput.value = (this.config.shadow.opacity || 0.7) * 100;
        opacityInput.style.width = '150px';
        opacityInput.style.verticalAlign = 'middle';
        opacityInput.addEventListener('input', () => {
            const opacity = parseInt(opacityInput.value) / 100;
            this._updateShadow('opacity', opacity);
        });
        opacityContainer.appendChild(opacityInput);
        
        const opacityValue = document.createElement('span');
        opacityValue.textContent = `${opacityInput.value}%`;
        opacityValue.style.marginLeft = '5px';
        opacityValue.style.fontSize = '11px';
        opacityValue.style.verticalAlign = 'middle';
        opacityContainer.appendChild(opacityValue);
        
        container.appendChild(offsetXContainer);
        container.appendChild(offsetYContainer);
        container.appendChild(colorContainer);
        container.appendChild(opacityContainer);
        
        // 存储控件引用
        this.controls.shadowOffsetX = offsetXInput;
        this.controls.shadowOffsetY = offsetYInput;
        this.controls.shadowColor = colorInput;
        this.controls.shadowColorPreview = colorPreview;
        this.controls.shadowOpacity = opacityInput;
        this.controls.shadowOpacityValue = opacityValue;
        
        return container;
    }

    /**
     * 创建Z-Index控制
     */
    _createZIndexControl() {
        const container = document.createElement('div');
        container.className = 'control-row';
        
        const label = document.createElement('label');
        label.textContent = '层级 (z-index):';
        label.style.display = 'block';
        label.style.marginBottom = '5px';
        label.style.fontSize = '12px';
        container.appendChild(label);
        
        const zIndexContainer = document.createElement('div');
        zIndexContainer.style.display = 'inline-block';
        
        const zIndexInput = document.createElement('input');
        zIndexInput.type = 'number';
        zIndexInput.value = this.config.zIndex !== undefined ? this.config.zIndex : 100;
        zIndexInput.min = '-1000';
        zIndexInput.max = '1000';
        zIndexInput.style.width = '70px';
        zIndexInput.style.padding = '3px';
        zIndexInput.style.fontSize = '12px';
        zIndexInput.addEventListener('input', () => {
            this._updateZIndex(parseInt(zIndexInput.value) || 100);
        });
        zIndexContainer.appendChild(zIndexInput);
        
        container.appendChild(zIndexContainer);
        
        // 存储控件引用
        this.controls.zIndex = zIndexInput;
        
        return container;
    }

    /**
     * 创建操作按钮
     */
    _createActionButtons() {
        const container = document.createElement('div');
        container.className = 'action-buttons';
        container.style.marginTop = '10px';
        
        // 应用按钮
        const applyBtn = this._createButton('应用', '#4CAF50', () => {
            this.applyChanges();
        });
        applyBtn.style.marginRight = '5px';
        
        // 保存按钮
        const saveBtn = this._createButton('保存', '#2196F3', () => {
            this.saveChanges();
        });
        saveBtn.style.marginRight = '5px';
        
        // 重置按钮
        const resetBtn = this._createButton('重置', '#f44336', () => {
            this.resetToDefault();
        });
        
        // 实时预览复选框
        const livePreviewContainer = document.createElement('div');
        livePreviewContainer.style.marginTop = '8px';
        livePreviewContainer.style.fontSize = '11px';
        
        const livePreviewCheckbox = document.createElement('input');
        livePreviewCheckbox.type = 'checkbox';
        livePreviewCheckbox.id = `livePreview_${this.config.id}`;
        livePreviewCheckbox.checked = true;
        livePreviewCheckbox.style.marginRight = '5px';
        livePreviewCheckbox.style.verticalAlign = 'middle';
        
        const livePreviewLabel = document.createElement('label');
        livePreviewLabel.htmlFor = `livePreview_${this.config.id}`;
        livePreviewLabel.textContent = '实时预览';
        livePreviewLabel.style.verticalAlign = 'middle';
        livePreviewLabel.style.cursor = 'pointer';
        
        livePreviewContainer.appendChild(livePreviewCheckbox);
        livePreviewContainer.appendChild(livePreviewLabel);
        
        container.appendChild(applyBtn);
        container.appendChild(saveBtn);
        container.appendChild(resetBtn);
        container.appendChild(livePreviewContainer);
        
        // 存储控件引用
        this.controls.livePreview = livePreviewCheckbox;
        
        return container;
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
            padding: 6px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
        `;
        button.addEventListener('mouseenter', () => {
            button.style.opacity = '0.9';
        });
        button.addEventListener('mouseleave', () => {
            button.style.opacity = '1';
        });
        button.addEventListener('click', onClick);
        return button;
    }

    /**
     * 更新可见性
     */
    _updateVisibility(visible) {
        if (this.controls.livePreview && this.controls.livePreview.checked) {
            if (visible) {
                this.uiElement.show();
            } else {
                this.uiElement.hide();
            }
        }
        this.config.visible = visible;
    }

    /**
     * 更新位置
     */
    _updatePosition(axis, value) {
        if (this.controls.livePreview && this.controls.livePreview.checked) {
            this.uiElement.update({ [axis]: value });
        }
        this.config[axis] = value;
    }

    /**
     * 更新尺寸
     */
    _updateSize(dimension, value) {
        if (this.controls.livePreview && this.controls.livePreview.checked) {
            this.uiElement.update({ [dimension]: value });
        }
        this.config[dimension] = value;
    }

    /**
     * 更新阴影
     */
    _updateShadow(property, value) {
        // 防御：config 或 shadow 缺失时跳过
        if (!this.config || !this.config.shadow) {
            console.warn('⚠️ 编辑器配置缺少 shadow 数据，跳过阴影更新');
            return;
        }
        
        if (property === 'color' && this.controls.shadowColorPreview) {
            this.controls.shadowColorPreview.textContent = value;
        }
        
        if (property === 'opacity' && this.controls.shadowOpacityValue) {
            this.controls.shadowOpacityValue.textContent = `${Math.round(value * 100)}%`;
        }
        
        if (this.controls.livePreview && this.controls.livePreview.checked) {
            this.uiElement.update({ 
                shadow: { ...this.config.shadow, [property]: value }
            });
        }
        this.config.shadow[property] = value;
    }

    /**
     * 更新Z-Index
     */
    _updateZIndex(value) {
        if (this.controls.livePreview && this.controls.livePreview.checked) {
            this.uiElement.update({ zIndex: value });
        }
        this.config.zIndex = value;
    }

    /**
     * 应用更改
     */
    applyChanges() {
        console.log('✏️ 应用UI元素更改，元素ID:', this.config.id, '配置:', this.config);
        this.uiElement.update(this.config);
        alert(`UI元素 "${this.config.id}" 设置已应用！`);
    }

    /**
     * 保存更改到本地存储
     * 图片 base64 走 IndexedDB（无大小限制），其余配置走 localStorage。
     */
    saveChanges() {
        // 安全获取最新配置
        const finalConfig = (this.uiElement && typeof this.uiElement.getConfig === 'function')
            ? this.uiElement.getConfig()
            : this.config;
        
        // 先应用到元素（uiElement.update 内部的 saveConfig 已走 IndexedDB，不会炸）
        if (this.uiElement && typeof this.uiElement.update === 'function') {
            this.uiElement.update(finalConfig);
        }
        
        // 统一使用 UIStorageManager 保存非图片配置
        const UIStorageManager = window.UIStorageManager;
        if (UIStorageManager && typeof UIStorageManager.saveElementConfig === 'function') {
            // 剥离 image 字段，防止把 base64 写入 localStorage 撑爆 5MB 限制
            const imageDataUrl = finalConfig.image;
            const configToSave = { ...finalConfig };
            delete configToSave.image;
            UIStorageManager.saveElementConfig(this.config.id, configToSave);

            // 图片单独存 IndexedDB（异步，不阻塞）
            if (imageDataUrl && typeof UIStorageManager.saveImageAsync === 'function') {
                UIStorageManager.saveImageAsync(this.config.id, imageDataUrl).catch(err => {
                    console.warn('⚠️ IndexedDB 存图失败:', err);
                });
            }

            console.log('💾 UI元素配置已保存，元素ID:', this.config.id);
            alert(`UI元素 "${this.config.id}" 配置已保存！刷新后将自动恢复。`);
        } else {
            console.error('❌ UIStorageManager 模块不可用，无法保存配置');
            alert('保存失败：UIStorageManager模块不可用');
        }
    }

    /**
     * 重置到默认值
     */
    resetToDefault() {
        if (confirm(`确定要重置UI元素 "${this.config.id}" 到默认设置吗？`)) {
            const defaultConfig = this._getDefaultConfig();
            
            // 更新配置
            this.config = { ...defaultConfig };
            
            // 更新控件值
            if (this.controls.positionX) this.controls.positionX.value = defaultConfig.x;
            if (this.controls.positionY) this.controls.positionY.value = defaultConfig.y;
            if (this.controls.width) this.controls.width.value = defaultConfig.width;
            if (this.controls.height) this.controls.height.value = defaultConfig.height;
            if (this.controls.zIndex) this.controls.zIndex.value = defaultConfig.zIndex;
            if (this.controls.visibility) this.controls.visibility.checked = defaultConfig.visible !== false;
            
            if (this.config.shadow) {
                if (this.controls.shadowOffsetX) this.controls.shadowOffsetX.value = defaultConfig.shadow.offsetX;
                if (this.controls.shadowOffsetY) this.controls.shadowOffsetY.value = defaultConfig.shadow.offsetY;
                if (this.controls.shadowColor) this.controls.shadowColor.value = defaultConfig.shadow.color;
                if (this.controls.shadowColorPreview) this.controls.shadowColorPreview.textContent = defaultConfig.shadow.color;
                if (this.controls.shadowOpacity) this.controls.shadowOpacity.value = defaultConfig.shadow.opacity * 100;
                if (this.controls.shadowOpacityValue) this.controls.shadowOpacityValue.textContent = `${defaultConfig.shadow.opacity * 100}%`;
            }
            
            // 应用更改
            this.uiElement.update(defaultConfig);
            
            // 从UIStorageManager中移除该元素的配置
            const UIStorageManager = window.UIStorageManager;
            if (UIStorageManager && typeof UIStorageManager.saveElementConfig === 'function') {
                // 加载全部配置，删除当前元素，重新保存
                const allConfig = UIStorageManager.loadConfig() || {};
                delete allConfig[this.config.id];
                UIStorageManager.saveConfig(allConfig);
            }
            
            console.log('🔄 UI元素已重置到默认值，元素ID:', this.config.id);
            alert(`UI元素 "${this.config.id}" 已重置到默认设置！`);
        }
    }

    /**
     * 显示/隐藏编辑器
     */
    toggle() {
        if (this.editorPanel) {
            this.isVisible = !this.isVisible;
            this.editorPanel.style.display = this.isVisible ? 'block' : 'none';
            console.log('✏️ UI元素编辑器', this.isVisible ? '显示' : '隐藏', '元素ID:', this.config.id);
        }
    }

    /**
     * 更新配置显示
     */
    refresh() {
        this.config = (this.uiElement && typeof this.uiElement.getConfig === 'function')
            ? this.uiElement.getConfig()
            : this.config;
        
        // 更新控件值
        if (this.controls.positionX) {
            this.controls.positionX.value = this.config.x;
            this.controls.positionY.value = this.config.y;
            this.controls.width.value = this.config.width;
            this.controls.height.value = this.config.height;
            if (this.controls.zIndex) this.controls.zIndex.value = this.config.zIndex;
            if (this.controls.visibility) this.controls.visibility.checked = this.config.visible !== false;
            
            if (this.config.shadow) {
                this.controls.shadowOffsetX.value = this.config.shadow.offsetX;
                this.controls.shadowOffsetY.value = this.config.shadow.offsetY;
                this.controls.shadowColor.value = this.config.shadow.color;
                this.controls.shadowColorPreview.textContent = this.config.shadow.color;
                this.controls.shadowOpacity.value = (this.config.shadow.opacity || 0.7) * 100;
                this.controls.shadowOpacityValue.textContent = `${Math.round((this.config.shadow.opacity || 0.7) * 100)}%`;
            }
        }
        
        console.log('✏️ UI元素编辑器配置已刷新，元素ID:', this.config.id, '配置:', this.config);
    }

    /**
     * 创建图片控制
     */
    _createImageControl() {
        const container = document.createElement('div');
        container.className = 'control-row';

        const label = document.createElement('label');
        label.textContent = '图片设置:';
        label.style.display = 'block';
        label.style.marginBottom = '5px';
        label.style.fontSize = '12px';
        container.appendChild(label);

        // 图片更换按钮
        const changeImageBtn = document.createElement('button');
        changeImageBtn.textContent = '更换图片';
        changeImageBtn.style.cssText = `
            background: #2196F3;
            color: white;
            border: none;
            padding: 6px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            margin-right: 10px;
        `;
        changeImageBtn.addEventListener('click', () => {
            this._changeImage();
        });
        container.appendChild(changeImageBtn);

        // 清除图片按钮
        const clearImageBtn = document.createElement('button');
        clearImageBtn.textContent = '清除图片';
        clearImageBtn.style.cssText = `
            background: #f44336;
            color: white;
            border: none;
            padding: 6px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        `;
        clearImageBtn.addEventListener('click', () => {
            if (confirm('确定要清除当前图片吗？')) {
                this.uiElement.updateImage(null);
                alert('图片已清除！');
            }
        });
        container.appendChild(clearImageBtn);

        return container;
    }

    /**
     * 创建图片拉伸模式控制
     */
    _createObjectFitControl() {
        const container = document.createElement('div');
        container.className = 'control-row';

        const label = document.createElement('label');
        label.textContent = '图片拉伸模式:';
        label.style.display = 'block';
        label.style.marginBottom = '5px';
        label.style.fontSize = '12px';
        container.appendChild(label);

        // object-fit选择下拉框
        const select = document.createElement('select');
        select.style.cssText = `
            padding: 4px 8px;
            font-size: 12px;
            border-radius: 4px;
            border: 1px solid #555;
            background: #333;
            color: white;
            width: 120px;
        `;

        const options = [
            { value: 'cover', text: '覆盖 (cover)' },
            { value: 'contain', text: '包含 (contain)' },
            { value: 'fill', text: '填充 (fill)' },
            { value: 'none', text: '无 (none)' },
            { value: 'scale-down', text: '缩放缩小 (scale-down)' }
        ];

        options.forEach(option => {
            const optionEl = document.createElement('option');
            optionEl.value = option.value;
            optionEl.textContent = option.text;
            if (this.config.objectFit === option.value ||
                (!this.config.objectFit && option.value === 'cover')) {
                optionEl.selected = true;
            }
            select.appendChild(optionEl);
        });

        select.addEventListener('change', () => {
            const objectFit = select.value;
            if (this.controls.livePreview && this.controls.livePreview.checked) {
                // 调用UIElementBase的updateObjectFit方法
                if (typeof this.uiElement.updateObjectFit === 'function') {
                    this.uiElement.updateObjectFit(objectFit);
                } else {
                    // 后备方案：直接更新样式
                    if (this.uiElement.imageElement) {
                        this.uiElement.imageElement.style.objectFit = objectFit;
                    }
                }
            }
            this.config.objectFit = objectFit;
        });

        container.appendChild(select);

        // 存储控件引用
        this.controls.objectFit = select;

        return container;
    }

    /**
     * 更换图片
     */
    _changeImage() {
        // 创建文件输入框
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';

        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.match('image.*')) {
                alert('请选择图片文件！');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const imageDataUrl = event.target.result;
                this.uiElement.updateImage(imageDataUrl);
                alert('图片已更换！');
            };
            reader.readAsDataURL(file);

            // 清理
            input.value = '';
            if (input.parentNode) input.parentNode.removeChild(input);
        });

        document.body.appendChild(input);
        input.click();
        // 不立即移除 input，等 change 事件触发后再清理
        // 部分浏览器在 DOM 移除后 change 事件丢失，导致选图后无反应
        setTimeout(() => {
            if (input && input.parentNode) {
                input.parentNode.removeChild(input);
            }
        }, 60000); // 60秒超时兜底清理
    }
}

// 导出编辑器类
// 统一导出模式：同时支持浏览器和Node.js环境
if (typeof window !== 'undefined') {
    window.UIElementEditor = UIElementEditor;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIElementEditor;
}