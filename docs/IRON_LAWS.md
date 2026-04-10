# UI预览工具 - 安全施工铁律

## 概述

本文件定义了 UI 预览工具（纯前端 JavaScript 项目）的安全施工铁律。基于 SCP 共生项目的成功经验，并针对**前端 JavaScript 项目的特有风险**进行适配。

## 8条铁律

### 铁律1 - COMMIT_LOG（改完即记）
**规则**：修改任何文件后必须将改动结果追加到 `COMMIT_LOG.md`，格式为 `## [YYYY-MM-DD HH:MM] 简要标题`，包含以下三个段落：
1. **改动文件**：列出所有修改的文件路径
2. **改动内容**：详细描述修改了什么、为什么修改
3. **报错记录**：记录遇到的错误、修复过程和验证结果

**前端特化**：必须记录浏览器控制台的任何错误，以及清除浏览器缓存的操作。

### 铁律2 - DEV_ISSUES（改前先读+踩坑积累）
**规则**：修改前必须先读 `DEV_ISSUES.md` 确认是否命中已知坑点；同一类问题反复出现≥3次时，将踩坑记录追加到 `DEV_ISSUES.md`。

**前端特化**：重点关注以下前端特有坑点：
- 浏览器缓存导致的旧版本代码执行
- 模块加载顺序依赖 script 标签
- localStorage 有 5MB 限制和跨浏览器兼容性
- CSS 特异性（specificity）冲突
- 异步加载导致的竞态条件
- 跨域资源共享（CORS）问题

### 铁律3 - SYSTEM_MAP 联动查表
**规则**：改动代码前必须先读 `SYSTEM_MAP.md` 确认涉及哪些文件。涉及未记录的文件时，逐步补全文档。

**前端特化**：系统地图必须包括：
- HTML 文件之间的依赖关系
- JavaScript 模块的加载顺序
- CSS 样式的层叠关系
- localStorage 键的命名空间
- 图片和字体等静态资源的加载路径

### 铁律4 - BUG回溯（读最近5条日志）
**规则**：BUG修复场景必须先读 `COMMIT_LOG.md` 最近5条记录还原上下文。执行顺序：
1. 读 `COMMIT_LOG.md`（最近5条）
2. 读 `DEV_ISSUES.md`
3. 读 `SYSTEM_MAP.md`
4. 定位修复
5. 写 `COMMIT_LOG.md`

**前端特化**：BUG回溯必须包括浏览器开发者工具的信息：
- 控制台错误堆栈
- 网络请求状态
- 内存使用情况
- 本地存储状态

### 铁律5 - 浏览器缓存防御铁律
**规则**：所有修改必须考虑浏览器缓存的致命影响。防御措施：
1. **开发环境**：使用 `Disable cache (while DevTools is open)` 选项
2. **代码版本**：重要接口改动必须增加版本号检查
3. **加载检查**：外部模块调用必须进行三重防御：
   ```javascript
   try {
       const Storage = window.Storage;
       if (Storage && typeof Storage.saveElementConfig === 'function') {
           Storage.saveElementConfig(this.id, this.config);
       } else {
           console.warn('⚠️ 存储模块方法缺失，可能是浏览器缓存了旧版本');
       }
   } catch (error) {
       console.warn('⚠️ 配置保存失败:', error.message);
   }
   ```
4. **用户指导**：在 README 中注明清除缓存的方法（Ctrl+F5 或 Ctrl+Shift+R）

### 铁律6 - 模块加载竞态防御铁律
**规则**：JavaScript 模块加载顺序决定执行顺序，必须防御加载失败或顺序错误的竞态条件。
1. **依赖声明**：在模块头部明确声明所有依赖
2. **存在性检查**：使用模块前检查是否已加载
   ```javascript
   if (typeof window.Scaler === 'undefined') {
       console.error('❌ Scaler 模块未加载');
       return;
   }
   ```
3. **错误恢复**：关键模块加载失败时提供替代方案或重试机制
4. **加载顺序**：HTML 中的 script 标签顺序必须与依赖关系一致

### 铁律7 - localStorage 安全使用铁律
**规则**：localStorage 不是数据库，必须安全使用：
1. **大小限制**：单条数据不超过 5MB，总存储空间不超过 10MB
2. **错误处理**：所有操作必须包裹在 try-catch 中
   ```javascript
   try {
       localStorage.setItem(key, JSON.stringify(data));
   } catch (error) {
       console.warn('⚠️ 保存失败（可能是存储空间已满）:', error.message);
       // 提供用户友好的错误提示
   }
   ```
3. **数据类型**：只存储 JSON 可序列化的数据
4. **命名空间**：使用项目前缀避免键名冲突，如 `ui_preview_` + key
5. **敏感数据**：绝不存储密码、密钥等敏感信息

### 铁律8 - 工具验证审查铁律
**规则**：每次使用工具修改代码后，必须执行四级验证链：
1. **重新读取确认**：用 `read_file` 确认文件内容实际已改变
2. **控制台检查**：在浏览器中刷新页面，查看控制台是否有错误
3. **功能验证**：手动测试修改的功能是否正常工作
4. **文档更新**：更新相关文档记录修改

**核心教训**：工具静默失效、浏览器缓存旧版本、文档与代码脱节是前端开发的最大敌人。

## 违反铁律的严重后果

