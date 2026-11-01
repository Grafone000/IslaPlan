import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { MessageNode } from '@/domain/messageBody';
import { MessageBody } from './MessageBody';

afterEach(cleanup);

const doc = (...content: MessageNode[]): MessageNode => ({ type: 'doc', content });
const paragraph = (...content: MessageNode[]): MessageNode => ({ type: 'paragraph', content });

describe('MessageBody', () => {
  it('renders bold, italic and lists', () => {
    render(
      <MessageBody
        body={doc(
          paragraph(
            { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
            { type: 'text', text: 'italic', marks: [{ type: 'italic' }] },
          ),
          {
            type: 'bulletList',
            content: [{ type: 'listItem', content: [paragraph({ type: 'text', text: 'item' })] }],
          },
        )}
      />,
    );
    expect(screen.getByText('bold').tagName).toBe('STRONG');
    expect(screen.getByText('italic').tagName).toBe('EM');
    expect(screen.getByRole('listitem').textContent).toBe('item');
  });

  it('opens safe links in a new tab', () => {
    render(
      <MessageBody
        body={doc(
          paragraph({
            type: 'text',
            text: 'site',
            marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
          }),
        )}
      />,
    );
    const link = screen.getByRole('link', { name: 'site' });
    expect(link.getAttribute('href')).toBe('https://example.com');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('drops an unsafe link but keeps its text', () => {
    render(
      <MessageBody
        body={doc(
          paragraph({
            type: 'text',
            text: 'click',
            marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }],
          }),
        )}
      />,
    );
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('click')).toBeTruthy();
  });

  it('shows markup as plain text', () => {
    const { container } = render(
      <MessageBody body={doc(paragraph({ type: 'text', text: '<img src=x onerror=alert(1)>' }))} />,
    );
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeTruthy();
  });
});
