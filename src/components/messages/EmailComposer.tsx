'use client';

import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { composerContent as content } from '@/content/composer';
import { bodyToText, isSafeLink, type MessageNode } from '@/domain/messageBody';

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const MAX_ATTACHMENTS = 5;

const toolClass = (active: boolean) =>
  `min-h-11 min-w-11 cursor-pointer rounded-button border px-3 text-[15px] ${
    active ? 'border-accent bg-accent text-on-accent' : 'border-line bg-white text-ink'
  }`;

function ToolButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick(): void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      className={toolClass(active)}
      // Keeps the text selection in the editor while the button is pressed.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function EmailComposer({
  to,
  initialSubject = '',
  showSubject = true,
  onSend,
}: {
  to: string;
  initialSubject?: string;
  showSubject?: boolean;
  onSend(message: { subject: string; body: MessageNode }, files: File[]): Promise<boolean>;
}) {
  const [subject, setSubject] = useState(initialSubject);
  const [files, setFiles] = useState<File[]>([]);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      // Only what the server accepts: see domain/messageBody.ts.
      StarterKit.configure({
        heading: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        link: { openOnClick: false, autolink: true, protocols: ['http', 'https', 'mailto'] },
      }),
    ],
    editorProps: {
      attributes: {
        'aria-label': content.body,
        class: 'composer-body min-h-48 p-3.5',
      },
    },
  });

  const active = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current?.isActive('bold') ?? false,
      italic: current?.isActive('italic') ?? false,
      bulletList: current?.isActive('bulletList') ?? false,
      orderedList: current?.isActive('orderedList') ?? false,
      link: current?.isActive('link') ?? false,
    }),
  });

  function openLink() {
    if (editor?.state.selection.empty && !active?.link) {
      setError(content.link.needsSelection);
      return;
    }
    setError(null);
    setLinkValue((editor?.getAttributes('link').href as string | undefined) ?? '');
    setLinkOpen(true);
  }

  function applyLink() {
    if (!isSafeLink(linkValue)) {
      setError(content.link.invalid);
      return;
    }
    setError(null);
    editor?.chain().focus().extendMarkRange('link').setLink({ href: linkValue.trim() }).run();
    setLinkOpen(false);
  }

  function removeLink() {
    editor?.chain().focus().extendMarkRange('link').unsetLink().run();
    setLinkOpen(false);
  }

  function addFiles(selected: FileList | null) {
    const incoming = Array.from(selected ?? []);
    const invalid = incoming.find((file) => file.size === 0 || file.size > MAX_ATTACHMENT_BYTES);
    if (invalid) {
      setError(
        invalid.size === 0
          ? content.attachments.empty(invalid.name)
          : content.attachments.tooBig(invalid.name),
      );
    } else if (files.length + incoming.length > MAX_ATTACHMENTS) {
      setError(content.attachments.tooMany);
    } else {
      setError(null);
      setFiles([...files, ...incoming]);
    }
    if (fileInput.current) {
      fileInput.current.value = '';
    }
  }

  async function send() {
    const body = editor?.getJSON() as MessageNode | undefined;
    if (!body || subject.trim() === '' || bodyToText(body).trim() === '') {
      setError(content.required);
      return;
    }
    setError(null);
    setBusy(true);
    const sent = await onSend({ subject, body }, files);
    setBusy(false);
    if (!sent) {
      setError(content.error);
      return;
    }
    editor?.commands.clearContent();
    setFiles([]);
    setSubject(initialSubject);
  }

  return (
    <div className="flex flex-col gap-4">
      <TextField label={content.to} value={to} readOnly />
      {showSubject && (
        <TextField
          label={content.subject}
          value={subject}
          maxLength={200}
          onChange={(event) => setSubject(event.target.value)}
        />
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-[15px] font-medium">{content.body}</span>
        <div className="overflow-hidden rounded-button border border-line bg-white">
          <div
            role="toolbar"
            aria-label={content.toolbar.label}
            className="flex flex-wrap gap-2 border-b border-line bg-surface p-2"
          >
            <ToolButton
              label={content.toolbar.bold}
              active={active?.bold ?? false}
              onClick={() => editor?.chain().focus().toggleBold().run()}
            >
              <strong>B</strong>
            </ToolButton>
            <ToolButton
              label={content.toolbar.italic}
              active={active?.italic ?? false}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
            >
              <em>I</em>
            </ToolButton>
            <ToolButton
              label={content.toolbar.bulletList}
              active={active?.bulletList ?? false}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
            >
              •
            </ToolButton>
            <ToolButton
              label={content.toolbar.orderedList}
              active={active?.orderedList ?? false}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            >
              1.
            </ToolButton>
            <ToolButton
              label={content.toolbar.link}
              active={active?.link ?? false}
              onClick={openLink}
            >
              {content.toolbar.link}
            </ToolButton>
          </div>

          {linkOpen && (
            <div className="flex flex-col gap-2 border-b border-line p-3">
              <TextField
                label={content.link.label}
                type="url"
                placeholder={content.link.placeholder}
                value={linkValue}
                onChange={(event) => setLinkValue(event.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <button type="button" className={toolClass(false)} onClick={applyLink}>
                  {content.link.add}
                </button>
                {active?.link && (
                  <button type="button" className={toolClass(false)} onClick={removeLink}>
                    {content.link.remove}
                  </button>
                )}
                <button
                  type="button"
                  className={toolClass(false)}
                  onClick={() => setLinkOpen(false)}
                >
                  {content.link.cancel}
                </button>
              </div>
            </div>
          )}

          <EditorContent editor={editor} />
        </div>
      </div>

      <div>
        <label className={`${toolClass(false)} inline-flex items-center`}>
          {content.attachments.add}
          <input
            ref={fileInput}
            type="file"
            multiple
            className="sr-only"
            onChange={(event) => addFiles(event.target.files)}
          />
        </label>
        {files.length > 0 && (
          <ul className="mt-3 mb-0 flex list-none flex-col gap-2 p-0">
            {files.map((file) => (
              <li key={`${file.name}-${file.size}`} className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate">{file.name}</span>
                <button
                  type="button"
                  className={toolClass(false)}
                  aria-label={content.attachments.remove(file.name)}
                  onClick={() => setFiles(files.filter((item) => item !== file))}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p role="alert" className="m-0 text-[15px] text-accent">
          {error}
        </p>
      )}

      <div>
        <Button disabled={busy} onClick={() => void send()}>
          {busy ? content.sending : content.send}
        </Button>
      </div>
    </div>
  );
}
