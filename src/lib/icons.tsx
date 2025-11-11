import React from 'react'

interface IconProps {
  size?: number
  className?: string
  stroke?: string
  fill?: string
}

const base = (size?: number) => ({ width: size ?? 16, height: size ?? 16, viewBox: '0 0 24 24' })

export const IconX: React.FC<IconProps> = ({ size, className, stroke = 'currentColor', fill = 'none' }) => (
  <svg {...base(size)} className={className} xmlns="http://www.w3.org/2000/svg" fill={fill} stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 L6 18" />
    <path d="M6 6 L18 18" />
  </svg>
)

export const IconLoader: React.FC<IconProps> = ({ size, className, stroke = 'currentColor', fill = 'none' }) => (
  <svg {...base(size)} className={className} xmlns="http://www.w3.org/2000/svg" fill={fill} stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" opacity="0.25" />
    <path d="M12 3 a9 9 0 0 1 9 9" />
  </svg>
)

export const IconMoreVertical: React.FC<IconProps> = ({ size, className, fill = 'currentColor' }) => (
  <svg {...base(size)} className={className} xmlns="http://www.w3.org/2000/svg" fill={fill}>
    <circle cx="12" cy="5" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="12" cy="19" r="1.8" />
  </svg>
)

export const IconCopy: React.FC<IconProps> = ({ size, className, stroke = 'currentColor', fill = 'none' }) => (
  <svg {...base(size)} className={className} xmlns="http://www.w3.org/2000/svg" fill={fill} stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <rect x="4" y="4" width="11" height="11" rx="2" />
  </svg>
)

export const IconTrash: React.FC<IconProps> = ({ size, className, stroke = 'currentColor', fill = 'none' }) => (
  <svg {...base(size)} className={className} xmlns="http://www.w3.org/2000/svg" fill={fill} stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6 H21" />
    <path d="M8 6 V4 H16 V6" />
    <rect x="6" y="6" width="12" height="14" rx="2" />
  </svg>
)

export const IconExternalLink: React.FC<IconProps> = ({ size, className, stroke = 'currentColor', fill = 'none' }) => (
  <svg {...base(size)} className={className} xmlns="http://www.w3.org/2000/svg" fill={fill} stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 3 H21 V10" />
    <path d="M10 14 L21 3" />
    <rect x="3" y="10" width="11" height="11" rx="2" />
  </svg>
)

export const IconCheck: React.FC<IconProps> = ({ size, className, stroke = 'currentColor', fill = 'none' }) => (
  <svg {...base(size)} className={className} xmlns="http://www.w3.org/2000/svg" fill={fill} stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 L9 17 L4 12" />
  </svg>
)

export const IconPlayCircle: React.FC<IconProps> = ({ size, className, stroke = 'currentColor', fill = 'none' }) => (
  <svg {...base(size)} className={className} xmlns="http://www.w3.org/2000/svg" fill={fill} stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M10 8 L16 12 L10 16 Z" />
  </svg>
)

export const IconLink: React.FC<IconProps> = ({ size, className, stroke = 'currentColor', fill = 'none' }) => (
  <svg {...base(size)} className={className} xmlns="http://www.w3.org/2000/svg" fill={fill} stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 8 a4 4 0 0 1 4 -4 h3 a4 4 0 0 1 0 8 h-3" />
    <path d="M14 16 a4 4 0 0 1 -4 4 h-3 a4 4 0 0 1 0 -8 h3" />
    <path d="M8 12 h8" />
  </svg>
)

// Aliases to match previous lucide-react names for easier migration
export { IconX as X }
export { IconLoader as Loader2 }
export { IconMoreVertical as MoreVertical }
export { IconCopy as Copy }
export { IconTrash as Trash2 }
export { IconExternalLink as ExternalLink }
export { IconCheck as Check }
export { IconPlayCircle as PlayCircle }
export { IconLink as LinkIcon }