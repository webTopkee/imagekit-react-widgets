import React, { useEffect, useMemo, useRef, useState } from 'react'
import { X, Loader2, MoreVertical, Copy, Trash2, ExternalLink, Check, PlayCircle } from 'lucide-react'
import type { ImageKitFile, ResourceCenterProps } from './types'

const DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp']
const DEFAULT_ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']
const VIDEO_EXTS = ['mp4', 'webm', 'ogv', 'mov', 'avi', 'wmv', 'flv', 'mkv', 'mpeg', 'mpg']

function getExtLower(name: string, url?: string) {
  const tryFrom = (s: string) => s.split('?')[0].split('.').pop()?.toLowerCase() || ''
  const extFromName = tryFrom(name)
  if (extFromName) return extFromName
  if (url) {
    const extFromUrl = tryFrom(url)
    if (extFromUrl) return extFromUrl
  }
  return ''
}
function isVideoExt(ext: string) { return VIDEO_EXTS.includes(ext.toLowerCase()) }
function isVideoFile(file: ImageKitFile) { return isVideoExt(getExtLower(file.name, file.url)) }
function formatFromName(name: string, url?: string) { const ext = getExtLower(name, url); return ext ? ext.toUpperCase() : 'FILE' }

export const ResourceCenter: React.FC<ResourceCenterProps> = ({
  open = false,
  onOpenChange,
  onConfirm,
  onError,
  listEndpoint,
  uploadEndpoint,
  privateKey,
  uploadFolder = '',
  uploadTags = [],
  maxFileSize = 10 * 1024 * 1024,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  allowedExts = DEFAULT_ALLOWED_EXTS,
  enableDelete = true,
  enableUpload = true,
  multiSelect = true,
  theme = 'light'
}) => {
  const [images, setImages] = useState<ImageKitFile[]>([])
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

  const sortByCreatedAtDesc = (arr: ImageKitFile[]) =>
    arr.slice().sort((a, b) => {
      const ta = new Date(a.createdAt).getTime() || 0
      const tb = new Date(b.createdAt).getTime() || 0
      if (tb !== ta) return tb - ta
      return a.fileId.localeCompare(b.fileId)
    })

  const fetchImages = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(listEndpoint, {
        method: 'GET',
        headers: { 'Authorization': `Basic ${btoa(privateKey + ':')}`, 'Content-Type': 'application/json' }
      })
      if (!response.ok) {
        let msg = `HTTP ${response.status}`
        try { const j = await response.json(); msg = j.message || msg } catch {}
        throw new Error(msg)
      }
      const res = await response.json()
      const files: ImageKitFile[] = (res.files || res) as ImageKitFile[]
      setImages(sortByCreatedAtDesc(files))
    } catch (err) {
      const msg = err instanceof Error ? err.message : '列表加载失败'
      setError(msg); onError?.(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (open) fetchImages() }, [open])

  const toggleSelect = (id: string) => {
    if (!multiSelect) {
      setSelectedIds(new Set([id]))
      return
    }
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const openPreview = (image: ImageKitFile) => setPreviewImage(image)
  const closePreview = () => setPreviewImage(null)

  const handleUploadClick = () => { fileInputRef.current?.click() }
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !files.length) return
    const fileList = Array.from(files)
    uploadFiles(fileList)
  }

  const uploadFiles = async (files: File[]) => {
    if (!files.length) return
    const file = files[0] // simple: single upload in library; multi-upload can be added later
    let errorMsg: string | null = null
    if (file.size > maxFileSize) errorMsg = `文件过大，最大支持 ${Math.round(maxFileSize/1024/1024)}MB`
    else if (!allowedTypes.includes(file.type)) errorMsg = '不支持的文件类型，仅支持图片'
    if (errorMsg) { setError(errorMsg); onError?.(errorMsg); return }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileName', file.name)
    formData.append('useUniqueFileName', 'true')
    if (uploadFolder) formData.append('folder', uploadFolder)
    if (uploadTags.length) formData.append('tags', uploadTags.join(','))

    setUploading(true); setUploadProgress(0); setError(null)

    try {
      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${btoa(privateKey + ':')}` },
        body: formData,
      })
      setUploading(false); setUploadProgress(0)
      if (!response.ok) {
        let msg = `HTTP ${response.status}`
        try { const j = await response.json(); msg = j.message || msg } catch {}
        throw new Error(msg)
      }
      await fetchImages()
    } catch (err) {
      const msg = err instanceof Error ? `上传失败：${err.message}` : '上传失败'
      setError(msg); onError?.(msg)
      setUploading(false); setUploadProgress(0)
    }
  }

  const confirm = () => {
    const selected = images.filter(img => selectedIds.has(img.fileId))
    onConfirm?.(selected)
    onOpenChange?.(false)
  }

  const handleCopy = async (image: ImageKitFile) => {
    try {
      await navigator.clipboard.writeText(image.url)
      setCopiedId(image.fileId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {}
  }

  const handlePreviewLink = (image: ImageKitFile) => {
    window.open(image.url, '_blank', 'noopener,noreferrer')
  }

  const handleDelete = async (image: ImageKitFile) => {
    if (!enableDelete) return
    const confirmDelete = window.confirm('确认删除该文件？此操作不可恢复。')
    if (!confirmDelete) return
    try {
      const resp = await fetch(`${listEndpoint}/${image.fileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Basic ${btoa(privateKey + ':')}` }
      })
      if (!resp.ok) {
        let msg = `删除失败：HTTP ${resp.status}`
        try { const j = await resp.json(); msg = j.message || msg } catch {}
        setError(msg); onError?.(msg); return
      }
      setImages(prev => prev.filter(i => i.fileId !== image.fileId))
      if (activeMenuId === image.fileId) setActiveMenuId(null)
    } catch (err) {
      const msg = err instanceof Error ? `删除失败：${err.message}` : '删除失败'
      setError(msg); onError?.(msg)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-hidden">
      {/* 顶部导航栏 */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-10 p-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <h1 className="text-gray-900 text-2xl font-bold">资源中心</h1>
          <div className="flex items-center gap-2">
            {uploading && (
              <div className="flex items-center text-gray-700 text-sm mr-2">
                <Loader2 className="animate-spin mr-1 text-gray-600" size={16} />
                <span>上传中{uploadProgress ? ` ${uploadProgress}%` : ''}</span>
              </div>
            )}
            {enableUpload && (
              <button onClick={handleUploadClick} className="text-gray-700 border border-gray-300 hover:border-gray-400 px-3 py-1 rounded-md text-sm hover:bg-gray-50">上传</button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={onFileChange} />
            <button onClick={() => onOpenChange?.(false)} className="text-gray-700 border border-gray-300 hover:border-gray-400 px-3 py-1 rounded-md text-sm hover:bg-gray-50">关闭</button>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div
        className="pt-16 pb-24"
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true) }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false) }}
        onDrop={(e) => {
          e.preventDefault(); e.stopPropagation(); setIsDragging(false)
          const files = e.dataTransfer.files
          const imageFiles = files && files.length ? Array.from(files).filter(f => f.type.startsWith('image/')) : []
          if (imageFiles.length) uploadFiles(imageFiles)
        }}
      >
        <div className="max-w-7xl mx-auto px-4">
          {loading && (
            <div className="text-gray-800 text-center">
              <Loader2 className="animate-spin mx-auto mb-2 text-gray-600" />
              加载中...
            </div>
          )}
          {error && (
            <div className="text-red-700 text-center">{error}</div>
          )}
          {!loading && !error && images.length === 0 && (
            <div className="text-gray-700 text-center">暂无文件</div>
          )}

          {!loading && !error && images.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {images.map((image) => (
                <div key={image.fileId} className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <div className="relative">
                    <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] tracking-wide uppercase px-2 py-1 rounded">
                      {formatFromName(image.name, image.url)}
                    </span>
                    {isVideoFile(image) ? (
                      image.thumbnailUrl ? (
                        <img
                          src={image.thumbnailUrl}
                          alt={image.name}
                          className={`w-full h-48 object-cover cursor-pointer transition-all duration-200 ${selectedIds.has(image.fileId) ? 'ring-2 ring-blue-400 shadow-lg' : 'shadow-md'}`}
                          loading="lazy"
                          onClick={() => toggleSelect(image.fileId)}
                          onDoubleClick={() => openPreview(image)}
                        />
                      ) : (
                        <div
                          className={`w-full h-48 bg-gray-100 flex items-center justify-center cursor-pointer transition-all duration-200 ${selectedIds.has(image.fileId) ? 'ring-2 ring-blue-400 shadow-lg' : 'shadow-md'}`}
                          onClick={() => toggleSelect(image.fileId)}
                          onDoubleClick={() => openPreview(image)}
                        >
                          <PlayCircle className="text-gray-600" size={36} />
                          <span className="ml-2 text-xs text-gray-600">视频</span>
                        </div>
                      )
                    ) : (
                      <img
                        src={image.url}
                        alt={image.name}
                        className={`w-full h-48 object-cover cursor-pointer transition-all duration-200 ${selectedIds.has(image.fileId) ? 'ring-2 ring-blue-400 shadow-lg' : 'shadow-md'}`}
                        loading="lazy"
                        onClick={() => toggleSelect(image.fileId)}
                        onDoubleClick={() => openPreview(image)}
                      />
                    )}
                    {selectedIds.has(image.fileId) && (
                      <>
                        <div className="absolute inset-0 bg-blue-500/25 pointer-events-none" />
                        <div className="absolute top-2 right-2 z-10">
                          <div className="bg-blue-600 text-white rounded-full p-1.5 shadow-lg">
                            <Check size={14} />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-gray-800 text-sm font-medium truncate">{image.name}</p>
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <span className="mr-3">{Math.round(image.size / 1024)}KB</span>
                      <span className="mr-auto">{image.width}×{image.height}</span>
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === image.fileId ? null : image.fileId)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors"
                          aria-label="操作"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {activeMenuId === image.fileId && (
                          <div className="absolute right-0 bottom-6 w-36 bg白色 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                            <button onClick={() => handlePreviewLink(image)} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 text-gray-700">
                              <ExternalLink size={14} /> 链接预览
                            </button>
                            <button onClick={() => handleCopy(image)} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 text-gray-700">
                              <Copy size={14} /> 复制链接
                            </button>
                            {enableDelete && (
                              <button onClick={() => handleDelete(image)} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-red-50 text-red-600">
                                <Trash2 size={14} /> 删除
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 底部操作条 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10 p-3">
        <div className="max-w-7xl mx-auto flex items-center justify-end gap-3">
          <button onClick={() => onOpenChange?.(false)} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">取消</button>
          <button onClick={confirm} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">确定</button>
        </div>
      </div>
    </div>
  )
}

export default ResourceCenter