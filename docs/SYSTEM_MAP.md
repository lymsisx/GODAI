# UI预览工具 - 系统联动地图

## 概述

本文档记录 UI 预览工具（纯前端 JavaScript 项目）的所有文件、模块及其依赖关系。每次修改代码前必须查阅此文档，确认影响范围。

## 项目根目录结构

```
GODAI/                                  # 项目根目录
├── 📄 index.html                       # 主入口文件（必须首先加载）
├── 📄 test-modules.html                # 模块测试页面
├── 📄 test.html                        # 功能测试页面
├── 📄 simple.html                      # 简化版本页面
├── 📄 test_fix.html                    # 修复测试页面
├── 📄 README.md                        # 项目说明文档
├── 📄 MODULE_FIX_README.md             # 模块修复说明
├── 📄 fix-exports.js                   # 模块导出修复工具
├── 📄 rollback-exports.js              # 回滚工具
├── 📄 reference.png                    # 参考图片
│
├── 📁 docs/                            # 文档目录
│   ├── 📄 施工思路.md                  # 开发思路文档
│   ├── 📄 system-map.md                # 系统架构图（旧版）
│   ├── 📄 系统架构说明.md              # 系统架构说明
│   ├── 📄 IRON_LAWS.md                 # ✅ 安全施工铁律（新）
│   ├── 📄 DEV_ISSUES.md                # ✅ 开发踩坑记录（新）
│   └── 📄 COMMIT_LOG.md                # ✅ 改动历史日志（新）
│
├── 📁 css/                             # 样式文件目录（加载顺序重要）
│   ├── 📄 main.css                     # 基础样式（必须首先加载）
│   ├── 📄 ui-elements.css              # UI元素通用样式（第二加载）
│   ├── 📄 editor.css                   # 编辑面板样式（第三加载）
│   └── 📄 status-bar.css               # 状态栏专用样式（最后加载）
│
├── 📁 js/                              # JavaScript模块目录（加载顺序关键）
│   ├── 📄 main.js                      # 应用主入口（必须在所有模块后加载）
│   ├── 📄 modern-loader.js             # 模块加载器（特殊：处理模块加载竞态）
│   │
│   ├── 📁 core/                        # 核心管理模块（基础依赖）
│   │   ├── 📄 App.js                   # 主应用类（依赖所有工具模块）
│   │   └── 📄 UIManager.js             # UI管理器（依赖 UI 模块）
│   │
│   ├── 📁 ui/                          # UI组件模块（业务层）
│   │   ├── 📄 UIElementBase.js         # UI元素基类（所有 UI 组件的父类）
│   │   └── 📄 StatusBarUI.js           # 状态栏组件（继承 UIElementBase）
│   │
│   ├── 📁 editor/                      # 编辑功能模块（用户交互层）
│   │   └── 📄 StatusBarEditor.js       # 状态栏编辑器（依赖 UIManager）
│   │
│   └── 📁 utils/                       # 工具模块（底层依赖，必须先加载）
│       ├── 📄 Scaler.js                # 缩放计算工具（无依赖，必须最先加载）
│       └── 📄 Storage.js               # 本地存储工具（无依赖，第二加载）
│
├── 📁 config/                          # 配置文件目录
│   └── 📄 default-config.json          # 默认配置（由 Storage.js 加载）
│
└── 📁 assets/                          # 资源文件目录
    ├── 📁 background/                  # 壁纸图片
    ├── 📁 desktop/                     # 桌面层图片
    ├── 📁 statusbar/                   # 状态栏图片
    └── 📁 statusbar_shadow/            # 状态栏阴影素材
```

## 关键文件加载顺序

### HTML 加载顺序（index.html）
```html
<!DOCTYPE html>
<html>
<head>
    <!-- 1. CSS 文件（顺序敏感） -->
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/ui-elements.css">
    <link rel="stylesheet" href="css/editor.css">
    <link rel="stylesheet" href="css/status-bar.css">
</head>
<body>
    <!-- 页面结构 -->
    
    <!-- 2. JavaScript 模块（顺序关键） -->
    <!-- 工具模块（无依赖） -->
    <script src="js/utils/Scaler.js"></script>
    <script src="js/utils/Storage.js"></script>
    
    <!-- 模块加载器（特殊） -->
    <script src="js/modern-loader.js"></script>
    
    <!-- UI 组件模块 -->
    <script src="js/ui/UIElementBase.js"></script>
    <script src="js/ui/StatusBarUI.js"></script>
    
    <!-- 核心管理模块 -->
    <script src="js/core/UIManager.js"></script>
    <script src="js/core/App.js"></script>
    
    <!-- 编辑功能模块 -->
    <script src="js/editor/StatusBarEditor.js"></script>
    
    <!-- 3. 应用入口（必须在所有模块后） -->
    <script src="js/main.js"></script>
</body>
</html>
```

