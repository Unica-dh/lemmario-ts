/**
 * LexicalRenderer - Renderer for Payload Lexical richtext
 * Converts Lexical JSON format to React elements with academic styling
 */

import Image from 'next/image'

interface UploadValue {
  id: number
  alt?: string
  url?: string
  width?: number
  height?: number
  mimeType?: string
  filename?: string
}

export interface LexicalNode {
  type: string
  tag?: string
  text?: string
  children?: LexicalNode[]
  format?: string | number
  version?: number
  value?: UploadValue
  relationTo?: string
  fields?: {
    url?: string
    linkType?: 'custom' | 'internal'
    newTab?: boolean
    doc?: { value: string; relationTo: string }
  }
}

export interface LexicalContent {
  root: {
    type: string
    children: LexicalNode[]
    direction?: string
    format?: string
    indent?: number
    version?: number
  }
}

interface LexicalRendererProps {
  content?: LexicalContent
  className?: string
}

function renderTextNode(node: LexicalNode, index: number): React.ReactNode {
  let text: React.ReactNode = node.text || ''

  // Handle Lexical text format bitmask
  const format = typeof node.format === 'number' ? node.format : 0
  if (format & 1) text = <strong key={`b-${index}`}>{text}</strong>
  if (format & 2) text = <em key={`i-${index}`}>{text}</em>
  if (format & 8) text = <s key={`s-${index}`}>{text}</s>
  if (format & 16) text = <code key={`c-${index}`} className="px-1.5 py-0.5 bg-[var(--color-bg-subtle)] text-sm rounded">{text}</code>

  return text
}

function renderNode(node: LexicalNode, index: number): React.ReactNode {
  // Text node
  if (node.type === 'text') {
    return renderTextNode(node, index)
  }

  // Line break
  if (node.type === 'linebreak') {
    return <br key={index} />
  }

  // Paragraph
  if (node.type === 'paragraph') {
    return (
      <p key={index} className="font-sans text-base text-[var(--color-text-body)] leading-relaxed mb-5">
        {node.children?.map((child, i) => renderNode(child, i))}
      </p>
    )
  }

  // Headings
  if (node.type === 'heading') {
    const Tag = (node.tag || 'h2') as keyof JSX.IntrinsicElements
    const className = Tag === 'h2'
      ? 'font-serif text-2xl font-bold text-[var(--color-text)] mb-4 mt-10'
      : 'font-serif text-xl font-bold text-[var(--color-text)] mb-3 mt-8'
    return (
      <Tag key={index} className={className}>
        {node.children?.map((child, i) => renderNode(child, i))}
      </Tag>
    )
  }

  // Blockquote
  if (node.type === 'quote') {
    return (
      <blockquote
        key={index}
        className="pl-5 border-l-2 border-[var(--color-border)] my-6 font-serif italic text-[var(--color-text-body)]"
      >
        {node.children?.map((child, i) => renderNode(child, i))}
      </blockquote>
    )
  }

  // List
  if (node.type === 'list') {
    const isOrdered = node.tag === 'ol'
    const ListTag = isOrdered ? 'ol' : 'ul'
    return (
      <ListTag
        key={index}
        className={`mb-5 space-y-1.5 pl-6 ${isOrdered ? 'list-decimal' : 'list-disc'} text-[var(--color-text-body)]`}
      >
        {node.children?.map((child, i) => renderNode(child, i))}
      </ListTag>
    )
  }

  // List item
  if (node.type === 'listitem') {
    return (
      <li key={index} className="font-sans text-base leading-relaxed">
        {node.children?.map((child, i) => renderNode(child, i))}
      </li>
    )
  }

  // Link and Autolink
  if (node.type === 'link' || node.type === 'autolink') {
    const url = node.fields?.url || '#'
    const newTab = node.fields?.newTab || url.startsWith('http')
    return (
      <a
        key={index}
        href={url}
        className="text-[var(--color-text)] underline underline-offset-2 decoration-[var(--color-border)] hover:decoration-[var(--color-text)] transition-colors"
        target={newTab ? '_blank' : undefined}
        rel={newTab ? 'noopener noreferrer' : undefined}
      >
        {node.children?.map((child, i) => renderNode(child, i))}
      </a>
    )
  }

  // Upload (image in rich text)
  if (node.type === 'upload' && node.value) {
    const { alt, url, width, height, mimeType } = node.value
    if (!url) return null

    // Extract /media/... pathname from absolute URL — the Next.js rewrite
    // in next.config.js proxies /media/* to the Payload backend, so relative
    // paths work in both dev (Docker) and production without hostname issues.
    let mediaSrc = url
    try {
      const parsed = new URL(url)
      if (parsed.pathname.startsWith('/media/')) {
        mediaSrc = parsed.pathname
      }
    } catch {
      // If URL parsing fails, use as-is
    }

    const isSvg = mimeType === 'image/svg+xml'

    if (isSvg) {
      return (
        <figure key={index} className="my-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaSrc}
            alt={alt || ''}
            className="max-w-full h-auto mx-auto"
          />
        </figure>
      )
    }

    return (
      <figure key={index} className="my-6">
        <Image
          src={mediaSrc}
          alt={alt || ''}
          width={width || 800}
          height={height || 600}
          className="max-w-full h-auto mx-auto"
          sizes="(max-width: 768px) 100vw, 800px"
        />
      </figure>
    )
  }

  // Horizontal rule
  if (node.type === 'horizontalrule') {
    return <hr key={index} className="my-8 border-[var(--color-border)]" />
  }

  // Default: render children
  if (node.children) {
    return <span key={index}>{node.children.map((child, i) => renderNode(child, i))}</span>
  }

  return null
}

export function LexicalRenderer({ content, className = '' }: LexicalRendererProps) {
  if (!content?.root?.children) {
    return null
  }

  return (
    <div className={`max-w-none ${className}`}>
      {content.root.children.map((node, index) => renderNode(node, index))}
    </div>
  )
}
