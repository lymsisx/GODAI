# UI预览工具 (GODAI) 改动日志

## [2026-04-11 15:16] 修复保存配置刷新后重置问题

**改动文件**：
- `js/ui/UIElementBase.js`
- `js/core/App.js`
- `js/editor/StatusBarEditor.js`
- `js/ui/StatusBarUI.js`

**改动内容**：
1. **UIElementBase.js** (`_loadSavedConfig` 方法)：
   - 将扁平配置（`x, y, width, height`）正确转换为嵌套配置（`basePosition, baseSize`）
   - 新增对 `shadow`, `zIndex`, `visible`, `image`, `objectFit` 字段的独立处理

2. **App.js** (`_loadConfig` 方法)：
   - 删除写入默认配置到 localStorage 的逻辑
   - 避免首次加载时覆盖用户已保存的自定义配置

3. **StatusBarEditor.js** (`saveChanges` 方法)：
   - 统一使用 `saveElementConfig('statusBar', config)` 保存（与其他编辑器保持一致）
   - 删除使用不同存储键 `ui_statusbar_config` 的旧逻辑

4. **StatusBarEditor.js** (`resetToDefault` 方法)：
   - 统一使用 `loadConfig/saveConfig` 操作，与 `saveElementConfig` 的存储结构保持一致

5. **StatusBarUI.js** (`render` 方法)：
   - 删除多余的 `loadConfig()` 调用（父类构造函数已加载配置）

**根因分析**：
保存和加载使用了不同的 localStorage 键名，且扁平配置未正确转换为嵌套配置：
1. `StatusBarEditor` 用 `SM.save('ui_statusbar_config', ...)` 保存到 `ui_preview_ui_statusbar_config`
2. 但加载时用 `UIStorageManager.loadElementConfig('statusBar')` 读取 `ui_preview_config.statusBar`
3. 保存的是扁平结构 `{x,y,width,height}`，但加载后期望的是嵌套结构 `{basePosition:{x,y}, baseSize:{width,height}}`
4. `App._loadConfig()` 首次运行时会写入默认配置，可能覆盖用户配置

**修复后的流程**：
```
保存：编辑器点"保存" 
  → UIStorageManager.saveElementConfig('statusBar', {x,y,width,height,shadow,...})  
  → localStorage['ui_preview_config'] = { statusBar: {x,y,width,height,shadow,...} }

加载：刷新页面
  → new StatusBarUI(config) → super(config) → _loadSavedConfig()
  → 读到 {x,y,width,height,shadow,...}
  → 正确转换为 basePosition={x,y}, baseSize={width,height}, shadow={...}
  → this.config 更新 → render() 使用更新后的 config 渲染 ✅
```

---

## [2026-04-11 14:31] 彻底修复 StorageManager 命名冲突问题（第6次修复 - 最终方案）

**改动文件**：
- `js/utils/Storage.js`
- `js/modern-loader.js`
- `js/ui/UIElementBase.js`
- `js/editor/UIElementEditor.js`
- `js/editor/StatusBarEditor.js`
- `js/core/App.js`
- `js/core/UIManager.js`
- `js/main.js`

**改动内容**：
1. **Storage.js**：导出从 `window.StorageManager = Storage` 改为 `window.UIStorageManager = Storage`
2. **modern-loader.js**：
   - 模块名和导出名从 `'StorageManager'` 改为 `'UIStorageManager'`
   - 依赖图中 `'StorageManager'` 改为 `'UIStorageManager'`
   - 关键模块列表中 `'StorageManager'` 改为 `'UIStorageManager'`
   - `_isModuleAlreadyLoaded()` 增加验证性检查：对于 `UIStorageManager`，检查是否有 `PREFIX` 属性以区分浏览器内置 API
3. **UIElementBase.js**：3处 `window.StorageManager` 改为 `window.UIStorageManager`
4. **UIElementEditor.js**：2处 `window.StorageManager` 改为 `window.UIStorageManager`
5. **StatusBarEditor.js**：2处 `window.StorageManager` 改为 `window.UIStorageManager`
6. **App.js**：4处 `StorageManager` 改为 `UIStorageManager`
7. **UIManager.js**：3处 `StorageManager` 改为 `UIStorageManager`
8. **main.js**：注释中的 `StorageManager` 改为 `UIStorageManager`