### 模块依赖关系图

```
┌─────────────────────────────────────────────────────────────┐
│                    index.html (主入口)                       │
└────────────────┬────────────────────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    ▼            ▼            ▼
┌─────────┐  ┌─────────┐  ┌─────────┐
│ main.css│  │ui-ele...│  │editor.css│
└─────────┘  └─────────┘  └─────────┘
                 │
    ┌────────────┼─────────────────────────────────────┐
    ▼            ▼                                     ▼
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│Scaler.js│  │Storage.js│  │UIElem...│  │Status...│  │modern...│
└─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘
    │            │            │            │            │
    └────────────┼────────────┴────────────┘            │
                 ▼                                     │
          ┌─────────┐                                  │
          │UIMana...│◄─────────────────────────────────┘
          └─────────┘
                 │
    ┌────────────┼────────────┐
    ▼            ▼            ▼
┌─────────┐  ┌─────────┐  ┌─────────┐
│  App.js │  │Status...│  │main.js  │
└─────────┘  └─────────┘  └─────────┘
```

### 详细依赖矩阵

| 模块文件 | 依赖模块 | 被谁依赖 | 加载顺序 | 关键方法 |
|---------|---------|---------|---------|---------|
| **Scaler.js** | 无 | UIManager.js, UIElementBase.js, StatusBarUI.js | 1 | `getScale()`, `toActual()`, `toBase()` |
| **Storage.js** | 无 | App.js, UIManager.js, StatusBarEditor.js | 2 | `save()`, `load()`, `saveConfig()`, `loadConfig()` |
| **modern-loader.js** | 无 | main.js（间接） | 3 | `ensureModuleLoaded()` |
| **UIElementBase.js** | Scaler.js | StatusBarUI.js（继承） | 4 | `render()`, `update()`, `applyScale()` |
| **StatusBarUI.js** | UIElementBase.js | UIManager.js | 5 | `createShadowElement()`, `updateShadow()` |
| **UIManager.js** | Scaler.js, Storage.js, UIElementBase.js | App.js, StatusBarEditor.js | 6 | `registerElement()`, `renderAll()`, `updateElement()` |
| **App.js** | UIManager.js, Storage.js | main.js | 7 | `init()`, `start()`, `getStatus()` |
| **StatusBarEditor.js** | UIManager.js | main.js | 8 | `showEditor()`, `hideEditor()`, `updatePreview()` |
| **main.js** | 所有上述模块 | index.html（最后） | 9 | 应用启动入口 |

## 模块功能详解

### 1. 工具模块（utils/）

#### Scaler.js（缩放计算工具）
**文件路径**: `js/utils/Scaler.js`  
**依赖**: 无  
**关键属性**:
- `BASE_WIDTH = 2560` - 基准宽度
- `BASE_HEIGHT = 1440` - 基准高度

**关键方法**:
- `getScale()` - 获取当前缩放比例
- `toActual(baseValue)` - 基准值转实际像素值
- `toBase(actualValue)` - 实际像素值转基准值
- `scalePosition(baseX, baseY)` - 缩放位置坐标
- `scaleSize(baseWidth, baseHeight)` - 缩放尺寸

**安全注意事项**:
- 必须在 `window.onload` 或 `DOMContentLoaded` 后调用 `getScale()`
- 窗口大小变化时需要重新计算

#### Storage.js（本地存储工具）
**文件路径**: `js/utils/Storage.js`  
**依赖**: 无  
**关键方法**:
- `save(key, value)` - 保存数据到 localStorage
- `load(key, defaultValue)` - 从 localStorage 加载数据
- `saveConfig(config)` - 保存 UI 配置
- `loadConfig()` - 加载 UI 配置
- `clear()` - 清除所有保存的数据

**新增方法（2026-04-10）**:
- `saveElementConfig(elementId, config)` - 保存单个元素配置
- `loadElementConfig(elementId)` - 加载单个元素配置

**安全注意事项**:
- 所有方法必须包裹在 try-catch 中
- 存储空间限制 5MB，需要处理 `QuotaExceededError`
- 使用项目前缀避免键名冲突

### 2. 模块加载器（特殊）

#### modern-loader.js（模块加载竞态处理器）
**文件路径**: `js/modern-loader.js`  
**依赖**: 无  
**功能**: 处理模块加载顺序和竞态条件

