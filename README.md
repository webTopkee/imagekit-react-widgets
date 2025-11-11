# imagekit-react-widgets

A reusable React component library for an image/video Resource Center. It supports ImageKit listing, uploading, selection, multi-select confirmation, preview (images and videos), and can be used in a modal.

[English](./README.md)  [中文](./README.zh-CN.md)

## Installation

```bash
npm install imagekit-react-widgets
# or
yarn add imagekit-react-widgets
```

## Quick Start

```tsx
import { ResourceCenter } from 'imagekit-react-widgets'
import 'imagekit-react-widgets/dist/index.css'

function Demo() {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button onClick={() => setOpen(true)}>Open Resource Center</button>
      <ResourceCenter
        open={open}
        onOpenChange={setOpen}
        listEndpoint="https://api.imagekit.io/v1/files"
        uploadEndpoint="https://upload.imagekit.io/api/v1/files/upload"
        privateKey={IMAGEKIT_PRIVATE_KEY}
        onConfirm={(files) => {
          console.log('Selected', files)
        }}
      />
    </div>
  )
}
```

## API Docs

- `open`: whether the modal is open, default `false`
- `onOpenChange(open)`: modal open/close callback
- `onConfirm(files)`: selection confirm callback, returns `ImageKitFile[]`
- `onError(message)`: error callback
- `listEndpoint`: ImageKit list endpoint, e.g. `https://api.imagekit.io/v1/files`
- `folderPath?`: only show resources under a specific folder, e.g. `"/products/2024"`
  - If `folderPath` is provided, the list endpoint (default or custom) is auto-appended with `path` unless it already contains `path`
- `uploadEndpoint`: ImageKit upload endpoint, e.g. `https://upload.imagekit.io/api/v1/files/upload`
- `privateKey`: ImageKit private key (Basic Auth), inject securely
- `uploadFolder?`: upload target directory, e.g. `/assets`
  - Default behavior: if `folderPath` is provided and `uploadFolder` is not explicitly set, uploads will go to the folder indicated by `folderPath` (e.g. `folderPath="/css"` uploads into `/css`). If you explicitly set `uploadFolder`, your value takes precedence.
- `uploadTags?`: tags array to attach on upload
- `maxFileSize?`: max file size (default 10MB)
- `allowedTypes?`: allowed MIME types (default images only)
- `allowedExts?`: allowed extensions (default images only)
- `enableDelete?`: show delete action, default `true`
- `enableUpload?`: allow uploading, default `true`
- `multiSelect?`: allow multi-select, default `true`
- `title?`: custom top header text

### ImageKitFile Type

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

## Changelog

See `CHANGELOG.md`