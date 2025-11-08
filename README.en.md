# imagekit-react-widgets

A reusable React component library for an image/video resource center. It supports ImageKit file listing, upload, selection, multi-select confirmation, preview (images and videos), and can be used within a modal dialog.

[中文 README](./README.md)

## Installation

```bash
npm install imagekit-react-widgets
# or
pnpm add imagekit-react-widgets
```

## Quick Start

```tsx
import { ResourceCenter } from 'imagekit-react-widgets'

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
        privateKey={process.env.IMAGEKIT_PRIVATE_KEY!}
        onConfirm={(files) => {
          console.log('Selected', files)
        }}
      />
    </div>
  )
}
```

## API

- `open`: whether the modal is open, default `false`
- `onOpenChange(open)`: callback when modal open state changes
- `onConfirm(files)`: selection confirmation callback, returns `ImageKitFile[]`
- `onError(message)`: error callback
- `listEndpoint`: ImageKit list endpoint, e.g. `https://api.imagekit.io/v1/files`
- `uploadEndpoint`: ImageKit upload endpoint, e.g. `https://upload.imagekit.io/api/v1/files/upload`
- `privateKey`: ImageKit private key (Basic Auth). Inject via secure mechanisms
- `uploadFolder?`: upload target directory, e.g. `/assets`
- `uploadTags?`: array of tags to attach on upload
- `maxFileSize?`: max file size (default 10MB)
- `allowedTypes?`: allowed MIME types (default images only)
- `allowedExts?`: allowed file extensions (default images only)
- `enableDelete?`: whether to show delete action, default `true`
- `enableUpload?`: whether upload is allowed, default `true`
- `multiSelect?`: whether multi-select is allowed, default `true`
- `theme?`: theme, `light | dark` (currently mainly light styles)

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

## Environment Variables

Create a `.env` file at the project root and set:

```
VITE_IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key_here
```

Note: Do not commit real private keys to version control. Use `.env.example` as a template for local development, or set environment variables on your deployment platform.

## Changelog

See `CHANGELOG.md`