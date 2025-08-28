import { describe, it, expect, beforeEach, vi } from 'vitest';

import { Event, EventForm } from '../../types';
import {
  modifyRepeatEvent,
  deleteRepeatEvent,
  modifyRepeatEventGroup,
  deleteRepeatEventGroup,
} from '../../utils/repeatEventOperations';

// MSW를 우회하기 위해 fetch를 직접 모킹
const mockFetch = vi.fn();

// 테스트 시작 전에 fetch 모킹
beforeEach(() => {
  global.fetch = mockFetch;
  vi.clearAllMocks();
});

// 테스트 후 원래 fetch 복원
afterEach(() => {
  // @ts-expect-error - fetch 복원
  global.fetch = undefined;
});

describe('반복 일정 수정/삭제 로직', () => {
  let baseEvent: EventForm;
  let repeatEvent: Event;

  beforeEach(() => {
    baseEvent = {
      title: '매일 회의',
      date: '2025-08-25',
      startTime: '09:00',
      endTime: '10:00',
      description: '일일 스탠드업 미팅',
      location: '온라인',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate: '2025-08-30' },
      notificationTime: 10,
    };

    repeatEvent = {
      id: 'repeat-event-1',
      ...baseEvent,
      repeat: {
        type: 'daily',
        interval: 1,
        endDate: '2025-08-30',
        repeatId: 'repeat-group-1',
      },
    };

    vi.clearAllMocks();
  });

  describe('반복 일정 수정', () => {
    it('반복 일정을 수정하면 독립 이벤트로 변환된다', async () => {
      // PUT 요청에 대한 응답 모킹
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ...repeatEvent, title: '수정된 회의' }),
      });

      const modifiedEvent = await modifyRepeatEvent(repeatEvent, {
        title: '수정된 회의',
        description: '수정된 설명',
      });

      expect(modifiedEvent.repeat.type).toBe('none');
      expect(modifiedEvent.repeat.repeatId).toBeUndefined();
      expect(modifiedEvent.title).toBe('수정된 회의');
      expect(modifiedEvent.description).toBe('수정된 설명');
    });

    it('반복 일정 수정 시 repeatId가 제거된다', async () => {
      // PUT 요청에 대한 응답 모킹
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ...repeatEvent, title: '수정된 회의' }),
      });

      const modifiedEvent = await modifyRepeatEvent(repeatEvent, {
        title: '수정된 회의',
      });

      expect(modifiedEvent.repeat.repeatId).toBeUndefined();
    });

    it('반복 일정 수정 시 다른 반복 일정은 영향받지 않는다', async () => {
      // PUT 요청에 대한 응답 모킹
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ...repeatEvent, title: '수정된 회의' }),
      });

      await modifyRepeatEvent(repeatEvent, { title: '수정된 회의' });

      // PUT 요청이 올바르게 호출되었는지 확인
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/events/'),
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('수정된 회의'),
        })
      );
    });
  });

  describe('반복 일정 삭제', () => {
    it('반복 일정을 삭제하면 해당 일정만 삭제된다', async () => {
      // DELETE 요청에 대한 응답 모킹
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await deleteRepeatEvent(repeatEvent.id);

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/events/${repeatEvent.id}`,
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('반복 일정 삭제 시 다른 반복 일정은 유지된다', async () => {
      // DELETE 요청에 대한 응답 모킹
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await deleteRepeatEvent(repeatEvent.id);

      // 개별 이벤트 삭제 API가 호출되어야 함
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/events/${repeatEvent.id}`,
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('반복 일정 그룹 관리', () => {
    it('반복 일정 그룹을 전체 수정할 수 있다', async () => {
      const repeatEvents = [
        { ...repeatEvent, id: 'event-1', date: '2025-08-25' },
        { ...repeatEvent, id: 'event-2', date: '2025-08-26' },
        { ...repeatEvent, id: 'event-3', date: '2025-08-27' },
      ];

      // PUT 요청에 대한 응답 모킹
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => repeatEvents.map((event) => ({ ...event, title: '전체 수정된 회의' })),
      });

      await modifyRepeatEventGroup(repeatEvents, {
        title: '전체 수정된 회의',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/events-list',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('전체 수정된 회의'),
        })
      );
    });

    it('반복 일정 그룹을 전체 삭제할 수 있다', async () => {
      const repeatEventIds = ['event-1', 'event-2', 'event-3'];

      // DELETE 요청에 대한 응답 모킹
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await deleteRepeatEventGroup(repeatEventIds);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/events-list',
        expect.objectContaining({
          method: 'DELETE',
          body: expect.stringContaining('event-1'),
        })
      );
    });
  });
});
