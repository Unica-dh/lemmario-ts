/**
 * LexicalRenderer - Simple renderer for Payload Lexical richtext
 * Converts Lexical JSON format to React elements
 */

interface LexicalNode {
  type: string
  tag?: string
  text?: string
  children?: LexicalNode[]
  format?: string | number
  version?: number
}

interface LexicalContent {
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

function renderNode(node: LexicalNode, index: number): React.ReactNode {
  // Text node
  if (node.type === 'text') {
    return node.text || ''
  }

  // Paragraph
  if (node.type === 'paragraph') {
    return (
      <p key={index} className="mb-4">
        {node.children?.map((child, i) => renderNode(child, i))}
      </p>
    )
  }

  // Headings
  if (node.type === 'heading') {
    const Tag = (node.tag || 'h2') as keyof JSX.IntrinsicElements
    const className = Tag === 'h2' ? 'text-3xl font-bold mb-4 mt-8' : 'text-2xl font-bold mb-3 mt-6'
    return (
      <Tag key={index} className={className}>
        {node.children?.map((child, i) => renderNode(child, i))}
      </Tag>
    )
  }

  // List
  if (node.type === 'list') {
    const ListTag = node.tag === 'ol' ? 'ol' : 'ul'
    return (
      <ListTag key={index} className="list-disc list-inside mb-4 space-y-2">
        {node.children?.map((child, i) => renderNode(child, i))}
      </ListTag>
    )
  }

  // List item
  if (node.type === 'listitem') {
    return (
      <li key={index} className="ml-4">
        {node.children?.map((child, i) => renderNode(child, i))}
      </li>
    )
  }

  // Link
  if (node.type === 'link') {
    return (
      <a
        key={index}
        href={(node as unknown as { url?: string }).url || '#'}
        className="text-primary-600 hover:underline"
      >
        {node.children?.map((child, i) => renderNode(child, i))}
      </a>
    )
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
    <div className={`prose prose-lg max-w-none ${className}`}>
      {content.root.children.map((node, index) => renderNode(node, index))}
    </div>
  )
}
