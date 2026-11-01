// Message bodies are stored as TipTap JSON, never as HTML. Only what the composer offers is
// allowed, and the server rejects anything else, so a stored body is always safe to render.

export interface MessageMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface MessageNode {
  type: string;
  text?: string;
  marks?: MessageMark[];
  content?: MessageNode[];
  attrs?: Record<string, unknown>;
}

const ALLOWED_NODES = new Set([
  'doc',
  'paragraph',
  'text',
  'hardBreak',
  'bulletList',
  'orderedList',
  'listItem',
]);

const SAFE_LINK = /^(https?:|mailto:)/i;
const MAX_BODY_LENGTH = 100_000;

export const isSafeLink = (href: unknown): href is string =>
  typeof href === 'string' && SAFE_LINK.test(href.trim());

function isValidMark(mark: unknown): boolean {
  if (typeof mark !== 'object' || mark === null) {
    return false;
  }
  const { type, attrs } = mark as MessageMark;
  if (type === 'bold' || type === 'italic') {
    return true;
  }
  return type === 'link' && isSafeLink(attrs?.href);
}

function isValidNode(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { type, text, marks, content } = value as MessageNode;
  return (
    ALLOWED_NODES.has(type) &&
    (text === undefined || typeof text === 'string') &&
    (marks === undefined || (Array.isArray(marks) && marks.every(isValidMark))) &&
    (content === undefined || (Array.isArray(content) && content.every(isValidNode)))
  );
}

export function isMessageBody(value: unknown): value is MessageNode {
  return (
    isValidNode(value) &&
    (value as MessageNode).type === 'doc' &&
    JSON.stringify(value).length <= MAX_BODY_LENGTH
  );
}

export function bodyToText(node: MessageNode): string {
  if (node.type === 'text') {
    return node.text ?? '';
  }
  if (node.type === 'hardBreak') {
    return '\n';
  }
  const children = node.content ?? [];
  const separator = ['doc', 'bulletList', 'orderedList'].includes(node.type) ? '\n' : '';
  return children.map(bodyToText).join(separator);
}