**根因分析**：
现代浏览器内置了 `StorageManager` Web API（`navigator.storage` 的类型），这个内置构造函数挂在 `window.StorageManager` 上。`modern-loader.js` 的 `_isModuleAlreadyLoaded()` 方法会检查 `window['StorageManager']` 是否存在：
1. 发现 `window.StorageManager !== undefined`（浏览器内置 API 存在）
2. 误判为自定义模块已加载，**跳过 `Storage.js` 脚本加载**
3. 我们的 `Storage` 类从未被赋值到 `window.StorageManager`
4. 内置的 `StorageManager` 没有 `saveElementConfig` 等方法 → 报错

**解决方案**：
将导出名从 `StorageManager` 改为 `UIStorageManager`，与浏览器内置 API 完全区分开。同时在 `_isModuleAlreadyLoaded()` 中增加验证性检查，确保加载的是我们自己的模块。

---

## [2026-04-11 14:05] 修复 StorageManager 模块不可用问题（第5次修复）

**改动文件**：
- `js/main.js`
- `js/editor/StatusBarEditor.js`
- `js/core/App.js`

**改动内容**：
1. **main.js**：删除第39行 `window.StorageManager = StorageManager;`，防止将已正确导出的 `window.StorageManager` 覆盖为 `undefined`
2. **StatusBarEditor.js**：
   - `saveConfig()` 方法：裸变量 `StorageManager` → `window.StorageManager` + 防御性检查
   - `resetToDefault()` 方法：裸变量 `StorageManager` → `window.StorageManager` + 防御性检查
3. **App.js**：
   - `getStatus()` 方法：裸变量 `StorageManager` → `window.StorageManager` + 防御性检查
   - `reset()` 方法：裸变量 `StorageManager` → `window.StorageManager` + 防御性检查

**根因分析**：
`Storage.js` 文件第199行通过 `window.StorageManager = Storage` 正确导出了模块。但 `main.js` 第39行 `window.StorageManager = StorageManager` 中的 `StorageManager`（右侧）是一个**未定义的局部变量名**，在非 strict 模式下可能读到 `window.StorageManager` 自身，但在某些时序下会将其覆盖为 `undefined`。

另外，多个文件中使用**裸变量名** `StorageManager`（不带 `window.`），在类方法作用域中如果模块加载顺序有竞态，`typeof StorageManager` 会得到 `undefined` 或 `ReferenceError`。

**核心原则**：
所有对 `StorageManager` 的引用**必须通过 `window.StorageManager`**，不能用裸变量名。

---

## [2026-04-11 13:37] 修复 Storage 命名冲突问题（无法保存配置）

**改动文件**：
- `js/utils/Storage.js`
- `js/modern-loader.js`
- `js/main.js`
- `js/core/UIManager.js`
- `js/core/App.js`
- `js/editor/StatusBarEditor.js`
- `js/editor/UIElementEditor.js`
- `js/ui/UIElementBase.js`
- `fix-exports.js`

**改动内容**：
1. **Storage.js**：类名从 `Storage` 改为 `StorageManager`，导出从 `window.Storage = Storage` 改为 `window.StorageManager = StorageManager`
2. **modern-loader.js**：依赖图中的 `'Storage'` 改为 `'StorageManager'`，模块配置中的 name/exportName 同步修改
3. **main.js**：全局导出从 `window.Storage = Storage` 改为 `window.StorageManager = StorageManager`
4. **UIManager.js**：所有 `Storage.xxx` 改为 `StorageManager.xxx`（3处）
5. **App.js**：所有 `Storage.xxx` 改为 `StorageManager.xxx`（4处）
6. **StatusBarEditor.js**：所有 `Storage.xxx` 改为 `StorageManager.xxx`（2处）
7. **UIElementEditor.js**：所有 `window.Storage` 改为 `window.StorageManager`（2处）
8. **UIElementBase.js**：所有 `window.Storage` 改为 `window.StorageManager`（3处）
9. **fix-exports.js**：JS_FILES 配置中的 className 和 exportsToAdd 同步修改

