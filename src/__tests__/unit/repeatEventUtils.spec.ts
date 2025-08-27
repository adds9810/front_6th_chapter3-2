import { describe, it, expect } from 'vitest';

import { EventForm, RepeatType } from '../../types';
import { generateRepeatEvents, shouldShowRepeatIcon } from '../../utils/repeatEventUtils';

describe('repeatEventUtils', () => {
  describe('generateRepeatEvents', () => {
    const baseEvent: EventForm = {
      title: '테스트 일정',
      date: '2024-01-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '테스트 설명',
      location: '테스트 장소',
      category: '업무',
      repeat: {
        type: 'daily',
        interval: 1,
        endDate: '2024-01-17',
      },
      notificationTime: 10,
    };

    it('매일 반복 일정을 생성해야 한다', () => {
      const repeatEvents = generateRepeatEvents(baseEvent);

      expect(repeatEvents).toHaveLength(3); // 15, 16, 17일
      expect(repeatEvents[0].date).toBe('2024-01-15');
      expect(repeatEvents[1].date).toBe('2024-01-16');
      expect(repeatEvents[2].date).toBe('2024-01-17');

      // 모든 이벤트가 동일한 속성을 가져야 함
      repeatEvents.forEach((event) => {
        expect(event.title).toBe('테스트 일정');
        expect(event.startTime).toBe('09:00');
        expect(event.endTime).toBe('10:00');
      });
    });

    it('매주 반복 일정을 생성해야 한다', () => {
      const weeklyEvent = {
        ...baseEvent,
        repeat: { ...baseEvent.repeat, type: 'weekly' as RepeatType },
      };
      const repeatEvents = generateRepeatEvents(weeklyEvent);

      expect(repeatEvents).toHaveLength(3);
      expect(repeatEvents[0].date).toBe('2024-01-15'); // 월요일
      expect(repeatEvents[1].date).toBe('2024-01-22'); // 다음주 월요일
      expect(repeatEvents[2].date).toBe('2024-01-29'); // 그 다음주 월요일
    });

    it('매월 반복 일정을 생성해야 한다', () => {
      const monthlyEvent = {
        ...baseEvent,
        repeat: { ...baseEvent.repeat, type: 'monthly' as RepeatType },
      };
      const repeatEvents = generateRepeatEvents(monthlyEvent);

      expect(repeatEvents).toHaveLength(3);
      expect(repeatEvents[0].date).toBe('2024-01-15');
      expect(repeatEvents[1].date).toBe('2024-02-15');
      expect(repeatEvents[2].date).toBe('2024-03-15');
    });

    it('매년 반복 일정을 생성해야 한다', () => {
      const yearlyEvent = {
        ...baseEvent,
        repeat: { ...baseEvent.repeat, type: 'yearly' as RepeatType },
      };
      const repeatEvents = generateRepeatEvents(yearlyEvent);

      expect(repeatEvents).toHaveLength(3);
      expect(repeatEvents[0].date).toBe('2024-01-15');
      expect(repeatEvents[1].date).toBe('2025-01-15');
      expect(repeatEvents[2].date).toBe('2026-01-15');
    });

    it('반복 간격을 적용해야 한다', () => {
      const intervalEvent = { ...baseEvent, repeat: { ...baseEvent.repeat, interval: 2 } };
      const repeatEvents = generateRepeatEvents(intervalEvent);

      expect(repeatEvents).toHaveLength(2); // 15일, 17일
      expect(repeatEvents[0].date).toBe('2024-01-15');
      expect(repeatEvents[1].date).toBe('2024-01-17');
    });

    it('반복 종료일까지 일정을 생성해야 한다', () => {
      const endDateEvent = { ...baseEvent, repeat: { ...baseEvent.repeat, endDate: '2024-01-20' } };
      const repeatEvents = generateRepeatEvents(endDateEvent);

      expect(repeatEvents).toHaveLength(6); // 15일부터 20일까지
      expect(repeatEvents[repeatEvents.length - 1].date).toBe('2024-01-20');
    });

    it('반복 종료일이 없으면 2025-10-30까지 생성해야 한다', () => {
      const noEndDateEvent = { ...baseEvent, repeat: { ...baseEvent.repeat, endDate: undefined } };
      const repeatEvents = generateRepeatEvents(noEndDateEvent);

      expect(repeatEvents.length).toBeGreaterThan(365); // 최소 1년치
      expect(repeatEvents[repeatEvents.length - 1].date).toBe('2025-10-30');
    });

    it('31일에 매월 반복하면 31일에만 생성해야 한다', () => {
      const monthly31Event = {
        ...baseEvent,
        date: '2024-01-31',
        repeat: { ...baseEvent.repeat, type: 'monthly' as RepeatType, endDate: '2024-06-30' },
      };
      const repeatEvents = generateRepeatEvents(monthly31Event);

      expect(repeatEvents).toHaveLength(6); // 1월~6월
      expect(repeatEvents[0].date).toBe('2024-01-31');
      expect(repeatEvents[1].date).toBe('2024-02-29'); // 2월은 29일까지만
      expect(repeatEvents[2].date).toBe('2024-03-31');
      expect(repeatEvents[3].date).toBe('2024-04-30'); // 4월은 30일까지만
      expect(repeatEvents[4].date).toBe('2024-05-31');
      expect(repeatEvents[5].date).toBe('2024-06-30'); // 6월은 30일까지만
    });

    it('반복이 없으면 빈 배열을 반환해야 한다', () => {
      const noRepeatEvent = {
        ...baseEvent,
        repeat: { ...baseEvent.repeat, type: 'none' as RepeatType },
      };
      const repeatEvents = generateRepeatEvents(noRepeatEvent);

      expect(repeatEvents).toHaveLength(0);
    });
  });

  describe('shouldShowRepeatIcon', () => {
    it('반복 일정이면 true를 반환해야 한다', () => {
      const repeatEvent = {
        id: '1',
        title: '반복 일정',
        date: '2024-01-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '',
        location: '',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2024-01-20' },
        notificationTime: 10,
      };

      expect(shouldShowRepeatIcon(repeatEvent)).toBe(true);
    });

    it('반복이 아닌 일정이면 false를 반환해야 한다', () => {
      const normalEvent = {
        id: '1',
        title: '일반 일정',
        date: '2024-01-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '',
        location: '',
        category: '업무',
        repeat: { type: 'none', interval: 1, endDate: undefined },
        notificationTime: 10,
      };

      expect(shouldShowRepeatIcon(normalEvent)).toBe(false);
    });
  });
});
