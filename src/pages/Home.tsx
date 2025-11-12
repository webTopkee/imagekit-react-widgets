import { useState } from 'react'
import ResourceCenter from '@/lib/ResourceCenter'
import type { ImageKitFile } from '@/lib/types'

export default function Home() {
  // 仅保留一个按钮，点击弹出资源中心
  const [open, setOpen] = useState(false)
  const [selectedResources, setSelectedResources] = useState<ImageKitFile[]>([])
  const PRIVATE_KEY = import.meta.env.VITE_IMAGEKIT_PRIVATE_KEY as string | undefined

  const IMAGEKIT_URL = 'https://api.imagekit.io/v1/files'
  const IMAGEKIT_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload'

  return (
    <div style={{ padding: 24 }}>
      <button className="ik-btn" onClick={() => setOpen(true)}>打开资源中心</button>

      <ResourceCenter
        open={open}
        onOpenChange={setOpen}
        onConfirm={(items) => {
          setSelectedResources(items)
          console.log('选中资源：', items)
          setOpen(false)
        }}
        onError={(msg) => console.error(msg)}
        // folderPath="/css"
        listEndpoint={IMAGEKIT_URL}
        uploadEndpoint={IMAGEKIT_UPLOAD_URL}
        privateKey={PRIVATE_KEY || ''}
        uploadTags={[]}
        enableDelete={true}
        enableUpload={true}
        multiSelect={true}
        theme="light"
      />

      {selectedResources.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 8 }}>选中资源数据</h3>
          <pre style={{ background: '#f7f7f9', padding: 12, borderRadius: 8, overflow: 'auto' }}>
            {JSON.stringify(selectedResources, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}