**关键方法**:
- `ensureModuleLoaded(moduleName, requiredMethods)` - 确保模块加载完成
- `loadModule(modulePath)` - 动态加载模块

**安全注意事项**:
- 旧版本存在缺陷：仅检查 `window[moduleName] !== undefined`
- 新版本必须检查必需的方法是否存在
- 必须处理加载超时和失败

### 3. UI 组件模块（ui/）

#### UIElementBase.js（UI元素基类）
**文件路径**: `js/ui/UIElementBase.js`  
**依赖**: Scaler.js  
**关键属性**:
- `id` - 元素唯一标识
- `type` - 元素类型
- `config` - 配置对象
- `domElement` - 对应的 DOM 元素

**关键方法**:
- `render()` - 渲染元素（需子类实现）
- `update(config)` - 更新配置
- `applyScale()` - 应用缩放
- `applyPosition()` - 应用位置
- `applyShadow()` - 应用阴影

**安全注意事项**:
- `loadConfig()` 方法必须进行三重防御检查
- 所有 DOM 操作前必须检查元素是否存在
- 必须处理缩放计算错误

#### StatusBarUI.js（状态栏组件）
**文件路径**: `js/ui/StatusBarUI.js`  
**依赖**: UIElementBase.js（继承）  
**专有属性**:
- `shadowConfig` - 阴影配置（offsetX, offsetY, color, opacity）

**专有方法**:
- `createShadowElement()` - 创建阴影 DOM 元素
- `updateShadow(offsetX, offsetY, color)` - 更新阴影参数
- `applyImage(src)` - 应用状态栏图片

### 4. 核心管理模块（core/）

#### UIManager.js（UI管理器）
**文件路径**: `js/core/UIManager.js`  
**依赖**: Scaler.js, Storage.js, UIElementBase.js  
**关键属性**:
- `elements` - 所有已注册的 UI 元素映射
- `scale` - 当前缩放比例

**关键方法**:
- `registerElement(elementConfig)` - 注册 UI 元素
- `renderAll()` - 渲染所有 UI 元素
- `updateElement(elementId, newConfig)` - 更新指定元素
- `getElement(elementId)` - 获取指定元素实例
- `handleResize()` - 处理窗口大小变化

#### App.js（主应用类）
**文件路径**: `js/core/App.js`  
**依赖**: UIManager.js, Storage.js  
**关键属性**:
- `uiManager` - UI 管理器实例
- `editor` - 编辑器实例
- `isEditing` - 是否处于编辑模式

**关键方法**:
- `init()` - 初始化应用
- `start()` - 启动应用
- `toggleEditMode()` - 切换编辑模式
- `getStatus()` - 获取应用状态（调试用）

### 5. 编辑功能模块（editor/）

#### StatusBarEditor.js（状态栏编辑器）
**文件路径**: `js/editor/StatusBarEditor.js`  
**依赖**: UIManager.js  
**关键属性**:
- `currentElementId` - 当前正在编辑的元素 ID
- `isVisible` - 编辑面板是否可见

**关键方法**:
- `show(elementId)` - 显示编辑面板
- `hide()` - 隐藏编辑面板
- `createControls(elementConfig)` - 创建编辑控件
- `updatePreview()` - 更新预览
- `saveChanges()` - 保存更改

### 6. 应用入口

#### main.js（应用主入口）
**文件路径**: `js/main.js`  
**依赖**: 所有上述模块  
**功能**: 模块加载和应用启动

**关键流程**:
1. 等待所有模块加载完成
2. 初始化应用实例
3. 加载默认配置
4. 创建 UI 元素
5. 设置事件监听
6. 启动应用

## 数据流分析

### 初始化数据流
```
1. index.html 加载
2. 按顺序加载 CSS 文件
3. 按顺序加载 JavaScript 模块
4. main.js 执行：
   a. 确保所有模块已加载（modern-loader.js）
   b. 创建 App 实例
   c. App.init() → 创建 UIManager
   d. UIManager 加载配置（Storage.loadConfig()）
   e. UIManager 创建 UI 元素（调用各组件 render()）
   f. 应用缩放（Scaler.getScale()）
   g. 渲染到页面
```

### 编辑操作数据流
```
1. 用户点击编辑按钮
2. StatusBarEditor.show('statusBar')
3. 加载当前配置（UIManager.getElement('statusBar').getConfig()）
4. 创建编辑控件
5. 用户修改属性（实时更新预览）
6. 用户点击保存
7. StatusBarEditor.saveChanges() 
8. 更新 UIManager（UIManager.updateElement()）
9. 保存到 Storage（Storage.saveConfig()）
10. 重新渲染（UIManager.renderAll()）
```

