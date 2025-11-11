import { useState } from 'react'
import ResourceCenter from '@/lib/ResourceCenter'

export default function Home() {
  // 仅保留一个按钮，点击弹出资源中心
  const [open, setOpen] = useState(false)
  const PRIVATE_KEY = import.meta.env.VITE_IMAGEKIT_PRIVATE_KEY as string | undefined

  const IMAGEKIT_URL = 'https://api.imagekit.io/v1/files'
  const IMAGEKIT_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload'

  return (
    <div style={{ padding: 24 }}>
      <button className="ik-btn" onClick={() => setOpen(true)}>打开资源中心</button>

      <ResourceCenter
        open={open}
        onOpenChange={setOpen}
        onConfirm={() => setOpen(false)}
        onError={(msg) => console.error(msg)}
        listEndpoint={IMAGEKIT_URL}
        uploadEndpoint={IMAGEKIT_UPLOAD_URL}
        privateKey={PRIVATE_KEY || ''}
        uploadTags={[]}
        enableDelete={true}
        enableUpload={true}
        multiSelect={true}
        theme="light"
      />
    </div>
  )
}