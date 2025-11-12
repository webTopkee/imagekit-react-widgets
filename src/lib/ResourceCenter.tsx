import React, { useEffect, useMemo, useRef, useState } from 'react'
import { X, Loader2, MoreVertical, Copy, Trash2, ExternalLink, Check, PlayCircle, LinkIcon } from './icons'
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
function isImageExt(ext: string, allowed: string[]) { return allowed.includes(ext.toLowerCase()) }
function isImageFile(file: ImageKitFile, allowed: string[]) { return isImageExt(getExtLower(file.name, file.url), allowed) }
function formatFromName(name: string, url?: string) { const ext = getExtLower(name, url); return ext ? ext.toUpperCase() : 'FILE' }

export const ResourceCenter: React.FC<ResourceCenterProps> = (props) => {
  const {
    open = false,
    onOpenChange,
    onConfirm,
    onError,
    listEndpoint,
    folderPath,
    uploadEndpoint,
    privateKey,
    uploadFolder,
    uploadTags = [],
    maxFileSize = 10 * 1024 * 1024,
    allowedTypes = DEFAULT_ALLOWED_TYPES,
    allowedExts = DEFAULT_ALLOWED_EXTS,
    enableDelete = true,
    enableUpload = true,
    multiSelect = true,
    theme = 'light',
    title
  } = props
  // Default upload folder to folderPath when uploadFolder not explicitly provided
  const isUploadFolderProvided = Object.prototype.hasOwnProperty.call(props, 'uploadFolder')
  const effectiveUploadFolder = isUploadFolderProvided ? (uploadFolder || '') : (folderPath || '')
  const [images, setImages] = useState<ImageKitFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pageSize = 30
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [previewImage, setPreviewImage] = useState<ImageKitFile | null>(null)
  const previewVideoRef = useRef<HTMLVideoElement | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  // refs to support closing "more" dropdown on outside click
  const activeMenuBtnRef = useRef<HTMLButtonElement | null>(null)
  const activeDropdownRef = useRef<HTMLDivElement | null>(null)
  // Upload modal states
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadSelections, setUploadSelections] = useState<File[]>([])
  const [uploadProgressMap, setUploadProgressMap] = useState<Record<string, number>>({})
  const getFileKey = (file: File) => `${file.name}_${file.size}_${file.lastModified}`
  // helper: small delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const fetchImages = async (append = false) => {
    if (!append) setLoading(true)
    else setLoadingMore(true)
    setError(null)
    try {
      const skip = append ? images.length : 0
      // Build base list endpoint: default to ImageKit files API if not provided
      const baseList = listEndpoint ?? 'https://api.imagekit.io/v1/files'
      // If folderPath provided, auto-append path filter unless endpoint already contains path=
      const sepBase = baseList.includes('?') ? '&' : '?'
      const hasPathParam = /[?&]path=/.test(baseList)
      const pathPart = folderPath && !hasPathParam ? `path=${encodeURIComponent(folderPath)}&` : ''
      // Add cache-busting to ensure latest list after uploads
      const url = `${baseList}${sepBase}${pathPart}skip=${skip}&limit=${pageSize}&sort=DESC_CREATED&cb=${Date.now()}`
      const response = await fetch(url, {
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
      if (append) {
        setImages(prev => [...prev, ...files])
      } else {
        setImages(files)
      }
      setHasMore(files.length >= pageSize)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '列表加载失败'
      setError(msg); onError?.(msg)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    if (open) {
      // 重新打开资源中心时清空之前的选择
      setSelectedIds(new Set())
      setActiveMenuId(null)
      setPreviewImage(null)
      // 重置列表并重新拉取
      setImages([])
      setHasMore(true)
      fetchImages(false)
    }
  }, [open])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const { scrollTop, clientHeight, scrollHeight } = target
    if (hasMore && !loadingMore && scrollTop + clientHeight >= scrollHeight - 10) {
      fetchImages(true)
    }
  }
  const loadMore = () => { if (hasMore && !loadingMore) fetchImages(true) }

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
    setUploadSelections(prev => [...prev, ...fileList])
    setShowUploadModal(true)
    // reset input value to allow re-selecting the same files if needed
    e.currentTarget.value = ''
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
    if (effectiveUploadFolder) formData.append('folder', effectiveUploadFolder)
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
      // 延迟 1500ms 后刷新列表（只刷新一次）
      await delay(1500)
      await fetchImages(false)
    } catch (err) {
      const msg = err instanceof Error ? `上传失败：${err.message}` : '上传失败'
      setError(msg); onError?.(msg)
      setUploading(false); setUploadProgress(0)
    }
  }

  // batch upload using XMLHttpRequest to support per-file progress
  const uploadFileXHR = (file: File) => new Promise<void>((resolve, reject) => {
    const key = getFileKey(file)
    const xhr = new XMLHttpRequest()
    xhr.open('POST', uploadEndpoint, true)
    xhr.setRequestHeader('Authorization', `Basic ${btoa(privateKey + ':')}`)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100)
        setUploadProgressMap(prev => ({ ...prev, [key]: pct }))
        // update aggregated progress in topbar
        const vals = Object.values({ ...uploadProgressMap, [key]: pct })
        const total = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : pct
        setUploadProgress(total)
      }
    }
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgressMap(prev => ({ ...prev, [key]: 100 }))
          resolve()
        } else {
          let msg = '上传失败'
          try { const j = JSON.parse(xhr.responseText); msg = j.message || msg } catch {}
          reject(new Error(msg))
        }
      }
    }
    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileName', file.name)
    formData.append('useUniqueFileName', 'true')
    if (effectiveUploadFolder) formData.append('folder', effectiveUploadFolder)
    if (uploadTags.length) formData.append('tags', uploadTags.join(','))
    xhr.send(formData)
  })

  const removeSelection = (key: string) => {
    setUploadSelections(prev => prev.filter(f => getFileKey(f) !== key))
    setUploadProgressMap(prev => { const n = { ...prev }; delete n[key]; return n })
  }

  const startBatchUpload = async () => {
    if (!uploadSelections.length) return
    setUploading(true); setUploadProgress(0); setError(null)
    try {
      for (const file of uploadSelections) {
        // basic validations per file
        if (file.size > maxFileSize) { const msg = `文件过大：${file.name}`; setError(msg); onError?.(msg); continue }
        if (!allowedTypes.includes(file.type)) { const msg = `不支持的文件类型：${file.name}`; setError(msg); onError?.(msg); continue }
        const key = getFileKey(file)
        setUploadProgressMap(prev => ({ ...prev, [key]: 0 }))
        await uploadFileXHR(file)
      }
      // all done
      // 上传全部完成后延迟 3500ms 关闭上传窗口，并刷新列表（只刷新一次）
      await delay(3500)
      setShowUploadModal(false)
      setUploadSelections([])
      setUploadProgressMap({})
      await fetchImages(false)
    } catch (err) {
      const msg = err instanceof Error ? `上传失败：${err.message}` : '上传失败'
      setError(msg); onError?.(msg)
    } finally {
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
      const delBase = (listEndpoint ?? 'https://api.imagekit.io/v1/files').split('?')[0]
      const resp = await fetch(`${delBase}/${image.fileId}`, {
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

  // close active menu when clicking anywhere outside of the active dropdown and its trigger button
  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!activeMenuId) return
      const target = e.target as Node
      const btnEl = activeMenuBtnRef.current
      const ddEl = activeDropdownRef.current
      if (ddEl && ddEl.contains(target)) return
      if (btnEl && btnEl.contains(target)) return
      setActiveMenuId(null)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [activeMenuId])

  if (!open) return null

  return (
    <div className="ik-modal">
      {showUploadModal && (
        <div className="ik-overlay-dark" onClick={() => setShowUploadModal(false)}>
          <div className="ik-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="ik-modal-header">
              <h2 className="ik-title">上传队列</h2>
              <div className="ik-actions">
                {uploading && (
                  <div className="ik-loading-inline">
                    <Loader2 className="ik-icon-spin" size={16} />
                    <span>上传中{uploadProgress ? ` ${uploadProgress}%` : ''}</span>
                  </div>
                )}
                <button className="ik-btn-close" aria-label="关闭上传窗口" onClick={() => setShowUploadModal(false)}>
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="ik-modal-body">
              <div className="ik-upload-list ik-scrollbar ik-scrollbar-thin">
                {uploadSelections.length === 0 && (
                  <div className="ik-empty">暂无选择的图片</div>
                )}
                {uploadSelections.map((f) => {
                  const key = getFileKey(f)
                  const pct = uploadProgressMap[key] ?? 0
                  const url = URL.createObjectURL(f)
                  return (
                    <div className="ik-upload-item ik-card" key={key}>
                      <img src={url} alt={f.name} className="ik-upload-thumb" />
                      <div className="ik-upload-info">
                        <div className="ik-upload-name">{f.name}</div>
                        <div className="ik-upload-meta">{Math.round(f.size/1024)}KB</div>
                        <div className="ik-upload-progress">
                          <div className="ik-progress-track">
                            <div className="ik-progress-bar" style={{ width: pct + '%' }} />
                          </div>
                        </div>
                      </div>
                      <button className="ik-btn" onClick={() => removeSelection(key)} disabled={uploading}>删除</button>
                    </div>
                  )
                })}
              </div>
              <div className="ik-actions" style={{ marginTop: 12, justifyContent: 'flex-end' }}>
                <button onClick={handleUploadClick} className="ik-btn">继续添加</button>
                <button onClick={startBatchUpload} className="ik-btn-primary" disabled={!uploadSelections.length || uploading}>确定</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {previewImage && (
        <div className="ik-overlay-dark" onClick={closePreview}>
          <div className="ik-preview-box" onClick={(e) => e.stopPropagation()}>
            <button className="ik-btn-close ik-preview-close" aria-label="关闭预览" onClick={closePreview}>
              <X size={20} />
            </button>
            {isVideoFile(previewImage) ? (
              previewImage.url ? (
                <video
                  ref={previewVideoRef}
                  className="ik-preview-video"
                  src={previewImage.url}
                  controls
                  autoPlay
                  muted
                  onDoubleClick={() => {
                    const v = previewVideoRef.current
                    if (v) {
                      if (v.paused) v.play().catch(() => {})
                      else v.pause()
                    }
                  }}
                />
              ) : (
                <div className="ik-preview-placeholder">
                  <PlayCircle size={42} />
                  <span>该视频无法预览</span>
                </div>
              )
            ) : isImageFile(previewImage, allowedExts) ? (
              <img src={previewImage.url} alt={previewImage.name} className="ik-preview-img" />
            ) : (
              <div className="ik-preview-placeholder">
                <LinkIcon size={32} />
                <span>该文件不可预览</span>
              </div>
            )}
          </div>
        </div>
      )}
      {/* 顶部导航栏 */}
      <div className="ik-topbar">
        <div className="ik-topbar-inner">
          <h1 className="ik-title">{title ?? '资源中心'}</h1>
          <div className="ik-actions">
            {enableUpload && (
              <button onClick={handleUploadClick} className="ik-btn">上传</button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={onFileChange} />
            <button onClick={() => onOpenChange?.(false)} className="ik-btn-close" aria-label="关闭">
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div
        className={isDragging ? "ik-content ik-scrollbar ik-scrollbar-thin ik-drop-active" : "ik-content ik-scrollbar ik-scrollbar-thin"}
        onScroll={handleScroll}
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
        <div className="ik-container">
          {loading && (
            <div className="ik-loading">
              <Loader2 className="ik-icon-spin" />
              加载中...
            </div>
          )}
          {error && (
            <div className="ik-error">{error}</div>
          )}
          {!loading && !error && images.length === 0 && (
            <div className="ik-empty">暂无文件</div>
          )}

          {!loading && !error && images.length > 0 && (
            <div className="ik-grid">
              {images.map((image) => (
                <div key={image.fileId} className="ik-card">
                  <div className="ik-card-header">
                    <span className="ik-badge">
                      {formatFromName(image.name, image.url)}
                    </span>
                    {isVideoFile(image) ? (
                      image.thumbnailUrl ? (
                        <img src={image.thumbnailUrl} alt={image.name} className={selectedIds.has(image.fileId) ? 'ik-thumb ik-thumb-selected' : 'ik-thumb'} loading="lazy" onClick={() => toggleSelect(image.fileId)} onDoubleClick={() => openPreview(image)} />
                      ) : (
                        <div className={selectedIds.has(image.fileId) ? 'ik-thumb ik-thumb-selected ik-thumb-placeholder ik-thumb-video' : 'ik-thumb ik-thumb-placeholder ik-thumb-video'} onClick={() => toggleSelect(image.fileId)} onDoubleClick={() => openPreview(image)}>
                          <PlayCircle size={36} />
                          <span className="ik-video-label">视频</span>
                        </div>
                      )
                    ) : isImageFile(image, allowedExts) ? (
                      <img src={image.url} alt={image.name} className={selectedIds.has(image.fileId) ? 'ik-thumb ik-thumb-selected' : 'ik-thumb'} loading="lazy" onClick={() => toggleSelect(image.fileId)} onDoubleClick={() => openPreview(image)} />
                    ) : (
                      <div className={selectedIds.has(image.fileId) ? 'ik-thumb ik-thumb-selected ik-thumb-placeholder ik-thumb-file' : 'ik-thumb ik-thumb-placeholder ik-thumb-file'} onClick={() => toggleSelect(image.fileId)} onDoubleClick={() => openPreview(image)}>
                        <LinkIcon size={24} />
                        <span className="ik-file-label">{formatFromName(image.name, image.url)}</span>
                      </div>
                    )}
                    {selectedIds.has(image.fileId) && (
                      <>
                        <div className="ik-overlay-selected" />
                        <div className="ik-check">
                          <Check size={14} />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="ik-card-body">
                    <p className="ik-name">{image.name}</p>
                    <div className="ik-meta">
                      <span className="ik-space">{Math.round(image.size / 1024)}KB</span>
                      <span className="ik-flex-grow">{image.width}×{image.height}</span>
                      <div className="ik-menu">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === image.fileId ? null : image.fileId)}
                          className="ik-menu-btn"
                          aria-label="操作"
                          ref={activeMenuId === image.fileId ? activeMenuBtnRef : undefined}
                        >
                          <MoreVertical size={16} />
                        </button>
                        {activeMenuId === image.fileId && (
                          <div className="ik-dropdown" ref={activeMenuId === image.fileId ? activeDropdownRef : undefined}>
                            <button onClick={() => handlePreviewLink(image)} className="ik-dropdown-item">
                              <ExternalLink size={14} /> 链接预览
                            </button>
                            <button onClick={() => handleCopy(image)} className="ik-dropdown-item">
                              <Copy size={14} /> 复制链接
                            </button>
                            {enableDelete && (
                              <button onClick={() => handleDelete(image)} className="ik-dropdown-item ik-dropdown-danger">
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

          {!loading && !error && (
            <>
              {loadingMore && <div className="ik-list-status">加载中...</div>}
              {!loadingMore && hasMore && (
                <div className="ik-load-more-area">
                  <button className="ik-btn" onClick={loadMore}>加载更多</button>
                </div>
              )}
              {!hasMore && images.length > 0 && <div className="ik-list-status">已加载全部</div>}
            </>
          )}
        </div>
      </div>

      {/* 底部操作条 */}
      <div className="ik-footer">
        <div className="ik-footer-inner">
          <button onClick={() => onOpenChange?.(false)} className="ik-btn">取消</button>
          <button onClick={confirm} className="ik-btn-primary">确定</button>
        </div>
      </div>
    </div>
  )
}

export default ResourceCenter