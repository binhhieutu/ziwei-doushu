// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import { AIReading } from '../components/vietnam/AIReading';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const payload = { birth: { year: 2000 }, topic: 'overview' };

describe('Luận giải trực tuyến', () => {
  it('reads split UTF-8 SSE only after a user request', async () => {
    const bytes = new TextEncoder().encode(
      'data: {"delta":{"text":"Tử Vi"}}\n\ndata: [DONE]\n\n',
    );
    const stream = new ReadableStream({
      start(controller) {
        for (const byte of bytes) controller.enqueue(new Uint8Array([byte]));
        controller.close();
      },
    });
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(stream));
    render(<AIReading endpoint="/api/interpret" payload={payload} />);
    expect(fetchSpy).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Yêu cầu luận giải' }));
    expect(await screen.findByText('Tử Vi')).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledOnce();
  });
  it('offers retry after a stream error', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          'data: {"error":"Không thể luận giải","code":"FAILED"}\n\n',
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          'data: {"delta":{"text":"Đã thử lại"}}\n\ndata: [DONE]\n\n',
        ),
      );
    render(<AIReading endpoint="/api/interpret" payload={payload} />);
    fireEvent.click(screen.getByRole('button', { name: 'Yêu cầu luận giải' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không thể luận giải',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('Đã thử lại')).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
  it('cancels a pending request and allows retry', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      (_url, options) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        }),
    );
    render(<AIReading endpoint="/api/interpret" payload={payload} />);
    fireEvent.click(screen.getByRole('button', { name: 'Yêu cầu luận giải' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hủy luận giải' }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Đã hủy'),
    );
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
  });
});

it('shows HTTP errors and reports interrupted streams', async () => {
  const spy = vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: 'Dịch vụ chưa sẵn sàng', code: 'CONFIG' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    .mockResolvedValueOnce(
      new Response('data: {"delta":{"text":"Một phần"}}\n\n'),
    );
  render(<AIReading endpoint="/api/interpret" payload={payload} />);
  fireEvent.click(screen.getByRole('button', { name: 'Yêu cầu luận giải' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Dịch vụ chưa sẵn sàng',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent('bị gián đoạn'),
  );
  expect(screen.getByText('Một phần')).toBeInTheDocument();
  expect(spy).toHaveBeenCalledTimes(2);
});
it('sends a follow-up in bounded message history', async () => {
  const spy = vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(
      async () =>
        new Response('data: {"delta":{"text":"Đã nhận"}}\n\ndata: [DONE]\n\n'),
    );
  render(<AIReading endpoint="/api/interpret" payload={payload} />);
  fireEvent.click(screen.getByRole('button', { name: 'Yêu cầu luận giải' }));
  await screen.findByText('Đã nhận');
  fireEvent.change(screen.getByLabelText(/Câu hỏi thêm/), {
    target: { value: 'Giải thích thêm' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Yêu cầu luận giải' }));
  await waitFor(() => expect(spy).toHaveBeenCalledTimes(2));
  const body = JSON.parse(String(spy.mock.calls[1][1]?.body));
  expect(body.messages).toEqual([
    { role: 'assistant', content: 'Đã nhận' },
    { role: 'user', content: 'Giải thích thêm' },
  ]);
});
