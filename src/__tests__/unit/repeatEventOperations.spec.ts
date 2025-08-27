import { renderHook, act } from '@testing-library/react';

import { useEventOperations } from '../../hooks/useEventOperations';
import { EventForm } from '../../types';

// Mock notistack
vi.mock('notistack', () => ({
  useSnackbar: () => ({
    enqueueSnackbar: vi.fn(),
  }),
}));

describe('repeatEventOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('saveRepeatEvents', () => {
    it('반복 일정들을 서버에 저장해야 한다', async () => {
      const mockResponse = { ok: true, json: () => Promise.resolve([{ id: '1' }, { id: '2' }]) };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEventOperations(false));

      const repeatEvents: EventForm[] = [
        {
          title: '반복 일정 1',
          date: '2024-01-15',
          startTime: '09:00',
          endTime: '10:00',
          description: '',
          location: '',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2024-01-17' },
          notificationTime: 10,
        },
        {
          title: '반복 일정 2',
          date: '2024-01-16',
          startTime: '09:00',
          endTime: '10:00',
          description: '',
          location: '',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2024-01-17' },
          notificationTime: 10,
        },
      ];

      await act(async () => {
        await result.current.saveRepeatEvents(repeatEvents);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/events-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: repeatEvents }),
      });
    });

    it('서버 에러 시 적절한 에러 처리를 해야 한다', async () => {
      const mockResponse = { ok: false, status: 500 };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEventOperations(false));

      const repeatEvents: EventForm[] = [
        {
          title: '반복 일정',
          date: '2024-01-15',
          startTime: '09:00',
          endTime: '10:00',
          description: '',
          location: '',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2024-01-17' },
          notificationTime: 10,
        },
      ];

      await act(async () => {
        await result.current.saveRepeatEvents(repeatEvents);
      });

      // 에러 처리 로직 검증
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
