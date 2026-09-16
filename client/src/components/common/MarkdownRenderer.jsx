import { useMemo } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import './MarkdownRenderer.css'

marked.setOptions({
  breaks: true,
  gfm: true
})

marked.use({
  renderer: {
    link(token) {
      const href = token.href || ''
      const title = token.title ? ` title="${token.title}"` : ''
      const text = token.text || href
      return `<a href="${href}"${title} target="_blank" rel="noopener noreferrer" class="md-link">${text}</a>`
    },
    image(token) {
      const href = token.href || ''
      const title = token.title ? ` title="${token.title}"` : ''
      const alt = token.text ? ` alt="${token.text}"` : ' alt="image"'
      return `<div class="md-image-wrap"><img src="${href}"${alt}${title} loading="lazy" class="md-image" /></div>`
    }
  }
})

export default function MarkdownRenderer({ content = '', className = '' }) {
  const cleanHtml = useMemo(() => {
    if (!content || typeof content !== 'string') return ''
    try {
      const hasHtmlTags = /<\/?(?:p|div|span|h[1-6]|ul|ol|li|strong|em|b|i|u|s|blockquote|pre|code|a|img|table|tr|td|th|br|hr)\b/i.test(content)
      const rawHtml = hasHtmlTags ? content : marked.parse(content)
      return DOMPurify.sanitize(rawHtml, {
        ADD_ATTR: ['target', 'rel', 'loading'],
        ADD_TAGS: ['img']
      })
    } catch {
      return DOMPurify.sanitize(content)
    }
  }, [content])

  if (!content) return null

  return (
    <div
      className={`glug-markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  )
}
