import type { ReactNode } from 'react';
import { isSafeLink, type MessageNode } from '@/domain/messageBody';

function renderText(node: MessageNode): ReactNode {
  return (node.marks ?? []).reduce<ReactNode>((rendered, mark) => {
    if (mark.type === 'bold') return <strong>{rendered}</strong>;
    if (mark.type === 'italic') return <em>{rendered}</em>;
    if (mark.type === 'link' && isSafeLink(mark.attrs?.href)) {
      return (
        <a href={mark.attrs.href} target="_blank" rel="noopener noreferrer">
          {rendered}
        </a>
      );
    }
    return rendered;
  }, node.text ?? '');
}

function renderNode(node: MessageNode, key: number): ReactNode {
  const children = node.content?.map(renderNode);
  switch (node.type) {
    case 'text':
      return <span key={key}>{renderText(node)}</span>;
    case 'hardBreak':
      return <br key={key} />;
    case 'paragraph':
      return (
        <p key={key} className="my-1">
          {children}
        </p>
      );
    case 'bulletList':
      return (
        <ul key={key} className="my-1 list-disc pl-6">
          {children}
        </ul>
      );
    case 'orderedList':
      return (
        <ol key={key} className="my-1 list-decimal pl-6">
          {children}
        </ol>
      );
    case 'listItem':
      return <li key={key}>{children}</li>;
    default:
      return <div key={key}>{children}</div>;
  }
}

// Builds React elements from stored JSON, so no stored text can become markup.
export function MessageBody({ body }: { body: MessageNode }) {
  return <div>{body.content?.map(renderNode)}</div>;
}
