import '@testing-library/jest-dom';

import { setupServer } from 'msw/node';
import { vi } from 'vitest';

import { handlers } from './__mocks__/handlers';

// MSW 서버 설정 (기존 통합 테스트용)
export const server = setupServer(...handlers);

// fetch 모킹 (새로운 단위 테스트용)
const mockFetch = vi.fn();

// 기본 응답 설정 - 모든 테스트에서 사용할 기본값
mockFetch.mockResolvedValue({
  ok: true,
  status: 200,
  json: async () => ({}),
});

// MSW와 fetch 모킹을 모두 설정
global.fetch = mockFetch;

vi.stubEnv('TZ', 'UTC');

beforeAll(() => {
  server.listen();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

beforeEach(() => {
  expect.hasAssertions();
  vi.setSystemTime(new Date('2025-10-01'));
  // 각 테스트 전에 fetch mock 초기화
  vi.clearAllMocks();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  try {
    server.close();
  } catch {
    // MSW 서버 종료 오류 무시
  }
  vi.resetAllMocks();
  vi.useRealTimers();
});