1. **Storage.loadElementConfig is not a function**（2026-04-10 事故）
   - **违反铁律**：缺少三重防御检查、未考虑浏览器缓存
   - **后果**：修复4次、浪费一下午时间
   - **根因**：modern-loader.js 检测到 window.Storage 存在就跳过重新加载，但浏览器缓存的是旧版本

2. **CSS 特异性战争**
   - **违反铁律**：未记录 CSS 层叠关系
   - **后果**：样式覆盖失效、UI 显示异常
   - **根因**：CSS 优先级计算错误

3. **localStorage 存储已满**
   - **违反铁律**：未处理存储空间不足异常
   - **后果**：配置保存失败、用户数据丢失
   - **根因**：未考虑 5MB 限制

## 前端特有风险清单

### 高风险
1. **浏览器缓存**：代码修改后浏览器仍在执行旧版本
2. **模块加载顺序**：依赖模块尚未加载就调用其方法
3. **localStorage 限制**：存储空间不足、数据被意外清除
4. **跨域资源共享**：图片、字体等资源加载失败

### 中风险
1. **CSS 优先级冲突**：样式覆盖失效
2. **JavaScript 执行上下文**：this 指向错误
3. **事件冒泡与捕获**：事件处理异常
4. **异步竞态**：Promise/AJAX 回调顺序错误

### 低风险
1. **浏览器兼容性**：不同浏览器表现不一致
2. **字体加载**：字体文件加载慢导致布局偏移
3. **图片懒加载**：图片未及时加载影响用户体验

## 防御模式代码示例

### 三重防御模式（针对外部模块调用）
```javascript
function callExternalModule() {
    try {
        // 第一层：存在性检查
        const Module = window.ExternalModule;
        if (!Module) {
            console.warn('⚠️ 外部模块未加载');
            return false;
        }
        
        // 第二层：类型检查
        if (typeof Module.importantMethod !== 'function') {
            console.warn('⚠️ 外部模块方法缺失，可能是浏览器缓存了旧版本');
            return false;
        }
        
        // 第三层：异常捕获
        const result = Module.importantMethod(params);
        return result;
    } catch (error) {
        console.error('❌ 外部模块调用失败:', error.message);
        // 提供降级方案
        return fallbackFunction();
    }
}
```

### localStorage 安全封装
```javascript
class SafeStorage {
    static PREFIX = 'ui_preview_';
    
    static save(key, data) {
        try {
            const fullKey = this.PREFIX + key;
            const jsonStr = JSON.stringify(data);
            
            if (jsonStr.length > 5 * 1024 * 1024) {
                console.warn('⚠️ 数据过大（超过5MB），尝试压缩或分块存储');
                // 分块存储逻辑
            }
            
            localStorage.setItem(fullKey, jsonStr);
            return true;
        } catch (error) {
            console.warn('⚠️ 保存失败:', error.message);
            if (error.name === 'QuotaExceededError') {
                alert('存储空间已满，请清除一些数据或使用更大存储空间');
            }
            return false;
        }
    }
    
    static load(key, defaultValue = null) {
        try {
            const fullKey = this.PREFIX + key;
            const jsonStr = localStorage.getItem(fullKey);
            return jsonStr ? JSON.parse(jsonStr) : defaultValue;
        } catch (error) {
            console.warn('⚠️ 加载失败:', error.message);
            return defaultValue;
        }
    }
}
```

## 开发工作流程

### 正常开发流程
```
1. 读 DEV_ISSUES.md（确认已知坑点）
2. 读 SYSTEM_MAP.md（确认影响范围）
3. 执行修改
4. 四级验证链：
   - 重新读取确认文件已修改
   - 浏览器刷新查看控制台
   - 功能测试
   - 跨浏览器测试
5. 更新 COMMIT_LOG.md
6. 如有必要，更新 DEV_ISSUES.md
```

### BUG修复流程
```
1. 读 COMMIT_LOG.md（最近5条记录）
2. 读 DEV_ISSUES.md（相关坑点）
3. 读 SYSTEM_MAP.md（系统依赖）
4. 在浏览器中复现BUG
5. 使用开发者工具分析
6. 定位根因
7. 三重防御修复
8. 四级验证链
9. 更新 COMMIT_LOG.md
10. 如有必要，更新 DEV_ISSUES.md
```

## 紧急情况处理

### 浏览器缓存污染（最常见）
**症状**：代码已修改但浏览器仍在执行旧版本
**紧急处理**：
1. Ctrl+Shift+R（硬刷新）
2. 清除浏览器缓存
3. 打开开发者工具 → Network → 勾选 "Disable cache"
4. 重启浏览器

### localStorage 损坏
**症状**：配置无法加载或保存
**紧急处理**：
1. 检查浏览器控制台错误
2. 尝试其他浏览器
3. 备份当前 localStorage 数据
4. 清空项目相关的 localStorage 键
5. 重新初始化配置

### 模块加载失败
**症状**：控制台显示 "xxx is not defined"
**紧急处理**：
1. 检查 script 标签顺序
2. 检查文件路径是否正确
3. 检查模块导出语句
4. 添加模块存在性检查
5. 添加降级方案

---

**维护者**：UI预览工具安全委员会  
**创建日期**：2026-04-10  
**最后更新**：2026-04-10  
**基于 SCP 铁律版本**：v2.0（前端特化版）  
**核心教训**：Storage.loadElementConfig is not a function（2026-04-10，修复4次耗时一下午）