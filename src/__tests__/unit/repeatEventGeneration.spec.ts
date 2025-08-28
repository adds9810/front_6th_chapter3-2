import { describe, it, expect, beforeEach } from 'vitest';
import { EventForm, RepeatType } from '../../types';
import { generateRepeatEvents } from '../../utils/repeatEventGeneration';

describe('반복 일정 생성', () => {
  let baseEvent: EventForm;

  beforeEach(() => {
    baseEvent = {
      title: '매일 회의',
      date: '2025-08-25',
      startTime: '09:00',
      endTime: '10:00',
      description: '일일 스탠드업 미팅',
      location: '온라인',
      category: '업무',
      repeat: { type: 'none', interval: 1 },
      notificationTime: 10,
    };
  });

  describe('매일 반복 일정', () => {
    it('매일 반복 일정을 생성할 수 있다', () => {
      const repeatInfo = { type: 'daily' as RepeatType, interval: 1, endDate: '2025-08-30' };

      // Red: 아직 구현되지 않은 함수 호출
      const repeatEvents = generateRepeatEvents(baseEvent, repeatInfo);

      expect(repeatEvents).toHaveLength(6); // 8/25~8/30까지
      expect(repeatEvents[0].date).toBe('2025-08-25');
      expect(repeatEvents[5].date).toBe('2025-08-30');
      expect(repeatEvents[0].title).toBe('매일 회의');
      expect(repeatEvents[0].startTime).toBe('09:00');
    });

    it('반복 간격을 적용할 수 있다', () => {
      const repeatInfo = { type: 'daily' as RepeatType, interval: 2, endDate: '2025-08-30' };

      // Red: 아직 구현되지 않은 함수 호출
      const repeatEvents = generateRepeatEvents(baseEvent, repeatInfo);

      expect(repeatEvents).toHaveLength(3); // 8/25, 8/27, 8/29
      expect(repeatEvents[0].date).toBe('2025-08-25');
      expect(repeatEvents[1].date).toBe('2025-08-27');
      expect(repeatEvents[2].date).toBe('2025-08-29');
    });
  });

  describe('매주 반복 일정', () => {
    it('매주 반복 일정을 생성할 수 있다', () => {
      const repeatInfo = { type: 'weekly' as RepeatType, interval: 1, endDate: '2025-09-15' };

      // Red: 아직 구현되지 않은 함수 호출
      const repeatEvents = generateRepeatEvents(baseEvent, repeatInfo);

      expect(repeatEvents).toHaveLength(4); // 8/25, 9/1, 9/8, 9/15
      expect(repeatEvents[0].date).toBe('2025-08-25');
      expect(repeatEvents[1].date).toBe('2025-09-01');
      expect(repeatEvents[2].date).toBe('2025-09-08');
      expect(repeatEvents[3].date).toBe('2025-09-15');
    });
  });

  describe('매월 반복 일정', () => {
    it('매월 반복 일정을 생성할 수 있다', () => {
      const repeatInfo = { type: 'monthly' as RepeatType, interval: 1, endDate: '2025-11-25' };

      // Red: 아직 구현되지 않은 함수 호출
      const repeatEvents = generateRepeatEvents(baseEvent, repeatInfo);

      expect(repeatEvents).toHaveLength(4); // 8/25, 9/25, 10/25, 11/25
      expect(repeatEvents[0].date).toBe('2025-08-25');
      expect(repeatEvents[1].date).toBe('2025-09-25');
      expect(repeatEvents[2].date).toBe('2025-10-25');
      expect(repeatEvents[3].date).toBe('2025-11-25');
    });

    it('31일에 매월 반복하면 31일에만 생성한다', () => {
      const monthly31Event = { ...baseEvent, date: '2025-01-31' };
      const repeatInfo = { type: 'monthly' as RepeatType, interval: 1, endDate: '2025-06-30' };

      // Red: 아직 구현되지 않은 함수 호출
      const repeatEvents = generateRepeatEvents(monthly31Event, repeatInfo);

      expect(repeatEvents).toHaveLength(6); // 1월~6월
      expect(repeatEvents[0].date).toBe('2025-01-31');
      expect(repeatEvents[1].date).toBe('2025-02-28'); // 2월은 28일까지만
      expect(repeatEvents[2].date).toBe('2025-03-31');
      expect(repeatEvents[3].date).toBe('2025-04-30'); // 4월은 30일까지만
      expect(repeatEvents[4].date).toBe('2025-05-31');
      expect(repeatEvents[5].date).toBe('2025-06-30'); // 6월은 30일까지만
    });
  });

  describe('매년 반복 일정', () => {
    it('매년 반복 일정을 생성할 수 있다', () => {
      const repeatInfo = { type: 'yearly' as RepeatType, interval: 1, endDate: '2028-08-25' };

      // Red: 아직 구현되지 않은 함수 호출
      const repeatEvents = generateRepeatEvents(baseEvent, repeatInfo);

      expect(repeatEvents).toHaveLength(4); // 2025, 2026, 2027, 2028
      expect(repeatEvents[0].date).toBe('2025-08-25');
      expect(repeatEvents[1].date).toBe('2026-08-25');
      expect(repeatEvents[2].date).toBe('2027-08-25');
      expect(repeatEvents[3].date).toBe('2028-08-25');
    });

    it('윤년 29일에 매년 반복하면 29일에만 생성한다', () => {
      const yearly29Event = { ...baseEvent, date: '2024-02-29' };
      const repeatInfo = { type: 'yearly' as RepeatType, interval: 1, endDate: '2028-02-28' };

      // Red: 아직 구현되지 않은 함수 호출
      const repeatEvents = generateRepeatEvents(yearly29Event, repeatInfo);

      // 디버깅을 위해 실제 생성된 날짜들 출력
      console.log(
        'Generated dates:',
        repeatEvents.map((e) => e.date)
      );

      expect(repeatEvents).toHaveLength(4); // 2024, 2025, 2026, 2027
      expect(repeatEvents[0].date).toBe('2024-02-29');
      expect(repeatEvents[1].date).toBe('2025-02-28'); // 2025는 평년
      expect(repeatEvents[2].date).toBe('2026-02-28'); // 2026는 평년
      expect(repeatEvents[3].date).toBe('2027-02-28'); // 2027는 평년
    });
  });

  describe('반복 종료 조건', () => {
    it('반복 종료일이 없으면 2025-10-30까지 생성한다', () => {
      const repeatInfo = { type: 'daily' as RepeatType, interval: 1, endDate: undefined };

      // Red: 아직 구현되지 않은 함수 호출
      const repeatEvents = generateRepeatEvents(baseEvent, repeatInfo);

      expect(repeatEvents.length).toBeGreaterThan(60); // 8월 25일부터 10월 30일까지 약 67일
      expect(repeatEvents[repeatEvents.length - 1].date).toBe('2025-10-30');
    });

    it('반복이 없으면 빈 배열을 반환한다', () => {
      const repeatInfo = { type: 'none' as RepeatType, interval: 1, endDate: '2025-08-30' };

      // Red: 아직 구현되지 않은 함수 호출
      const repeatEvents = generateRepeatEvents(baseEvent, repeatInfo);

      expect(repeatEvents).toHaveLength(0);
    });
  });
});
