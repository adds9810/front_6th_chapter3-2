import { EventForm, RepeatType, RepeatInfo } from '../../types';
import { generateRepeatEvents } from '../../utils/repeatEventGeneration';

beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  vi.clearAllMocks();
});

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

      const repeatEvents = generateRepeatEvents(baseEvent, repeatInfo);

      expect(repeatEvents).toHaveLength(6); // 8/25~8/30까지
      expect(repeatEvents[0].date).toBe('2025-08-25');
      expect(repeatEvents[5].date).toBe('2025-08-30');
      expect(repeatEvents[0].title).toBe('매일 회의');
      expect(repeatEvents[0].startTime).toBe('09:00');
    });

    it('반복 간격을 적용할 수 있다', () => {
      const repeatInfo = { type: 'daily' as RepeatType, interval: 2, endDate: '2025-08-30' };

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

      const repeatEvents = generateRepeatEvents(baseEvent, repeatInfo);

      expect(repeatEvents).toHaveLength(4); // 8/25, 9/25, 10/25, 11/25
      expect(repeatEvents[0].date).toBe('2025-08-25');
      expect(repeatEvents[1].date).toBe('2025-09-25');
      expect(repeatEvents[2].date).toBe('2025-10-25');
      expect(repeatEvents[3].date).toBe('2025-11-25');
    });

    it('31일에 매월 반복하면 31일이 있는 달에만 생성한다 (과제 요구사항)', () => {
      const monthly31Event = { ...baseEvent, date: '2025-01-31' };
      const repeatInfo = { type: 'monthly' as RepeatType, interval: 1, endDate: '2025-12-31' };

      // strictMode: true로 과제 요구사항에 맞게 테스트
      const repeatEvents = generateRepeatEvents(monthly31Event, repeatInfo, { strictMode: true });

      // 31일이 있는 달에만 생성 (1, 3, 5, 7, 8, 10, 12월)
      expect(repeatEvents).toHaveLength(7);
      expect(repeatEvents[0].date).toBe('2025-01-31');
      expect(repeatEvents[1].date).toBe('2025-03-31');
      expect(repeatEvents[2].date).toBe('2025-05-31');
      expect(repeatEvents[3].date).toBe('2025-07-31');
      expect(repeatEvents[4].date).toBe('2025-08-31');
      expect(repeatEvents[5].date).toBe('2025-10-31');
      expect(repeatEvents[6].date).toBe('2025-12-31');
    });

    it('기존 TDD 방식으로 31일을 조정하여 모든 달에 생성한다', () => {
      const monthly31Event = { ...baseEvent, date: '2025-01-31' };
      const repeatInfo = { type: 'monthly' as RepeatType, interval: 1, endDate: '2025-06-30' };

      // strictMode: false (기본값)로 기존 TDD 방식 테스트
      const repeatEvents = generateRepeatEvents(monthly31Event, repeatInfo);

      // 모든 달에 생성 (조정된 날짜로)
      expect(repeatEvents).toHaveLength(6);
      expect(repeatEvents[0].date).toBe('2025-01-31');
      expect(repeatEvents[1].date).toBe('2025-02-28'); // 2월은 28일로 조정
      expect(repeatEvents[2].date).toBe('2025-03-31');
      expect(repeatEvents[3].date).toBe('2025-04-30'); // 4월은 30일로 조정
      expect(repeatEvents[4].date).toBe('2025-05-31');
      expect(repeatEvents[5].date).toBe('2025-06-30'); // 6월은 30일로 조정
    });
  });

  describe('매년 반복 일정', () => {
    it('매년 반복 일정을 생성할 수 있다', () => {
      const repeatInfo = { type: 'yearly' as RepeatType, interval: 1, endDate: '2028-08-25' };

      const repeatEvents = generateRepeatEvents(baseEvent, repeatInfo);

      expect(repeatEvents).toHaveLength(4); // 2025, 2026, 2027, 2028
      expect(repeatEvents[0].date).toBe('2025-08-25');
      expect(repeatEvents[1].date).toBe('2026-08-25');
      expect(repeatEvents[2].date).toBe('2027-08-25');
      expect(repeatEvents[3].date).toBe('2028-08-25');
    });

    it('윤년 29일에 매년 반복하면 윤년에만 생성한다 (과제 요구사항)', () => {
      const yearly29Event = { ...baseEvent, date: '2024-02-29' };
      const repeatInfo = { type: 'yearly' as RepeatType, interval: 1, endDate: '2028-12-31' };

      // strictMode: true로 과제 요구사항에 맞게 테스트
      const repeatEvents = generateRepeatEvents(yearly29Event, repeatInfo, { strictMode: true });

      // 윤년에만 생성 (2024, 2028)
      expect(repeatEvents).toHaveLength(2);
      expect(repeatEvents[0].date).toBe('2024-02-29');
      expect(repeatEvents[1].date).toBe('2028-02-29');
    });

    it('기존 TDD 방식으로 윤년이 아닌 해는 2월 28일로 조정하여 모든 해에 생성한다', () => {
      const yearly29Event = { ...baseEvent, date: '2024-02-29' };
      const repeatInfo = { type: 'yearly' as RepeatType, interval: 1, endDate: '2028-02-28' };

      // strictMode: false (기본값)로 기존 TDD 방식 테스트
      const repeatEvents = generateRepeatEvents(yearly29Event, repeatInfo);

      // 모든 해에 생성 (조정된 날짜로)
      expect(repeatEvents).toHaveLength(4);
      expect(repeatEvents[0].date).toBe('2024-02-29');
      expect(repeatEvents[1].date).toBe('2025-02-28'); // 2025는 평년이므로 28일로 조정
      expect(repeatEvents[2].date).toBe('2026-02-28'); // 2026는 평년이므로 28일로 조정
      expect(repeatEvents[3].date).toBe('2027-02-28'); // 2027는 평년이므로 28일로 조정
    });
  });

  describe('반복 종료 조건', () => {
    it('반복 종료일이 없으면 2025-10-30까지 생성한다', () => {
      const repeatInfo = { type: 'daily' as RepeatType, interval: 1, endDate: undefined };

      const repeatEvents = generateRepeatEvents(baseEvent, repeatInfo);

      expect(repeatEvents.length).toBeGreaterThan(60); // 8월 25일부터 10월 30일까지 약 67일
      expect(repeatEvents[repeatEvents.length - 1].date).toBe('2025-10-30');
    });

    it('반복이 없으면 빈 배열을 반환한다', () => {
      const repeatInfo = { type: 'none' as RepeatType, interval: 1, endDate: '2025-08-30' };

      const repeatEvents = generateRepeatEvents(baseEvent, repeatInfo);

      expect(repeatEvents).toHaveLength(0);
    });
  });

  describe('에러 처리', () => {
    it('잘못된 날짜 형식에 대해 에러를 발생시킨다', () => {
      const invalidEvent = { ...baseEvent, date: 'invalid-date' };
      const repeatInfo = { type: 'daily' as RepeatType, interval: 1, endDate: '2025-08-30' };

      expect(() => generateRepeatEvents(invalidEvent, repeatInfo)).toThrow('Invalid date string');
    });

    it('시작일이 종료일보다 늦으면 에러를 발생시킨다', () => {
      const repeatInfo = { type: 'daily' as RepeatType, interval: 1, endDate: '2025-08-20' };

      expect(() => generateRepeatEvents(baseEvent, repeatInfo)).toThrow(
        'Start date cannot be after end date'
      );
    });

    it('잘못된 반복 간격에 대해 에러를 발생시킨다', () => {
      const repeatInfo = { type: 'daily' as RepeatType, interval: 0, endDate: '2025-08-30' };

      expect(() => generateRepeatEvents(baseEvent, repeatInfo)).toThrow(
        'Interval must be at least 1'
      );
    });

    it('필수 파라미터가 없으면 에러를 발생시킨다', () => {
      expect(() =>
        generateRepeatEvents(undefined as unknown as EventForm, { type: 'daily', interval: 1 })
      ).toThrow('baseEvent and repeatInfo are required');
      expect(() => generateRepeatEvents(baseEvent, undefined as unknown as RepeatInfo)).toThrow(
        'baseEvent and repeatInfo are required'
      );
    });
  });
});
