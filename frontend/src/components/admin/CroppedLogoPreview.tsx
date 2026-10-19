import OrganizationLogo, { type LogoSizeVariant } from '@/components/shared/OrganizationLogo'
import { type LogoCrop } from '@/demo/studentDemoData'

interface CroppedLogoPreviewProps {
  src: string | null
  crop?: LogoCrop | null
  alt?: string
  size: 'table' | 'card' | 'detail' | 'custom' | LogoSizeVariant
  className?: string
  customSize?: { width: number; height: number; rounded?: string }
  organization?: string
}

export default function CroppedLogoPreview({
  src,
  crop,
  alt = 'Organization logo',
  size,
  className = '',
  customSize,
  organization,
}: CroppedLogoPreviewProps) {
  const mappedSize: LogoSizeVariant =
    size === 'table' ? 'adminTable' : (size as LogoSizeVariant)

  return (
    <OrganizationLogo
      src={src}
      crop={crop}
      alt={alt}
      size={mappedSize}
      className={className}
      customSize={customSize}
      organization={organization}
    />
  )
}
