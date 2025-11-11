# imagekit-react-widgets

一个可复用的图片/视频资源中心的 React 组件库，支持 ImageKit 列表、上传、选择、多选确认、预览（图片与视频），并可在弹窗中使用。

[English](./README.md)  [中文](./README.zh-CN.md)

## 安装

```bash
npm install imagekit-react-widgets
# or
yarn add imagekit-react-widgets
```

## 快速使用

```tsx
import { ResourceCenter } from 'imagekit-react-widgets'
import 'imagekit-react-widgets/dist/index.css'

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
        privateKey={IMAGEKIT_PRIVATE_KEY}
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
- `folderPath?`: 仅显示某个文件夹下的资源，例如 `"/products/2024"`
  - 若传入 `folderPath`，组件会在列表接口（默认或自定义）上自动拼接 `path` 参数（若接口已包含 `path` 则不重复拼接）
- `uploadEndpoint`: ImageKit 上传接口，例如 `https://upload.imagekit.io/api/v1/files/upload`
- `privateKey`: ImageKit 私钥（Basic Auth），请通过安全方式注入
- `uploadFolder?`: 上传目标目录，例如 `/assets`
  - 默认行为：如果传入了 `folderPath` 且未显式传入 `uploadFolder`，上传将默认写入到 `folderPath` 指定的目录（例如 `folderPath="/css"` 则上传到 `/css`）。若你显式传入了 `uploadFolder`，则以你指定为准。
- `uploadTags?`: 上传时附加标签数组
- `maxFileSize?`: 最大文件大小（默认 10MB）
- `allowedTypes?`: 允许的 MIME 类型（默认仅图片）
- `allowedExts?`: 允许的扩展名（默认仅图片）
- `enableDelete?`: 是否显示删除操作，默认 `true`
- `enableUpload?`: 是否允许上传，默认 `true`
- `multiSelect?`: 是否允许多选，默认 `true`
- `title?`: 自定义顶部标题文案

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

## 变更日志

详见 `CHANGELOG.md`


