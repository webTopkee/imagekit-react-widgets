# Changelog

All notable changes to this project will be documented in this file.

## 0.1.0

- 初始发布：封装 ResourceCenter 组件，支持图片/视频列表、上传、选择与预览。
- 支持视频缩略图或占位图显示，弹窗预览视频播放。
- 提供类型与入口导出，完善 README 文档。

## 0.1.1

- 修复：包安装后无样式问题，新增构建产物 `dist/index.css` 并在文档中说明导入方式。
- 文档：README（中/英）补充 `import 'imagekit-react-widgets/dist/index.css'` 使用说明。

## 0.1.3

- 修复：避免打包 React 导致双实例冲突（`ReactCurrentDispatcher` 报错）。
- 变更：将 `react`、`react-dom` 从 `dependencies` 移至 `peerDependencies`，并在构建中外部化 `react`、`react-dom`、`react/jsx-runtime`。
- 优化：仅在开发模式启用 `react-dev-locator`。

## 0.1.4

- 修复：导出 CSS 样式不全面问题，补充滚动条样式与按钮交互状态。
- 新增：在 `src/lib/styles.css` 中加入 `.ik-scrollbar` 与 `.ik-btn` 系列工具类；默认提供跨浏览器滚动条样式。
- 配置：增加 `tailwind-scrollbar` 插件支持，确保需要的滚动条类能被扫描与生成。

## 0.1.2

- 修复：`exports` 字段未导出 CSS 导致 `import 'imagekit-react-widgets/dist/index.css'` 报错。新增 `"./dist/index.css"` 映射。
- 优化：设置 `sideEffects` 包含 `dist/index.css`，避免被树摇去除。

## 0.1.5

- 新增：`ResourceCenter` 支持自定义标题 `title`（传入则覆盖默认）。
- 文档：README（中/英）补充“自定义标题”示例与参数说明；移除 `titleLocale` 说明。

## 0.1.7

- Fix: 上传成功后列表未即时刷新。统一在单/批量上传成功后主动调用列表刷新，并为列表请求添加防缓存参数，确保最新文件出现在首屏。

## 0.1.6

- 新增：`folderPath` 可选参数，用于只展示某个文件夹下的资源（例如 `"/products/2024"`）。
- 变更：`listEndpoint` 改为可选。不传时默认使用 `https://api.imagekit.io/v1/files`，并在传入 `folderPath` 时自动拼接 `?path=...`；若同时传入自定义 `listEndpoint`，则优先使用自定义地址，不再自动拼接。
- 文档：更新 README（中/英）说明与示例。
 - 默认上传目录：当传入 `folderPath` 且未显式设置 `uploadFolder` 时，上传默认写入 `folderPath` 指定目录。