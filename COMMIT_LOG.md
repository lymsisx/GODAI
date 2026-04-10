# UI预览工具 (GODAI) 改动日志

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