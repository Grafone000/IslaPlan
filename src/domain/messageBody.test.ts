import { describe, expect, it } from 'vitest';
import { bodyToText, isMessageBody, isSafeLink, type MessageNode } from './messageBody';

const doc = (...content: MessageNode[]): MessageNode => ({ type: 'doc', content });
const paragraph = (...content: MessageNode[]): MessageNode => ({ type: 'paragraph', content });
const text = (value: string, marks?: MessageNode['marks']): MessageNode => ({
  type: 'text',
  text: value,
  marks,
});

describe('isMessageBody', () => {
  it('accepts everything the composer can produce', () => {
    const body = doc(
      paragraph(
        text('Hello '),
        text('bold', [{ type: 'bold' }]),
        text('italic', [{ type: 'italic' }]),
        text('site', [{ type: 'link', attrs: { href: 'https://example.com' } }]),
        { type: 'hardBreak' },
      ),
      {
        type: 'bulletList',
        content: [{ type: 'listItem', content: [paragraph(text('one'))] }],
      },
      {
        type: 'orderedList',
        content: [{ type: 'listItem', content: [paragraph(text('two'))] }],
      },
    );
    expect(isMessageBody(body)).toBe(true);
  });

  it.each([
    ['a script link', doc(paragraph(text('x', [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }])))],
    ['a data link', doc(paragraph(text('x', [{ type: 'link', attrs: { href: 'data:text/html,x' } }])))],
    ['a link with no address', doc(paragraph(text('x', [{ type: 'link' }])))],
    ['an unknown node', doc({ type: 'image', attrs: { src: 'x' } })],
    ['an unknown mark', doc(paragraph(text('x', [{ type: 'code' }])))],
    ['a nested unknown node', doc(paragraph({ type: 'iframe' }))],
    ['a root that is not a doc', paragraph(text('x'))],
    ['a text that is not a string', doc(paragraph({ type: 'text', text: 1 as never }))],
  ])('rejects %s', (_name, body) => {
    expect(isMessageBody(body)).toBe(false);
  });

  it('rejects a value that is not a document', () => {
    expect(isMessageBody(null)).toBe(false);
    expect(isMessageBody('<script>')).toBe(false);
  });

  it('rejects an oversized body', () => {
    expect(isMessageBody(doc(paragraph(text('x'.repeat(100_001)))))).toBe(false);
  });
});

describe('isSafeLink', () => {
  it('allows web and mail links in any case', () => {
    expect(isSafeLink('https://example.com')).toBe(true);
    expect(isSafeLink('HTTP://example.com')).toBe(true);
    expect(isSafeLink('mailto:a@b.co')).toBe(true);
  });

  it('blocks everything else, even with leading spaces', () => {
    expect(isSafeLink(' javascript:alert(1)')).toBe(false);
    expect(isSafeLink('/relative')).toBe(false);
    expect(isSafeLink(null)).toBe(false);
  });
});

describe('bodyToText', () => {
  it('flattens paragraphs, lists and line breaks', () => {
    const body = doc(
      paragraph(text('Hello'), { type: 'hardBreak' }, text('there')),
      {
        type: 'bulletList',
        content: [
          { type: 'listItem', content: [paragraph(text('one'))] },
          { type: 'listItem', content: [paragraph(text('two'))] },
        ],
      },
    );
    expect(bodyToText(body)).toBe('Hello\nthere\none\ntwo');
  });

  it('gives an empty string for an empty document', () => {
    expect(bodyToText(doc(paragraph())).trim()).toBe('');
  });
});
