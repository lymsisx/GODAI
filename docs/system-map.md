# UI预览工具 - 系统地图

## 项目概述

这是一个基于2560×1440基准分辨率的UI预览工具，用于预览、编辑和测试UI组件。所有UI元素以基准分辨率设计，支持自适应缩放和硬阴影效果。

## 文件结构地图

```
GODAI/                              # 项目根目录
├── 📄 index.html                   # 主入口文件
├── 📁 css/                         # 样式文件目录
│   ├── 📄 main.css                 # 基础样式和全局样式
│   ├── 📄 ui-elements.css          # UI元素通用样式
│   ├── 📄 editor.css               # 编辑面板样式
│   └── 📄 status-bar.css           # 状态栏专用样式
├── 📁 js/                          # JavaScript文件目录
│   ├── 📁 core/                    # 核心管理模块
│   │   ├── 📄 UIManager.js         # UI元素管理器 - 管理所有UI元素
│   │   └── 📄 AppConfig.js         # 应用配置管理器 - 管理全局配置
│   ├── 📁 ui/                      # UI组件模块
│   │   ├── 📄 StatusBarUI.js       # 状态栏组件 - 状态栏的具体实现
│   │   └── 📄 UIElementBase.js     # UI元素基类 - 所有UI组件的基类
│   ├── 📁 utils/                   # 工具函数模块
│   │   ├── 📄 Scaler.js            # 缩放计算工具 - 处理分辨率自适应
│   │   ├── 📄 Storage.js           # 本地存储管理 - 处理配置持久化
│   │   └── 📄 FileHandler.js       # 文件处理工具 - 处理图片上传
│   ├── 📁 editor/                  # 编辑功能模块
│   │   ├── 📄 EditorPanel.js       # 编辑面板控制器 - 编辑界面的主控制器
│   │   └── 📄 PropertyEditor.js    # 属性编辑器 - 属性编辑的具体实现
│   └── 📄 main.js                  # 应用主入口 - 初始化所有模块
├── 📁 config/                      # 配置文件目录
│   ├── 📄 ui-config.json           # UI元素默认配置
│   └── 📄 user-config.json         # 用户配置（自动生成）
├── 📁 assets/                      # 资源文件目录
│   ├── 📁 background/              # 背景图片
│   ├── 📁 desktop/                 # 桌面素材
│   ├── 📁 statusbar/               # 状态栏素材
│   └── 📁 statusbar_shadow/        # 状态栏阴影素材
└── 📁 docs/                        # 项目文档
    ├── 📄 施工思路.md              # 施工思路文档
    └── 📄 system-map.md            # 本系统地图文档
```

## 模块依赖关系图

```
index.html
    ├── css/main.css
    ├── css/ui-elements.css
    ├── css/editor.css
    ├── css/status-bar.css
    ├── js/main.js
    └── config/ui-config.json
```

```
main.js
    ├── core/UIManager.js
    │   ├── ui/UIElementBase.js
    │   └── ui/StatusBarUI.js
    ├── core/AppConfig.js
    ├── utils/Scaler.js
    ├── utils/Storage.js
    ├── utils/FileHandler.js
    ├── editor/EditorPanel.js
    └── editor/PropertyEditor.js
```

## 模块功能详解

### 1. 核心模块 (core/)

#### UIManager.js
**功能**: 管理所有UI元素的创建、更新和销毁
**依赖**: UIElementBase.js, Scaler.js
**接口**:
- `registerElement(elementConfig)`: 注册UI元素
- `renderAll()`: 渲染所有UI元素
- `updateElement(elementId, newConfig)`: 更新指定元素
- `getElement(elementId)`: 获取指定元素实例
- `handleResize()`: 处理窗口大小变化

#### AppConfig.js
**功能**: 管理应用全局配置
**依赖**: Storage.js
**接口**:
- `loadConfig()`: 加载配置文件
- `saveConfig()`: 保存配置
- `getConfig(key)`: 获取指定配置项
- `setConfig(key, value)`: 设置配置项
- `resetConfig()`: 重置为默认配置

### 2. UI组件模块 (ui/)