### 窗口缩放数据流
```
1. 窗口大小变化事件触发
2. UIManager.handleResize()
3. 重新计算缩放比例（Scaler.getScale()）
4. 遍历所有元素，调用 element.applyScale()
5. 更新 DOM 样式
```

## 关键接口定义

### Storage.js 接口
```javascript
// 保存单个元素配置
Storage.saveElementConfig(elementId, config)

// 加载单个元素配置
Storage.loadElementConfig(elementId)

// 保存整个配置
Storage.saveConfig(config)

// 加载整个配置
Storage.loadConfig()

// 清理配置
Storage.clearConfig()
```

### UIManager.js 接口
```javascript
// 注册新元素类型
UIManager.registerElementType(type, ElementClass)

// 注册元素实例
UIManager.registerElement(config)

// 获取元素实例
UIManager.getElement(elementId)

// 更新元素配置
UIManager.updateElement(elementId, newConfig)

// 批量渲染
UIManager.renderAll()

// 处理窗口缩放
UIManager.handleResize()
```

### UIElementBase.js 接口
```javascript
// 渲染元素（子类必须实现）
UIElementBase.render()

// 更新配置
UIElementBase.update(config)

// 获取当前配置
UIElementBase.getConfig()

// 应用缩放
UIElementBase.applyScale()

// 应用位置
UIElementBase.applyPosition()

// 应用阴影
UIElementBase.applyShadow()
```

## 修改影响分析模板

### 修改 Storage.js
**影响文件**:
- UIElementBase.js（调用 loadConfig/saveConfig）
- UIManager.js（调用 saveConfig/loadConfig）
- App.js（调用 Storage 方法）
- StatusBarEditor.js（调用 Storage 方法）

**验证步骤**:
1. 清除浏览器缓存
2. 刷新页面查看控制台
3. 测试配置保存功能
4. 测试配置加载功能
5. 测试错误处理

### 修改 UIElementBase.js
**影响文件**:
- StatusBarUI.js（继承）
- 所有未来新增的 UI 组件
- UIManager.js（调用元素方法）

**验证步骤**:
1. 清除浏览器缓存
2. 测试状态栏渲染
3. 测试状态栏编辑
4. 测试窗口缩放
5. 检查控制台错误

### 修改 modern-loader.js
**影响文件**:
- main.js（依赖模块加载）
- 所有通过 ensureModuleLoaded 调用的模块

**验证步骤**:
1. 测试模块加载顺序
2. 测试模块加载失败处理
3. 测试加载超时处理
4. 检查竞态条件

## 安全施工检查清单

### 修改前检查
- [ ] 查阅 DEV_ISSUES.md（避免已知坑点）
- [ ] 查阅 SYSTEM_MAP.md（确认影响范围）
- [ ] 备份相关文件
- [ ] 记录修改计划到 COMMIT_LOG.md（计划部分）

### 修改中检查
- [ ] 遵循 IRON_LAWS.md 的铁律
- [ ] 添加防御性代码（存在性检查、异常捕获）
- [ ] 保持向后兼容性
- [ ] 添加适当的日志输出

### 修改后验证
- [ ] 四级验证链：
  1. 重新读取确认文件实际修改
  2. 浏览器刷新查看控制台错误
  3. 功能测试（正常流程）
  4. 异常测试（错误处理）
- [ ] 跨浏览器测试（至少 Chrome、Firefox）
- [ ] 清除缓存测试
- [ ] 更新相关文档

## 紧急恢复方案

### 模块加载失败
**症状**: 控制台显示 "xxx is not defined"
**紧急处理**:
1. 检查 script 标签顺序
2. 检查 modern-loader.js 是否正确加载
3. 添加临时降级方案
4. 回滚到上一个稳定版本

### 配置无法保存
**症状**: localStorage 操作失败
**紧急处理**:
1. 检查 localStorage 是否可用
2. 提供临时内存存储方案
3. 提示用户清除浏览器数据
4. 提供配置导出功能

### 样式完全混乱
**症状**: UI 布局崩溃
**紧急处理**:
1. 检查 CSS 文件加载顺序
2. 检查 CSS 特异性冲突
3. 提供紧急样式重置
4. 回滚 CSS 修改

---

**维护者**：UI预览工具开发团队  
**创建日期**：2026-04-10  
**最后更新**：2026-04-10  
**版本**：v2.0（安全施工版）  
**核心教训**：必须清楚每个模块的依赖关系和加载顺序，避免竞态条件