**根因分析**：
浏览器原生就有 `window.Storage`（Web Storage API 的接口），自定义的 `Storage` 类赋给 `window.Storage` 后被原生对象覆盖或冲突，导致 `saveElementConfig` 等方法不可用。

**解决方案**：
将自定义存储类改名为 `StorageManager`，避免与浏览器原生 API 命名冲突。

**使用建议**：
Chrome 在 `file://` 协议下访问 `localStorage` 会被阻止（安全策略）。建议使用本地服务器运行：
```bash
# 在 GODAI 目录下运行
python -m http.server 8080
# 然后访问 http://localhost:8080
```

---

## [2026-04-11 02:15] 添加图片更换和拉伸功能，编辑面板靠左显示

**改动文件**：
- `js/ui/UIElementBase.js`
- `js/editor/UIElementEditor.js`
- `js/editor/EditorManager.js`

**改动内容**：
1. **UIElementBase.js** (3处改动):
   - 第30行：`defaultConfig` 添加 `objectFit: 'cover'` 属性
   - 第64行：`render()` 图片创建时 objectFit 读取配置 `this.config.objectFit || 'cover'`
   - 第462-464行：`getConfig()` 返回对象添加 `image`、`defaultImage`、`objectFit` 字段

2. **UIElementEditor.js** (4处改动):
   - `_getDefaultConfig()` 添加 `image`、`defaultImage`、`objectFit` 字段
   - `_createControlGroup()` 在层级控制后添加图片控制和拉伸模式选择（仅在元素有图片时显示）
   - 新增 `_createImageControl()` 方法：提供"更换图片"和"清除图片"按钮
   - 新增 `_createObjectFitControl()` 方法：提供5种拉伸模式选择（cover/contain/fill/none/scale-down）
   - 新增 `_changeImage()` 方法：通过文件选择器更换图片

3. **EditorManager.js** (1处改动):
   - 第72-87行：编辑面板样式从居中改为靠左显示
     - `top: 50%; left: 50%; transform: translate(-50%, -50%);` → `top: 60px; left: 20px;`
     - `width: 400px; max-height: 80vh;` → `width: 380px; max-height: calc(100vh - 80px);`

**功能说明**：
- 图片更换：点击"更换图片"按钮选择本地图片文件，支持实时预览
- 图片清除：点击"清除图片"按钮移除当前图片
- 拉伸模式：5种 CSS object-fit 模式可选（覆盖/包含/填充/无/缩放缩小）
- 面板位置：从屏幕中央移到左上角，避免遮挡预览画面

**验证方式**：
1. 打开 UI 预览工具，选择一个带图片的元素
2. 右键点击元素打开编辑面板，确认面板显示在左侧
3. 检查编辑面板中是否有"图片设置"和"图片拉伸模式"控制组
4. 测试更换图片、清除图片、切换拉伸模式功能是否正常
5. 确认修改能实时预览并保存配置

---

## [2026-04-11 01:16] 修复 main.js Promise reject 参数未定义错误

**改动文件**：
- `js/main.js`

**改动内容**：
修复了应用初始化超时处理中的 Promise 参数缺失问题。第19行 `new Promise(resolve => {` 改为 `new Promise((resolve, reject) => {`，使得第30行的 `reject()` 调用不再抛出 `ReferenceError`。

**根因分析**：
`main.js` 第30行调用了未定义的 `reject` 变量，因为 Promise 构造函数只接收了 `resolve` 参数，没有接收 `reject` 参数。这导致应用启动时出现 "Uncaught ReferenceError: reject is not defined" 错误。

**验证方式**：
打开浏览器开发者工具，查看控制台不再报错，应用能正常初始化。

**注意事项**：
- 修复后应用初始化超时（5秒）会正常触发错误提示
- 不影响其他模块加载流程