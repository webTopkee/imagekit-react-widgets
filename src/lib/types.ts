export interface ImageKitFile {
  fileId: string
  name: string
  url: string
  thumbnailUrl: string
  height: number
  width: number
  size: number
  createdAt: string
}

export interface ResourceCenterProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onConfirm?: (files: ImageKitFile[]) => void
  onError?: (message: string) => void

  /** ImageKit REST list endpoint, e.g. https://api.imagekit.io/v1/files */
  listEndpoint: string
  /** ImageKit upload endpoint, e.g. https://upload.imagekit.io/api/v1/files/upload */
  uploadEndpoint: string
  /** Basic auth private key for ImageKit */
  privateKey: string

  /** Optional default folder for upload, e.g. "/assets" */
  uploadFolder?: string
  /** Optional tags list for upload */
  uploadTags?: string[]

  /** Max file size in bytes, default 10MB */
  maxFileSize?: number
  /** Allowed MIME types for local uploads */
  allowedTypes?: string[]
  /** Allowed file extensions for local uploads */
  allowedExts?: string[]

  /** Show delete action in item menu */
  enableDelete?: boolean
  /** Allow uploading new files */
  enableUpload?: boolean
  /** Enable multi-select */
  multiSelect?: boolean
  /** UI theme: 'light' | 'dark' */
  theme?: 'light' | 'dark'
}