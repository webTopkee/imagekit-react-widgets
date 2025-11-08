# imagekit-react-widgets

一个可复用的图片/视频资源中心的 React 组件库，支持 ImageKit 列表、上传、选择、多选确认、预览（图片与视频），并可在弹窗中使用。

## 安装

```bash
npm install imagekit-react-widgets
# or
pnpm add imagekit-react-widgets
```

## 快速使用

```tsx
import { ResourceCenter } from 'imagekit-react-widgets'

function Demo() {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button onClick={() => setOpen(true)}>打开资源中心</button>
      <ResourceCenter
        open={open}
        onOpenChange={setOpen}
        listEndpoint="https://api.imagekit.io/v1/files"
        uploadEndpoint="https://upload.imagekit.io/api/v1/files/upload"
        privateKey={process.env.IMAGEKIT_PRIVATE_KEY!}
        onConfirm={(files) => {
          console.log('已选择', files)
        }}
      />
    </div>
  )
}
```

## API 文档

- `open`: 是否打开弹窗，默认 `false`
- `onOpenChange(open)`: 弹窗开关回调
- `onConfirm(files)`: 选择确认回调，返回 `ImageKitFile[]`
- `onError(message)`: 错误回调
- `listEndpoint`: ImageKit 列表接口，例如 `https://api.imagekit.io/v1/files`
- `uploadEndpoint`: ImageKit 上传接口，例如 `https://upload.imagekit.io/api/v1/files/upload`
- `privateKey`: ImageKit 私钥（Basic Auth），请通过安全方式注入
- `uploadFolder?`: 上传目标目录，例如 `/assets`
- `uploadTags?`: 上传时附加标签数组
- `maxFileSize?`: 最大文件大小（默认 10MB）
- `allowedTypes?`: 允许的 MIME 类型（默认仅图片）
- `allowedExts?`: 允许的扩展名（默认仅图片）
- `enableDelete?`: 是否显示删除操作，默认 `true`
- `enableUpload?`: 是否允许上传，默认 `true`
- `multiSelect?`: 是否允许多选，默认 `true`
- `theme?`: 主题，可选 `light | dark`（目前主要样式为 light）

### ImageKitFile 类型

```ts
interface ImageKitFile {
  fileId: string
  name: string
  url: string
  thumbnailUrl: string
  height: number
  width: number
  size: number
  createdAt: string
}
```

## 最佳实践

- 请不要在前端代码中硬编码 `privateKey`，应使用环境变量或服务端代理安全注入。
- 视频条目的缩略图显示优先使用 `thumbnailUrl`，若无则使用占位图与播放图标。双击列表项可预览并播放视频。
- 若需要扩展多文件上传与上传前预览，可在外部组合使用。

## 构建与发布

```bash
pnpm build:lib
npm publish --access public
```

## 环境变量配置

在项目根目录创建 `.env` 文件并设置：

```
VITE_IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key_here
```

注意：不要提交真实私钥到版本库，建议根据 `.env.example` 模板配置本地环境或在部署平台上设置环境变量。

## 变更日志

详见 `CHANGELOG.md`
