import { MessageBody } from '@/components/messages/MessageBody';
import { accountContent } from '@/content/account';
import type { MessageNode } from '@/domain/messageBody';
import type { ThreadMessage } from '@/integrations/accountService';

const content = accountContent.messages;

export function MessageThread({ messages }: { messages: ThreadMessage[] }) {
  if (messages.length === 0) {
    return <p className="m-0 text-muted">{content.empty}</p>;
  }
  return (
    <ol className="m-0 flex list-none flex-col gap-3 p-0">
      {messages.map((message) => {
        const fromClient = message.direction === 'client';
        return (
          <li
            key={message.id}
            className={`rounded-button p-4 ${fromClient ? 'border border-line bg-white' : 'bg-surface'}`}
          >
            <p className="m-0 text-[15px] text-muted">
              {fromClient ? content.you : content.organiser} · {message.createdAt.slice(0, 10)}
            </p>
            {message.subject && <p className="mt-1 mb-0 font-semibold">{message.subject}</p>}
            <MessageBody body={message.body as MessageNode} />
            {message.attachments.length > 0 && (
              <div className="mt-2">
                <p className="m-0 text-[15px] font-medium">{content.attachments}</p>
                <ul className="m-0 list-none p-0">
                  {message.attachments.map((file) => (
                    <li key={file.url}>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center break-all"
                      >
                        {file.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
