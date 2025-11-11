import { useState, useEffect, useRef } from 'react'
import { IconX, IconLoader, IconMoreVertical, IconLink, IconCopy, IconTrash, IconExternalLink, IconCheck, IconPlayCircle } from '@/lib/icons'

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

interface ImageKitResponse {
  files: ImageKitFile[]
  totalCount: number
}

// 待上传文件项（仅名称与大小展示，独立上传状态与进度）
interface PendingUploadItem {
  id: string
  file: File
  name: string
  size: number
  type: string
  status: 'ready' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string | null
}

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [images, setImages] = useState<ImageKitFile[]>([])
  // 主页展示：已确认选择的图片
  const [confirmedImages, setConfirmedImages] = useState<ImageKitFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [previewImage, setPreviewImage] = useState<ImageKitFile | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  // 选择文件后的预览弹窗状态
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewDims, setPreviewDims] = useState<{ width: number, height: number } | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewValidationMsg, setPreviewValidationMsg] = useState<string | null>(null)
  // 多图片待上传列表
  const [pendingItems, setPendingItems] = useState<PendingUploadItem[]>([])

  const PRIVATE_KEY = import.meta.env.VITE_IMAGEKIT_PRIVATE_KEY as string | undefined
  useEffect(() => {
    if (!PRIVATE_KEY) {
      console.error('[ImageKit] 缺少环境变量 VITE_IMAGEKIT_PRIVATE_KEY')
      setError('环境变量未配置：请在 .env 中设置 VITE_IMAGEKIT_PRIVATE_KEY')
    }
  }, [PRIVATE_KEY])
  const IMAGEKIT_URL = 'https://api.imagekit.io/v1/files'
  // 按照 ImageKit 官方文档，上传端点必须为 /api/v1/files/upload
  // 参考：https://imagekit.io/docs/api-reference/upload-file/upload-file
  const IMAGEKIT_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload'
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp']
  const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']
  const UPLOAD_FOLDER = '' // 可配置：例如 '/assets/images'
  const UPLOAD_TAGS: string[] = [] // 可配置：例如 ['banner','product']

  // 获取图片数据：按创建时间降序，若时间相同则按 fileId 升序以稳定排序
  const sortByCreatedAtDesc = (arr: ImageKitFile[]) =>
    arr.slice().sort((a, b) => {
      const ta = new Date(a.createdAt).getTime() || 0
      const tb = new Date(b.createdAt).getTime() || 0
      if (tb !== ta) return tb - ta
      return a.fileId.localeCompare(b.fileId)
    })

  // 支持视频格式识别与展示
  const VIDEO_EXTS = ['mp4', 'webm', 'ogv', 'mov', 'avi', 'wmv', 'flv', 'mkv', 'mpeg', 'mpg']
  const getExtLower = (name: string, url?: string) => {
    const tryFrom = (s: string) => s.split('?')[0].split('.').pop()?.toLowerCase() || ''
    const extFromName = tryFrom(name)
    if (extFromName) return extFromName
    if (url) {
      const extFromUrl = tryFrom(url)
      if (extFromUrl) return extFromUrl
    }
    return ''
  }
  const isVideoExt = (ext: string) => VIDEO_EXTS.includes(ext.toLowerCase())
  const isVideoFile = (file: ImageKitFile) => isVideoExt(getExtLower(file.name, file.url))
  const getFormatFromName = (name: string, url?: string) => {
    const ext = getExtLower(name, url)
    return ext ? ext.toUpperCase() : 'FILE'
  }

  const handlePreview = (image: ImageKitFile) => {
    window.open(image.url, '_blank', 'noopener,noreferrer')
  }

  const handleCopy = async (image: ImageKitFile) => {
    try {
      await navigator.clipboard.writeText(image.url)
      setCopiedId(image.fileId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // 兼容性兜底
      const input = document.createElement('textarea')
      input.value = image.url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopiedId(image.fileId)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const handleDelete = async (image: ImageKitFile) => {
    const confirmDelete = window.confirm('确认删除该文件？此操作不可恢复。')
    if (!confirmDelete) return
    setDeletingId(image.fileId)
    setError(null)
    try {
      const resp = await fetch(`${IMAGEKIT_URL}/${image.fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${btoa(PRIVATE_KEY + ':')}`
        }
      })
      if (!resp.ok) {
        let msg = `删除失败：HTTP ${resp.status}`
        try {
          const j = await resp.json()
          msg = j.message || msg
        } catch {}
        setError(msg)
        return
      }
      setImages(prev => prev.filter(i => i.fileId !== image.fileId))
      if (activeMenuId === image.fileId) setActiveMenuId(null)
    } catch (err) {
      setError(err instanceof Error ? `删除失败：${err.message}` : '删除失败')
    } finally {
      setDeletingId(null)
    }
  }

  // 选中与预览交互（必须在组件内部）
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const openPreview = (image: ImageKitFile) => {
    setPreviewImage(image)
  }

  const closePreview = () => {
    setPreviewImage(null)
  }

  // 资源中心：确认选择，将当前选中的图片同步到主页列表
  const confirmSelection = () => {
    const selectedList = images.filter(img => selectedIds.has(img.fileId))
    setConfirmedImages(selectedList)
    setIsModalOpen(false)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePreview()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleUploadClick = () => {
    if (!fileInputRef.current) return
    fileInputRef.current.value = ''
    fileInputRef.current.click()
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      addFilesToPending(Array.from(files))
    }
  }

  const addFilesToPending = (files: File[]) => {
    const newItems: PendingUploadItem[] = files.map((file, idx) => {
      let error: string | null = null
      if (file.size > MAX_FILE_SIZE) {
        error = '文件过大，最大支持 10MB'
      } else if (!ALLOWED_TYPES.includes(file.type)) {
        error = '不支持的文件类型，仅支持图片'
      }
      return {
        id: `${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 8)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: error ? 'error' : 'ready',
        progress: 0,
        error
      }
    })
    setPendingItems(prev => [...prev, ...newItems])
  }

  const removePendingItem = (id: string) => {
    setPendingItems(prev => prev.filter(item => item.id !== id))
  }

  const uploadPendingItem = (id: string) => {
    const item = pendingItems.find(i => i.id === id)
    if (!item) return
    if (item.status !== 'ready') return
    setPendingItems(prev => prev.map(pi => pi.id === id ? { ...pi, status: 'uploading', progress: 0, error: null } : pi))

    const formData = new FormData()
    formData.append('file', item.file)
    formData.append('fileName', item.file.name)
    formData.append('useUniqueFileName', 'true')
    if (UPLOAD_FOLDER) formData.append('folder', UPLOAD_FOLDER)
    if (UPLOAD_TAGS.length) formData.append('tags', UPLOAD_TAGS.join(','))

    const xhr = new XMLHttpRequest()
    xhr.open('POST', IMAGEKIT_UPLOAD_URL, true)
    xhr.setRequestHeader('Authorization', `Basic ${btoa(PRIVATE_KEY + ':')}`)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100)
        setPendingItems(prev => prev.map(pi => pi.id === id ? { ...pi, progress: percent } : pi))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setPendingItems(prev => prev.map(pi => pi.id === id ? { ...pi, status: 'success', progress: 100 } : pi))
        fetchImages()
        setTimeout(() => {
          setPendingItems(prev => prev.filter(pi => pi.id !== id))
        }, 800)
      } else {
        let msg = `上传失败：${xhr.status}`
        try {
          const j = JSON.parse(xhr.responseText)
          msg = j.message || msg
        } catch {}
        setPendingItems(prev => prev.map(pi => pi.id === id ? { ...pi, status: 'error', error: msg } : pi))
      }
    }

    xhr.onerror = () => {
      setPendingItems(prev => prev.map(pi => pi.id === id ? { ...pi, status: 'error', error: '网络错误，上传失败' } : pi))
    }

    xhr.send(formData)
  }

  const uploadAllPending = async () => {
    const readyIds = pendingItems.filter(i => i.status === 'ready').map(i => i.id)
    for (const id of readyIds) {
      await new Promise<void>((resolve) => {
        const item = pendingItems.find(i => i.id === id)
        if (!item) return resolve()

        const formData = new FormData()
        formData.append('file', item.file)
        formData.append('fileName', item.file.name)
        formData.append('useUniqueFileName', 'true')
        if (UPLOAD_FOLDER) formData.append('folder', UPLOAD_FOLDER)
        if (UPLOAD_TAGS.length) formData.append('tags', UPLOAD_TAGS.join(','))

        const xhr = new XMLHttpRequest()
        xhr.open('POST', IMAGEKIT_UPLOAD_URL, true)
        xhr.setRequestHeader('Authorization', `Basic ${btoa(PRIVATE_KEY + ':')}`)

        setPendingItems(prev => prev.map(pi => pi.id === id ? { ...pi, status: 'uploading', progress: 0, error: null } : pi))

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100)
            setPendingItems(prev => prev.map(pi => pi.id === id ? { ...pi, progress: percent } : pi))
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setPendingItems(prev => prev.map(pi => pi.id === id ? { ...pi, status: 'success', progress: 100 } : pi))
            fetchImages()
            setTimeout(() => {
              setPendingItems(prev => prev.filter(pi => pi.id !== id))
            }, 800)
          } else {
            let msg = `上传失败：${xhr.status}`
            try {
              const j = JSON.parse(xhr.responseText)
              msg = j.message || msg
            } catch {}
            setPendingItems(prev => prev.map(pi => pi.id === id ? { ...pi, status: 'error', error: msg } : pi))
          }
          resolve()
        }

        xhr.onerror = () => {
          setPendingItems(prev => prev.map(pi => pi.id === id ? { ...pi, status: 'error', error: '网络错误，上传失败' } : pi))
          resolve()
        }

        xhr.send(formData)
      })
    }
  }

  const openFilePreview = (file: File) => {
    setPreviewFile(file)
    setShowPreviewModal(true)
    setPreviewLoading(true)
    setPreviewValidationMsg(null)
    // 基本校验（与上传一致，但不立即报错阻断，只在弹窗提示并禁用“确认上传”）
    if (file.size > MAX_FILE_SIZE) {
      setPreviewValidationMsg('文件过大，最大支持 10MB')
    } else if (!ALLOWED_TYPES.includes(file.type)) {
      setPreviewValidationMsg('不支持的文件类型，仅支持图片')
    }

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    const img = new Image()
    img.onload = () => {
      setPreviewDims({ width: img.naturalWidth, height: img.naturalHeight })
      setPreviewLoading(false)
    }
    img.onerror = () => {
      setPreviewLoading(false)
      setPreviewValidationMsg('无法读取图片预览')
    }
    img.src = objectUrl
  }

  const closeFilePreview = () => {
    setShowPreviewModal(false)
    if (previewUrl) {
      try { URL.revokeObjectURL(previewUrl) } catch {}
    }
    setPreviewFile(null)
    setPreviewUrl(null)
    setPreviewDims(null)
    setPreviewLoading(false)
    setPreviewValidationMsg(null)
  }

  const handlePreviewUpload = async () => {
    if (!previewFile) return
    // 如果校验失败，阻止上传并在顶部显示错误
    if (previewValidationMsg) {
      setError(previewValidationMsg)
      return
    }
    closeFilePreview()
    uploadFile(previewFile)
  }

  const uploadFile = (file: File) => {
    console.log('[ImageKit] uploadFile:start', { name: file.name, size: file.size, type: file.type })

    // 文件校验：大小与类型
    if (file.size > MAX_FILE_SIZE) {
      setError('文件过大，最大支持 10MB')
      console.warn('[ImageKit] uploadFile:invalid_size', file.size)
      return
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('不支持的文件类型，仅支持图片')
      console.warn('[ImageKit] uploadFile:invalid_type', file.type)
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileName', file.name)
    formData.append('useUniqueFileName', 'true')
    if (UPLOAD_FOLDER) formData.append('folder', UPLOAD_FOLDER)
    if (UPLOAD_TAGS.length) formData.append('tags', UPLOAD_TAGS.join(','))

    const xhr = new XMLHttpRequest()
    xhr.open('POST', IMAGEKIT_UPLOAD_URL, true)
    xhr.setRequestHeader('Authorization', `Basic ${btoa(PRIVATE_KEY + ':')}`)
    console.log('[ImageKit] uploadFile:POST', IMAGEKIT_UPLOAD_URL)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = (event.loaded / event.total) * 100
        setUploadProgress(Math.min(100, Math.round(percent)))
        // 为了避免日志过多，仅在关键进度点打印
        const rounded = Math.round(percent)
        if ([10,25,50,75,90].includes(rounded)) {
          console.log('[ImageKit] uploadFile:progress', rounded + '%')
        }
      }
    }

    xhr.onload = () => {
      setUploading(false)
      setUploadProgress(0)
      console.log('[ImageKit] uploadFile:response_status', xhr.status)
      console.debug('[ImageKit] uploadFile:response_text', xhr.responseText?.slice(0, 400) || '')
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText)
          console.log('[ImageKit] uploadFile:success', { fileId: res.fileId, name: res.name, url: res.url })
          // 直接刷新列表以与服务端同步
          fetchImages()
        } catch (e) {
          fetchImages()
        }
      } else {
        // 尝试解析服务端错误信息
        try {
          const err = JSON.parse(xhr.responseText)
          setError(`上传失败：${err.message || xhr.status}`)
          console.error('[ImageKit] uploadFile:error_parsed', err)
        } catch {
          setError(`上传失败：${xhr.status}`)
          console.error('[ImageKit] uploadFile:error_status', xhr.status)
        }
      }
    }

    xhr.onerror = () => {
      setUploading(false)
      setUploadProgress(0)
      setError('网络错误，上传失败')
      console.error('[ImageKit] uploadFile:xhr_error')
    }

    xhr.send(formData)
  }

  // 原“插入”外链功能已移除：handleInsertClick

  // 原“插入”外链功能已移除：insertByUrl

  // 仅应用最后一次请求结果，避免并发刷新覆盖
  const latestFetchSeq = useRef(0)

  const fetchImages = async () => {
    latestFetchSeq.current += 1
    const seq = latestFetchSeq.current
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(IMAGEKIT_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(PRIVATE_KEY + ':')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ImageKitFile[] = await response.json()
      const sorted = sortByCreatedAtDesc(data)
      console.debug('[List] before sort len=', Array.isArray(data) ? data.length : 'n/a')
      console.debug('[List] after sort first=', sorted[0]?.name, sorted[0]?.createdAt)
      // 仅更新最后一次发起的请求
      if (seq === latestFetchSeq.current) {
        setImages(sorted)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取图片失败')
      // 模拟数据用于演示
      const mockImages: ImageKitFile[] = [
        {
          fileId: '1',
          name: 'demo1.jpg',
          url: 'https://picsum.photos/300/400?random=1',
          thumbnailUrl: 'https://picsum.photos/300/400?random=1',
          height: 400,
          width: 300,
          size: 102400,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          fileId: '2',
          name: 'demo2.jpg',
          url: 'https://picsum.photos/300/350?random=2',
          thumbnailUrl: 'https://picsum.photos/300/350?random=2',
          height: 350,
          width: 300,
          size: 89600,
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
        },
        {
          fileId: '3',
          name: 'demo3.jpg',
          url: 'https://picsum.photos/300/450?random=3',
          thumbnailUrl: 'https://picsum.photos/300/450?random=3',
          height: 450,
          width: 300,
          size: 115200,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          fileId: '4',
          name: 'demo4.jpg',
          url: 'https://picsum.photos/300/380?random=4',
          thumbnailUrl: 'https://picsum.photos/300/380?random=4',
          height: 380,
          width: 300,
          size: 97200,
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        },
        {
          fileId: '5',
          name: 'demo5.jpg',
          url: 'https://picsum.photos/300/420?random=5',
          thumbnailUrl: 'https://picsum.photos/300/420?random=5',
          height: 420,
          width: 300,
          size: 108800,
          createdAt: new Date().toISOString()
        }
      ]
      const sortedMock = sortByCreatedAtDesc(mockImages)
      if (seq === latestFetchSeq.current) {
        setImages(sortedMock)
      }
    } finally {
      if (seq === latestFetchSeq.current) {
        setLoading(false)
      }
    }
  }

  const openModal = () => {
    setIsModalOpen(true)
    fetchImages()
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setImages([])
    setError(null)
  }

  return (
    <div className="ik-page">
      {/* 顶部操作栏 */}
      <div className="ik-page-topbar">
        <div className="ik-section" style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px'}}>
          <h1 className="ik-text-title">已选择的图片</h1>
          <button
            onClick={openModal}
            className="ik-btn-primary"
          >
            上传 / 选择
          </button>
        </div>
      </div>

      {/* 主页：展示已确认选择的图片 */}
      <div className="ik-section">
        {confirmedImages.length > 0 ? (
          <div className="ik-grid">
            {confirmedImages.map(img => (
              <div key={img.fileId} className="ik-card">
                <img src={img.url} alt={img.name} className="w-full h-40 object-cover" />
                <div className="ik-card-body">
                  <p className="ik-name">{img.name}</p>
                  <div className="ik-meta">{Math.round(img.size/1024)}KB · {img.width}×{img.height}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="ik-loading">
            暂未选择图片，点击右上角“上传 / 选择”打开资源中心
          </div>
        )}
      </div>

      {/* 全屏弹出层 */}
      {isModalOpen && (
        <div className="ik-modal">
          {/* 顶部导航栏（白色） */}
          <div className="ik-topbar">
            <div className="ik-topbar-inner">
              <h1 className="ik-title">图片瀑布流展示</h1>
              <div className="ik-actions">
                {uploading && (
                  <div className="ik-loading-inline"><IconLoader className="ik-icon-spin" size={16} /><span>上传中{uploadProgress ? ` ${uploadProgress}%` : ''}</span></div>
                )}
                {/* 已移除“插入”按钮，保留上传与关闭 */}
                <button
                  onClick={handleUploadClick}
                  className="ik-btn"
                >
                  上传
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={onFileChange}
                />
                <button
                  onClick={closeModal}
                  className="ik-menu-btn"
                >
        <IconX size={28} />
                </button>
              </div>
            </div>
          </div>
          
          {/* 内容区域 */}
          <div
            className="ik-content ik-scrollbar"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              const files = e.dataTransfer.files
              if (files && files.length > 0) {
                // 仅接收图片类型
                const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
                if (imageFiles.length > 0) {
                  addFilesToPending(imageFiles)
                }
              } else {
                // 之前支持拖拽文本 URL 进行外链插入，现已移除
                // const url = e.dataTransfer.getData('text')
                // if (url) insertByUrl(url)
              }
            }}
          >
            <div className="ik-container" style={{paddingBottom:24}}>
              {isDragging && (
                <div className="ik-overlay-dark"><div className="ik-modal-box" style={{border:'2px dashed rgba(255,255,255,0.6)', background:'rgba(0,0,0,0.6)', color:'#fff', textAlign:'center', padding:40}}>拖拽图片到此处上传</div></div>
              )}
              {loading && (
                <div className="ik-center-64"><div className="ik-loading"><IconLoader className="ik-icon-spin" size={48} /><p>正在加载图片...</p></div></div>
              )}

              {error && (
                <div className="ik-empty"><div className="ik-panel-danger"><p style={{color:'#B91C1C', marginBottom:16}}>{error}</p><button onClick={fetchImages} className="ik-btn-danger">重试</button></div></div>
              )}

              {/* 待上传列表（仅名称与大小），支持单个预览与上传、批量上传 */}
              {pendingItems.length > 0 && (
                <div className="ik-panel" style={{marginBottom:24}}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="ik-text-title">待上传（{pendingItems.length}）</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={uploadAllPending}
                        className="ik-btn-primary"
                        disabled={pendingItems.every(i => i.status !== 'ready')}
                      >
                        上传全部
                      </button>
                    </div>
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:8}}>
                    {pendingItems.map(item => (
                      <div key={item.id} className="ik-card" style={{display:'flex', alignItems:'center', gap:12, padding:'8px 12px'}}>
                        <div className="flex-1">
                          <div className="ik-name">{item.name}</div>
                          <div className="ik-text-muted" style={{fontSize:12}}>{Math.round(item.size / 1024)}KB</div>
                        </div>
                        <div className="w-40">
                          {item.status === 'uploading' ? (
                            <div className="ik-progress-track"><div className="ik-progress-bar" style={{ width: `${item.progress}%` }} /></div>
                          ) : item.status === 'success' ? (
                            <span className="ik-text-muted" style={{color:'#16A34A', fontSize:12}}>已上传</span>
                          ) : item.status === 'error' ? (
                            <span style={{color:'#DC2626', fontSize:12}}>{item.error || '错误'}</span>
                          ) : (
                            <span className="ik-text-muted" style={{fontSize:12}}>待上传</span>
                          )}
                        </div>
                        <div style={{display:'flex', alignItems:'center', gap:8}}>
                          <button
                            onClick={() => openFilePreview(item.file)}
                            className="ik-btn"
                          >
                            预览
                          </button>
                          <button
                            onClick={() => uploadPendingItem(item.id)}
                            className="ik-btn-primary"
                            disabled={item.status !== 'ready'}
                          >
                            上传
                          </button>
                          <button
                            onClick={() => removePendingItem(item.id)}
                            className="ik-btn"
                          >
                            移除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 横向排序网格布局 */}
              {!loading && !error && images.length > 0 && (
                <div className="ik-grid">
                  {images.map((image, index) => (
                    <div key={image.fileId} className="ik-card">
                      <div className="relative">
                        {/* 顶部格式标签 */}
                        <span className="ik-badge">
                          {getFormatFromName(image.name, image.url)}
                        </span>
                        {isVideoFile(image) ? (
                          image.thumbnailUrl ? (
                            <img
                              src={image.thumbnailUrl}
                              alt={image.name}
                              className={`ik-thumb ${selectedIds.has(image.fileId) ? 'ik-thumb-selected' : ''}`}
                              loading="lazy"
                              onClick={() => toggleSelect(image.fileId)}
                              onDoubleClick={() => openPreview(image)}
                            />
                          ) : (
                            <div
                              className={`ik-thumb-placeholder ${selectedIds.has(image.fileId) ? 'ik-thumb-selected' : ''}`}
                              onClick={() => toggleSelect(image.fileId)}
                              onDoubleClick={() => openPreview(image)}
                            >
        <IconPlayCircle className="ik-text-muted" size={36} />
                              <span className="ik-video-label">视频</span>
                            </div>
                          )
                        ) : (
                          <img
                            src={image.url}
                            alt={image.name}
                            className={`ik-thumb ${selectedIds.has(image.fileId) ? 'ik-thumb-selected' : ''}`}
                            loading="lazy"
                            onClick={() => toggleSelect(image.fileId)}
                            onDoubleClick={() => openPreview(image)}
                          />
                        )}
                        {selectedIds.has(image.fileId) && (
                          <>
                            <div className="ik-overlay-selected" />
                            <div className="absolute top-2 right-2 z-10">
                              <div className="ik-check">
                                <IconCheck size={14} />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="ik-card-body">
                        <p className="ik-name">{image.name}</p>
                        <div className="ik-meta">
                          <span className="ik-space">{Math.round(image.size / 1024)}KB</span>
                          <span className="mr-auto">{image.width}×{image.height}</span>
                          {/* 底部右侧操作按钮 */}
                          <div className="ik-menu">
                            <button
                              onClick={() => setActiveMenuId(activeMenuId === image.fileId ? null : image.fileId)}
                              className="ik-menu-btn"
                              aria-label="操作"
                            >
        <IconMoreVertical size={16} />
                            </button>
                            {activeMenuId === image.fileId && (
                              <div className="ik-dropdown">
                                <button onClick={() => handlePreview(image)} className="ik-dropdown-item">
        <IconExternalLink size={14} /> 链接预览
                                </button>
                                <button onClick={() => handleCopy(image)} className="ik-dropdown-item">
        <IconCopy size={14} /> {copiedId === image.fileId ? '已复制' : '复制链接'}
                                </button>
                                <button onClick={() => handleDelete(image)} className="ik-dropdown-item ik-dropdown-danger" disabled={deletingId === image.fileId}>
                                  {deletingId === image.fileId ? (
                                    <>
        <IconLoader className="animate-spin" size={14} /> 删除中...
                                    </>
                                  ) : (
                                    <>
        <IconTrash size={14} /> 删除
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && !error && images.length === 0 && (<div className="ik-empty">暂无图片数据</div>)}
            </div>
            {/* 弹窗底部操作条：取消 / 确定（白色） */}
            <div className="ik-footer">
              <div className="ik-footer-inner">
                <button
                  onClick={closeModal}
                  className="ik-btn"
                >
                  取消
                </button>
                <button
                  onClick={confirmSelection}
                  className="ik-btn-primary"
                  disabled={selectedIds.size === 0}
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 图片放大预览 */}
      {previewImage && (
        <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center" onClick={closePreview}>
          <div className="max-w-[90vw] max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            {isVideoFile(previewImage) ? (
              <video src={previewImage.url} controls className="max-w-full max-h-[80vh]" />
            ) : (
              <img src={previewImage.url} alt={previewImage.name} className="max-w-full max-h-[80vh] object-contain" />
            )}
            <div className="mt-3 text-center text-white text-sm">
              <span className="mr-2 font-medium">{previewImage.name}</span>
              <span>{previewImage.width}×{previewImage.height}</span>
            </div>
            <button
              onClick={closePreview}
              className="mt-4 mx-auto block px-4 py-2 text-white border border-white/30 rounded hover:bg-white/10"
            >
              关闭 (ESC)
            </button>
          </div>
        </div>
      )}
      {/* 选择后预览弹窗 */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-[75] bg-black/90 flex items-center justify-center" onClick={closeFilePreview}>
          <div className="w-[92vw] max-w-3xl bg-white rounded-lg shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-lg font-semibold">上传前预览</h2>
  <button onClick={closeFilePreview} className="p-2 rounded hover:bg-gray-100"><IconX size={18} /></button>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-center bg-gray-50 rounded min-h-[240px]">
                {previewLoading ? (
                  <div className="text-center text-gray-600">
  <IconLoader className="animate-spin mx-auto mb-2" />
                    加载预览中...
                  </div>
                ) : previewUrl ? (
                  <img src={previewUrl} alt="预览" className="max-h-[300px] max-w-full object-contain" />
                ) : (
                  <span className="text-gray-400">无预览</span>
                )}
              </div>
              <div>
                <div className="space-y-2 text-sm text-gray-700">
                  <div><span className="text-gray-500">文件名：</span>{previewFile?.name}</div>
                  <div><span className="text-gray-500">类型：</span>{previewFile?.type || '未知'}</div>
                  <div><span className="text-gray-500">大小：</span>{previewFile ? Math.round(previewFile.size / 1024) + 'KB' : '-'}</div>
                  <div><span className="text-gray-500">尺寸：</span>{previewDims ? `${previewDims.width}×${previewDims.height}` : '-'}</div>
                </div>
                {previewValidationMsg && (
                  <div className="mt-3 text-red-600 text-sm">{previewValidationMsg}</div>
                )}
                <div className="mt-6 flex gap-2">
                  <button
                    onClick={handlePreviewUpload}
                    disabled={!!previewValidationMsg}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    确认上传
                  </button>
                  <button
                    onClick={closeFilePreview}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}