#### UIElementBase.js
**功能**: 所有UI组件的基类，提供通用功能
**依赖**: Scaler.js
**属性**:
- `id`: 元素唯一标识
- `type`: 元素类型
- `config`: 配置对象
- `domElement`: 对应的DOM元素
**方法**:
- `render()`: 渲染元素（需子类实现）
- `update(config)`: 更新配置
- `applyScale()`: 应用缩放
- `applyPosition()`: 应用位置
- `applyShadow()`: 应用阴影

#### StatusBarUI.js
**功能**: 状态栏组件的具体实现
**继承**: UIElementBase.js
**专有属性**:
- `shadowConfig`: 阴影配置（offsetX, offsetY, color, opacity）
**专有方法**:
- `createShadowElement()`: 创建阴影DOM元素
- `updateShadow(offsetX, offsetY, color)`: 更新阴影参数
- `applyImage(src)`: 应用状态栏图片

### 3. 工具模块 (utils/)

#### Scaler.js
**功能**: 处理分辨率自适应缩放
**常量**:
- `BASE_WIDTH = 2560`: 基准宽度
- `BASE_HEIGHT = 1440`: 基准高度
**方法**:
- `getScale()`: 获取当前缩放比例
- `toActual(baseValue)`: 基准值转实际像素值
- `toBase(actualValue)`: 实际像素值转基准值
- `scalePosition(baseX, baseY)`: 缩放位置坐标
- `scaleSize(baseWidth, baseHeight)`: 缩放尺寸

#### Storage.js
**功能**: 处理本地存储和配置持久化
**方法**:
- `save(key, value)`: 保存数据到localStorage
- `load(key, defaultValue)`: 从localStorage加载数据
- `saveConfig(config)`: 保存UI配置
- `loadConfig()`: 加载UI配置
- `clear()`: 清除所有保存的数据

#### FileHandler.js
**功能**: 处理图片文件的上传和预览
**方法**:
- `readImageFile(file)`: 读取图片文件
- `createImagePreview(url)`: 创建图片预览
- `saveImageToStorage(key, dataUrl)`: 保存图片到localStorage
- `loadImageFromStorage(key)`: 从localStorage加载图片

### 4. 编辑模块 (editor/)

#### EditorPanel.js
**功能**: 编辑界面的主控制器
**依赖**: PropertyEditor.js, UIManager.js
**属性**:
- `currentElementId`: 当前正在编辑的元素ID
- `isVisible`: 编辑面板是否可见
**方法**:
- `show(elementId)`: 显示编辑面板
- `hide()`: 隐藏编辑面板
- `createControls(elementConfig)`: 创建编辑控件
- `updatePreview()`: 更新预览
- `saveChanges()`: 保存更改

#### PropertyEditor.js
**功能**: 属性编辑的具体实现
**方法**:
- `createPositionControls(x, y)`: 创建位置编辑控件
- `createSizeControls(width, height)`: 创建尺寸编辑控件
- `createShadowControls(offsetX, offsetY, color)`: 创建阴影编辑控件
- `createImageControls(currentImage)`: 创建图片编辑控件
- `createActionButtons()`: 创建操作按钮

### 5. 样式模块 (css/)

#### main.css
**功能**: 基础样式和全局样式
**包含**:
- 重置样式（reset）
- 字体定义
- 基础布局
- 全局变量（CSS自定义属性）

#### ui-elements.css
**功能**: UI元素通用样式
**包含**:
- UI容器样式
- 阴影通用样式
- 动画效果
- 交互状态（hover, active等）

#### editor.css
**功能**: 编辑面板专用样式
**包含**:
- 编辑面板布局
- 控件样式（输入框、按钮、颜色选择器等）
- 标签和表单样式
- 编辑模式下的特殊样式

#### status-bar.css
**功能**: 状态栏专用样式
**包含**:
- 状态栏容器样式
- 状态栏阴影样式
- 状态栏图像样式
- 状态栏特定交互效果

## 配置系统

