import { useEffect } from 'react'
import { assetUrl } from '@/utils/assetUrl'

export function FontLoader() {
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @font-face {
        font-family: 'Nersans One';
        src: url('${assetUrl('/fonts/NersansOne.woff2')}') format('woff2'),
             url('${assetUrl('/fonts/NersansOne.woff')}') format('woff');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return null
}
