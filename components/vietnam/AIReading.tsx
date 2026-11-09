'use client';
import { useEffect, useRef, useState } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };
export function AIReading({
  endpoint,
  payload,
}: {
  endpoint: '/api/interpret' | '/api/heming';
  payload: Record<string, unknown>;
}) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const controller = useRef<AbortController | null>(null);
  const last = useRef<Record<string, unknown> | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function request(body: Record<string, unknown>) {
    const abort = new AbortController();
    controller.current = abort;
    last.current = body;
    setLoading(true);
    setError('');
    setText('');
    let output = '';
    let completed = false;
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: abort.signal,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          typeof data.error === 'string'
            ? data.error
            : 'Không thể bắt đầu luận giải.',
        );
      }
      if (!response.body)
        throw new Error('Không nhận được nội dung luận giải.');
      reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      function processEvent(event: string) {
        const data = event
          .split(/\r?\n/)
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trimStart())
          .join('\n');
        if (!data) return;
        if (data === '[DONE]') {
          completed = true;
          return;
        }
        let item: { delta?: { text?: unknown }; error?: unknown };
        try {
          item = JSON.parse(data);
        } catch {
          throw new Error('Nội dung phản hồi không hợp lệ.');
        }
        if (typeof item.error === 'string') throw new Error(item.error);
        if (typeof item.delta?.text === 'string') {
          output += item.delta.text;
          setText(output);
        }
      }
      while (true) {
        const part = await reader.read();
        buffer += decoder.decode(part.value, { stream: !part.done });
        let match: RegExpMatchArray | null;
        while (
          (match = buffer.match(/\r?\n\r?\n/)) &&
          match.index !== undefined
        ) {
          processEvent(buffer.slice(0, match.index));
          buffer = buffer.slice(match.index + match[0].length);
        }
        if (part.done) break;
      }
      if (buffer.trim()) processEvent(buffer);
      if (!completed)
        throw new Error('Luận giải bị gián đoạn. Vui lòng thử lại.');
      if (output) {
        const sent = Array.isArray(body.messages)
          ? (body.messages as Message[])
          : [];
        const lastMessage = sent[sent.length - 1];
        const asked =
          typeof body.question === 'string'
            ? body.question
            : lastMessage?.role === 'user'
              ? lastMessage.content
              : '';
        setMessages((previous) =>
          [
            ...previous,
            ...(asked ? [{ role: 'user' as const, content: asked }] : []),
            { role: 'assistant' as const, content: output.slice(0, 3500) },
          ].slice(-4),
        );
      }
    } catch (e) {
      if (abort.signal.aborted) setError('Đã hủy luận giải.');
      else
        setError(
          e instanceof Error
            ? e.message
            : 'Không thể luận giải. Vui lòng thử lại.',
        );
    } finally {
      if (reader && !completed) await reader.cancel().catch(() => {});
      if (controller.current === abort) {
        controller.current = null;
        setLoading(false);
      }
    }
  }
  function start() {
    const trimmed = question.trim();
    const body = {
      ...payload,
      ...(messages.length ? { messages } : {}),
      ...(trimmed
        ? endpoint === '/api/heming'
          ? { question: trimmed }
          : {
              messages: [...messages, { role: 'user', content: trimmed }].slice(
                -5,
              ),
            }
        : {}),
    };
    setQuestion('');
    void request(body);
  }
  return (
    <section className="viet-ai" aria-label="Luận giải AI">
      <h2>Luận giải AI</h2>
      <p>
        Chỉ khi bạn yêu cầu, thông tin sinh và lá số sẽ được gửi tới dịch vụ AI
        để tạo luận giải. Nội dung chỉ mang tính tham khảo.
      </p>
      <label>
        Câu hỏi thêm (không bắt buộc)
        <textarea
          maxLength={1000}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </label>
      <div className="viet-actions">
        <button type="button" disabled={loading} onClick={start}>
          Yêu cầu luận giải
        </button>
        {loading && (
          <button type="button" onClick={() => controller.current?.abort()}>
            Hủy luận giải
          </button>
        )}
        {error && last.current && (
          <button type="button" onClick={() => void request(last.current!)}>
            Thử lại
          </button>
        )}
      </div>
      {loading && <p role="status">Đang luận giải…</p>}
      {error && <p role="alert">{error}</p>}
      {text && (
        <div className="viet-response" aria-live="polite">
          {text}
        </div>
      )}
    </section>
  );
}