### ui-config.json
**位置**: `config/ui-config.json`
**功能**: 存储UI元素的默认配置
**结构**:
```json
{
  "statusBar": {
    "name": "状态栏",
    "type": "status-bar",
    "basePosition": { "x": 280, "y": 20 },
    "baseSize": { "width": 2000, "height": 200 },
    "shadow": {
      "offsetX": 4,
      "offsetY": 4,
      "color": "rgba(0, 0, 0, 0.5)",
      "opacity": 0.7
    },
    "zIndex": 100,
    "image": "assets/statusbar/default.png"
  }
}
```

### user-config.json
**位置**: `config/user-config.json`（自动生成）
**功能**: 存储用户自定义配置
**生成**: 当用户保存配置时自动生成

## 数据流向

### 1. 初始化流程
```
index.html加载 → main.js初始化 → 加载ui-config.json → 创建UIManager → 注册UI元素 → 渲染到页面
```

### 2. 编辑流程
```
用户点击编辑按钮 → EditorPanel.show() → 加载当前元素配置 → PropertyEditor创建控件 → 
用户修改属性 → 实时更新预览 → 用户点击保存 → Storage.saveConfig() → 更新UIManager
```

### 3. 缩放流程
```
窗口大小变化 → Scaler.getScale() → UIManager.handleResize() → 遍历所有元素 → 
调用element.applyScale() → 更新DOM样式
```

## 扩展指南

### 添加新的UI元素类型
1. 在`ui/`目录下创建新的组件类（如`ButtonGroupUI.js`）
2. 继承`UIElementBase.js`
3. 实现`render()`方法和特定功能
4. 在`ui-config.json`中添加默认配置
5. 在`UIManager.js`中注册新类型
6. 如果需要，在`editor/PropertyEditor.js`中添加相应的编辑控件

### 添加新的编辑功能
1. 在`editor/`目录下创建新的编辑器类
2. 在`EditorPanel.js`中集成新的编辑器
3. 更新`editor.css`添加相应样式
4. 如果需要，在`main.js`中添加相应的快捷键绑定

### 修改基准分辨率
1. 修改`utils/Scaler.js`中的`BASE_WIDTH`和`BASE_HEIGHT`
2. 更新`ui-config.json`中所有元素的`basePosition`和`baseSize`
3. 更新`css/main.css`中的相关样式

## 开发规范

### 命名约定
- 文件命名：使用小写字母和连字符（如`status-bar-ui.js`）
- 类命名：使用PascalCase（如`StatusBarUI`）
- 变量命名：使用camelCase（如`currentElement`）
- 常量命名：使用UPPER_SNAKE_CASE（如`BASE_WIDTH`）

### 代码结构
- 每个模块一个文件
- 模块使用ES6类语法
- 使用`export`/`import`进行模块导入导出
- 添加详细的JSDoc注释

### 样式规范
- 使用CSS自定义属性定义颜色和尺寸
- 使用BEM命名法或类似方案
- 响应式设计使用媒体查询

## 故障排除

### 常见问题及解决方案

#### 1. 缩放不正确
- 检查`Scaler.js`中的`BASE_WIDTH`和`BASE_HEIGHT`设置
- 检查窗口大小变化事件的监听
- 确认所有UI元素都调用了`applyScale()`方法

#### 2. 阴影不显示
- 检查阴影层的`z-index`是否低于主层
- 确认阴影颜色和透明度设置正确
- 检查CSS中阴影层的定位是否正确

#### 3. 配置不保存
- 检查`Storage.js`中localStorage的操作
- 确认配置保存时调用了正确的方法
- 检查浏览器是否禁用了localStorage

#### 4. 编辑面板不显示
- 检查编辑面板的CSS显示/隐藏逻辑
- 确认`EditorPanel.js`中的`show()`/`hide()`方法正确调用
- 检查编辑按钮的事件绑定

## 版本历史

### v1.0.0 (计划中)
- 基础架构实现
- 状态栏组件
- 基本编辑功能
- 自适应缩放
- 硬阴影效果

### 未来版本规划
- 更多UI元素类型
- 批量编辑功能
- 配置导入/导出
- 主题切换
- 快捷键自定义