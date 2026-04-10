# UI预览工具 (GODAI) 改动日志

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