# UI预览工具 (GODAI) 改动日志

## [2026-04-13 18:51] ` 键改为隐藏UI辅助元素，移除自动截图功能

**改动文件**（2个文件）：
- `index.html` — 截图按钮改为"隐藏UI"按钮（onclick=hideUI）；新增 `hideUI()` 全局函数；删除 `takeScreenshot()` 函数及 html2canvas CDN 引用；清理 CSS 注释
- `js/editor/EditorManager.js` — ` 键从"切换编辑模式"改为"隐藏/显示辅助 UI"；新增 `_toggleUIVisibility()` 方法（隐藏编辑面板、编辑按钮、隐藏UI按钮、缩放信息、选中高亮绿框）；编辑按钮文字从 `编辑模式 (`)` 改为 `编辑模式` / `退出编辑`

**行为变更**：
- 按 ` 或点击"隐藏UI"按钮 → 隐藏所有辅助元素（编辑面板+按钮+缩放信息+选中高亮），只留纯净画面供手动截图
- 再按 ` → 恢复所有辅助元素
- html2canvas 自动截图功能已移除（file:// 协议下 canvas tainted 无法解决）

---

## [2026-04-13 17:44] 修复截图 tainted canvas + 壁纸/桌面层刷新丢失

**改动文件**（4个文件）：
- `index.html` — 截图改用 `allowTaint:true` + 三级降级导出（toBlob→toDataURL→提示用 HTTP 服务器）；壁纸/桌面层上传图片后存入 IndexedDB（key: `_layer_wallpaper` / `_layer_desktopLayer`）；新增 `_applyLayerImage()` 和 `_restoreLayerImages()` 函数
- `js/main.js` — 应用启动成功后调用 `_restoreLayerImages()` 从 IndexedDB 恢复壁纸/桌面层图片
- `js/core/App.js` — `exportConfig()` 增加壁纸/桌面层图片导出（写入 ZIP 的 `images/wallpaper.png` 和 `images/desktopLayer.png`，config.json 中记录在 `layers` 字段）
- `js/editor/EditorManager.js` — `_importFromZip()` 增加壁纸/桌面层图片恢复逻辑

**BUG 修复**：
1. **截图 Tainted canvas**：`file://` 协议下 data: URL 图片会污染 canvas，`toBlob()` 抛安全异常。改为 `allowTaint:true` 渲染后三级降级导出
2. **壁纸/桌面层刷新丢失**：这两层的图片只设了内联 `style.background`，没有任何持久化。现在上传时同步存 IndexedDB，页面加载时自动恢复

---

## [2026-04-13 16:50] 导出/导入配置升级：ZIP 打包含图片

**改动文件**（3个文件）：
- `index.html` — 引入 JSZip CDN（v3.10.1）
- `js/core/App.js` — `exportConfig()` 改为 async，从 IndexedDB 读取图片 base64 → 打包到 ZIP 的 `images/` 目录，config.json 中记录 `imagePath` 相对路径
- `js/editor/EditorManager.js` — `importConfig()` 支持 `.zip` 和 `.json` 两种格式；新增 `_importFromZip()` 解包 ZIP 恢复图片到 IndexedDB 并更新 UI；新增 `_blobToDataUrl()` 辅助方法；`_applyImportedConfig()` 兼容新版数组格式和旧版对象格式

**功能说明**：
- **导出**：点击"导出配置"按钮，自动读取所有 UI 元素在 IndexedDB 中的图片，与配置 JSON 一起打包为 `.zip` 下载，图片按 `images/{elementId}.{ext}` 命名
- **导入**：支持导入 `.zip`（新版含图片）和 `.json`（旧版纯配置）两种格式，ZIP 导入时自动将图片恢复到 IndexedDB 并刷新 UI 显示
- **向后兼容**：旧版 JSON 配置仍可正常导入

---

## [2026-04-13 16:37] 新增截图功能（2560×1440）

**改动文件**（1个文件 + 1个新文件夹）：
- `index.html` — 新增截图按钮 `#screenshotBtn`、引入 html2canvas CDN、新增 `takeScreenshot()` 函数
- `screenshots/.gitkeep` — 新建截图存放文件夹

**功能说明**：
- 点击"截图"按钮后自动隐藏编辑按钮、截图按钮、缩放信息、编辑面板、选中高亮
- 使用 html2canvas 以 2560×1440 分辨率渲染页面并导出 PNG
- 文件名格式: `screenshot_YYYY-MM-DDTHH-MM-SS.png`，触发浏览器下载

---

## [2026-04-13 16:02] 阴影新增模糊度控件，默认硬边(0px)

**改动文件**（2个文件）：
- `js/ui/UIElementBase.js` — shadow 默认配置新增 `blur: 0`；`applyShadow()` 使用 config.blur 计算模糊半径
- `js/editor/UIElementEditor.js` — 默认配置新增 `blur: 0`；`_createShadowControls()` 新增模糊度滑条（0~20px）；`resetToDefault()`/`refresh()` 同步 blur 控件

---

## [2026-04-13 15:55] 阴影系统改造：矩形阴影 → 轮廓阴影（drop-shadow）

**改动文件**（1个文件）：
- `js/ui/UIElementBase.js` — 整体改造阴影渲染方案

**改动内容**：
- `applyShadow()`: 从创建独立 `<div>` 矩形阴影改为 CSS `filter: drop-shadow()`，沿图片实际可见像素轮廓生成阴影
- 新增 `_colorWithOpacity()` 辅助方法：将 HEX/RGB 颜色与 opacity 合并为 rgba 字符串
- `removeShadow()`: 改为清除 `filter` 属性
- `show()`/`hide()`: 移除对 shadowElement 的处理（drop-shadow 随本体自动显隐）
- `render()`: 移除"需要先添加到 body"的注释
- `update()`/`importConfig()`: 移除对 shadowElement zIndex 的更新
- 拖拽 `_onMouseMove`: 移除同步 shadowElement 位置的代码
- 所有 shadowElement 清理代码保留为兼容旧版的迁移逻辑

**效果**：透明区域的不规则 PNG 图片现在只沿实际像素轮廓生成阴影，而非整个矩形画布。

---

## [2026-04-13 15:13] 桌面层 z-index 调整为 999

**改动文件**（1个文件）：
- `index.html` — `#desktopLayer` CSS 规则新增 `z-index: 999`

---

## [2026-04-13 15:10] 修复壁纸层和桌面层在编辑菜单中丢失

**改动文件**（1个文件）：
- `js/editor/EditorManager.js` — `updateElementList()` 头部新增壁纸层(`#wallpaper`)和桌面层(`#desktopLayer`)的特殊按钮；新增 `_selectSpecialLayer()` 方法渲染专用编辑面板（换图、透明度、显示/隐藏）

**根因**：
壁纸层和桌面层是纯 HTML div（`index.html` 中静态定义），不通过 `UIManager.registerElement()` 注册，因此 `updateElementList()` 遍历 `uiManager.elements` 时不会包含它们。编辑面板从静态 HTML 改为动态生成后，这两个特殊层的编辑入口丢失。

---

## [2026-04-13 14:31] 修复通用组件阴影层不显示（第二层根因）

**改动文件**（1个文件）：
- `js/ui/UIElementBase.js` — `render()` 中调整执行顺序：先 `document.body.appendChild(container)`，再 `applyShadow()`

**根因**：
`render()` 中 `applyShadow()` 在 `appendChild(container)` 之前调用 → `this.domElement.parentNode` 是 null → `insertBefore(shadowElement, domElement)` 不执行 → shadowElement 被创建但未挂载到 DOM。StatusBarUI 不受影响是因为其 render() 是先 appendChild 再 applyShadow。

---

## [2026-04-13 14:16] 修复通用组件阴影层不显示

**改动文件**（1个文件）：
- `js/ui/UIElementBase.js` — `defaultConfig` 新增默认 `shadow` 字段（offsetX/offsetY/color/opacity）；`_loadSavedConfig()` 加强防御，空对象旧存档不覆盖默认值

**根因**：
`UIElementBase.defaultConfig` 缺少 `shadow` 字段 → 通用组件初始化时 `this.config.shadow` 为 `undefined` → `render()` 的 `if (this.config.shadow)` 判断为 false → `applyShadow()` 从未被调用 → `shadowElement` 永远是 null。`StatusBarUI` 有阴影是因为其 `defaultStatusBarConfig` 里显式写了 shadow，其他组件没有。

---

## [2026-04-13 14:10] 修复状态栏形状与阴影对不上 + 编辑器输入改为基准坐标

**改动文件**（2个文件）：
- `js/ui/StatusBarUI.js` — 删除 `shadow.image` 字段（恢复纯色矩形阴影方案）；`mainLayer` 补全 `width:100%; height:100%; position:relative`；`render()` 和 `updateImage()` 中 `objectFit` 改为读取 `this.config.objectFit || 'fill'`（不再硬编码 cover）
- `js/editor/UIElementEditor.js` — 位置/尺寸输入框改为**直接显示/输入基准坐标**（去掉 `toActual`/`toBase` 换算）；标签从"像素"改为"基准坐标 2560×1440"；`refresh()` 同步去掉 toActual

**根因**：
1. `shadow.image: 'assets/statusbar_shadow/default.png'` 文件不存在，导致阴影走图片渲染路径，backgroundImage 失败后形状乱掉，与主体不对齐
2. `mainLayer` 无 `height:100%`，导致容器尺寸和内部渲染区域不一致
3. `objectFit` 硬编码 `cover`，用户选择 fill 但无效
4. 编辑器输入框经过 toActual 换算，用户以为输入基准值但实际已缩放，导致输入100×100看到的不是100×100的视觉效果

---

## [2026-04-11 18:55] 修复有图片组件拖拽失效 + loadSavedConfig 报错

**改动文件**（3个文件）：
- `js/ui/UIElementBase.js` — `enableDrag()` 新增 `dragstart` + `selectstart` 事件拦截；`disableDrag()` 同步清理
- `js/core/UIManager.js` — `loadSavedConfig()` 对 config 补全 `id`/`type`（历史脏数据防御），跳过非对象数据
- `index.html` + `js/modern-loader.js` — 版本号升级到 `v=20260411b`

**根因1（拖拽失效）**：`<img>` 的 `draggable=false` + `pointerEvents=none` 不够——浏览器 `dragstart` 事件在 `mousedown` 之后、`mousemove` 之前触发，抢占了自定义拖拽。需要在 container 上显式监听 `dragstart` 并 `preventDefault()`。

**根因2（"元素配置必须包含id和type"报错）**：`UIManager.loadSavedConfig()` 从 localStorage 读取旧配置时，某些历史数据不含 `id`/`type` 字段，导致 `registerElement` 拒绝注册。修复：自动补全。

**报错记录**：无

**改动文件**（3个文件）：
- `js/ui/UIElementBase.js` — 3处创建 `<img>` 的位置（`render()`、`_applyRestoredImage()`、`updateImage()`）都加上 `draggable=false` 和 `style.pointerEvents='none'`
- `js/modern-loader.js` — 动态加载脚本时加版本号 `?v=20260411` 防止浏览器缓存旧文件
- `index.html` — 入口 `<script>` 标签加版本号

**根因**：浏览器默认允许拖拽 `<img>` 元素（会出现半透明幽灵图片），原生 drag 行为抢占了 `mousedown` 事件，导致绑定在 container 上的自定义拖拽（`enableDrag()`）失效。没有图片的组件（粉色占位方块）不受影响。

**报错记录**：无

## [2026-04-11 18:45] 修复 UIElementEditor.saveChanges + saveElementConfig 残留 image 污染

**改动文件**（3个文件，4处改动）：
- `js/editor/UIElementEditor.js` — `saveChanges()` 在调 `saveElementConfig` 前剥离 image 字段，图片走 `saveImageAsync()` 存 IndexedDB
- `js/ui/UIElementBase.js` — `getConfig()` 不再返回 image 字段（从根源截断 base64 外泄到 localStorage 的所有通道）
- `js/utils/Storage.js` — 2处：①`saveElementConfig()` 写回前清洗所有元素的 image 字段；②`loadConfig()` 加载时自动清洗历史遗留的 image 脏数据并回写释放空间

**根因**：上一次只修了 `UIElementBase.saveConfig()` 路径。`UIElementEditor.saveChanges()` 有独立的存储路径直接调 `saveElementConfig(id, config含image)`。同时 `saveElementConfig()` 的 `loadConfig()` 会读出旧的 allConfig，如果历史数据含有 image 字段残留，全量写回时照样爆 quota。这导致配置无法持久化，拖拽位置无法保存，刷新后恢复旧位置→看起来"自由移动坏了"。

**报错记录**：无

## [2026-04-11 18:35] 彻底修复 QuotaExceededError：localStorage 存图改 IndexedDB

**改动文件**（3个文件）：
- `js/utils/Storage.js` — 新增 `saveImageAsync` / `loadImageAsync` / `removeImageAsync` 三个 IndexedDB 方法；`clearAll()` 同步清 IndexedDB；`_dbPromise` 单例缓存
- `js/ui/UIElementBase.js` — 3处：①`render()` 末尾删除 `saveConfig()` 调用；②`saveConfig()` 图片改走 `saveImageAsync()`（异步，无大小限制）；③`_loadSavedConfig()` 完全重写为异步加载，优先级 IndexedDB > localStorage旧key > config.image旧字段，新增 `_applyRestoredImage()` 辅助方法
- `js/editor/EditorManager.js` — 2处：①`_registerCustomElement()` 传给 UIElementBase 的 config 不带 image，注册后异步 `updateImage()`；持久化 cfg 时 base64 剥离改存 hasImage 标记；②`_showAddElementDialog` 确认回调注释说明

**根因链（已斩断）**：
`_registerCustomElement(cfg含base64)` → `registerElement` → `new UIElementBase(config含image)` → `render()` → `saveConfig()` → `saveImage()` → `localStorage.setItem(11MB)` → **QuotaExceededError**

**新方案流程**：
1. 注册时 config 不带 image，`render()` 不调 `saveConfig()`
2. 注册完成后 `updateImage(imageData)` → `saveConfig()` → `saveImageAsync(id, dataUrl)` → IndexedDB（无限制）
3. 页面恢复时 `_loadSavedConfig()` 异步查 IndexedDB，加载完成后 `_applyRestoredImage()` 就地更新 img.src

**报错记录**：无，lint 仅有 7 条 TS HINT（window.UIStorageManager 动态挂载，既有问题）

## [2026-04-11 18:25] BUG修复：保存图片报错 + 自由移动功能失效

**改动文件**（2个文件、5处改动）：
- `js/ui/UIElementBase.js` — 4处改动
- `js/editor/EditorManager.js` — 1处改动

**BUG 1 根因（保存图片失败 Storage.js:22）**：`saveConfig()` 把整个 config 对象（含 base64 图片，约 11MB）JSON.stringify 写入 localStorage，触发 `QuotaExceededError`（5MB 限制）。
修复：`saveConfig()` 序列化前临时剥离 `config.image`，改用 `UIStorageManager.saveImage(id, dataUrl)` 将图片存入独立 key `ui_preview_image_{id}`；清除图片时也同步删除该 key。

**BUG 2 根因（自由移动坏掉）**：`updateImage()` 的 else 分支（尚无 img 节点时）调用 `this.render()`，而 `render()` 每次都创建全新 DOM container 并覆盖 `this.domElement`，导致 `enableDrag()` 绑定在旧 DOM 上的 mousedown 事件丢失。
修复：else 分支改为就地创建 img 节点并 `appendChild` 到现有 container，不再调用 `render()`；仅当 domElement 不存在时才走完整渲染流程。

**关联修复（自定义组件重启后图片消失）**：`_syncCustomElementImage()` 以前把 base64 存入自定义组件列表（`ui_preview_custom_elements`），现在改为只存 `hasImage: true` 标记。对应地，`_registerCustomElement()` 恢复时如果 `cfg.hasImage` 为 true，从 `Storage.loadImage(id)` 读取实际图片数据。

**向后兼容**：`_loadSavedConfig()` 先查独立 image key，再回退到旧 `config.image` 字段，旧数据无感迁移。

**报错记录**：无 lint 错误（3条 TS HINT 是 `window.UIStorageManager` 动态挂载，不影响运行）。

---

## [2026-04-11 17:41] BUG修复：自定义组件名称持久化失效 + 上传图片无法保存

**改动文件**（3个文件、4处改动）：
- `js/editor/UIElementEditor.js` — `_changeImage()` 延迟移除 file input
- `js/ui/UIElementBase.js` — `_loadSavedConfig()` 补充恢复 name/backgroundColor；`updateImage()` 新增 `_syncCustomElementImage()`
- `js/editor/EditorManager.js` — `renameCustomElement()` 加 `saveConfig()` 持久化

**BUG 1 根因**：改名时只更新了 localStorage 列表中的 displayName，未调用 saveConfig 持久化新 name 到 UIStorageManager，且 _loadSavedConfig 未恢复 name 字段 → 重载后名称回退。
修复：(A) renameCustomElement 末尾加 uiEl.saveConfig()；(B) _loadSavedConfig 补充恢复 name + backgroundColor。

**BUG 2 根因**：_changeImage 中 input.click() 后立即 removeChild 导致部分浏览器 change 事件丢失（DOM 节点被销毁后监听器失效）；且 updateImage 只存了 UIStorageManager 未同步自定义组件列表的 image 字段。
修复：(A) removeChild 延迟到 change 回调内执行 + 60s 超时兜底；(B) 新增 _syncCustomElementImage 同步写入自定义组件列表。

**报错记录**：无 lint 错误。

---

## [2026-04-11 16:42] 自定义组件支持改名

**改动文件**：
- `js/editor/EditorManager.js`

**改动内容**：
1. `updateElementList()` — 自定义元素按钮左右 padding 均扩为 22px，左上角新增蓝色「✎」改名按钮
2. 新增 `_inlineRenameElement(elementId, button, currentName)` — 点击改名按钮后把按钮文字原地替换为 `<input>`，按 Enter 或失焦提交，按 Esc 取消
3. 新增 `renameCustomElement(elementId, newName)` — 将新名称写入 localStorage 持久化列表，同步更新 UIManager 元素的 `config.name`，并刷新元素列表

**报错记录**：无



**改动文件**：
- `js/editor/EditorManager.js`

**改动内容**：
1. 构造函数新增 `_CUSTOM_ELEMENTS_KEY` 常量（`ui_preview_custom_elements`）用于 localStorage 持久化
2. `_init()` 末尾调用 `_loadCustomElements()`，页面刷新后自动恢复已添加的自定义组件
3. `_initElementSelector()` 元素列表下方增加绿色「➕ 添加组件」按钮
4. `updateElementList()` 改写：
   - 自定义元素显示 `displayName`（中文名），鼠标悬停 title 显示内部 ID
   - 自定义元素深绿色底色 + 右上角红色「✕」删除按钮
5. 新增方法 `_getCustomElementsConfig()` / `_saveCustomElementsConfig()` — localStorage 读写
6. 新增方法 `_loadCustomElements()` — 初始化时恢复持久化的自定义组件
7. 新增方法 `_registerCustomElement(cfg, persist)` — 向 UIManager 注册并可选持久化
8. 新增方法 `removeCustomElement(elementId)` — 移除组件 + 从持久化列表删除
9. 新增方法 `_showAddElementDialog()` — 弹出添加组件对话框，支持以下字段：
   - 组件 ID（英文+下划线，唯一性校验）
   - 显示名称（自定义中文名）
   - 层级 z-index
   - 位置 X / Y（基准坐标）
   - 宽度 W / 高度 H

**报错记录**：无



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