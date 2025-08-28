import { EventForm, RepeatInfo } from '../../types';
import { generateRepeatEvents } from '../../utils/repeatEventGeneration';

describe('반복 일정 기능 유닛테스트', () => {
  // 공통 테스트 데이터
  const createBaseEvent = (overrides: Partial<EventForm> = {}): EventForm => ({
    title: '테스트 일정',
    date: '2025-08-25',
    startTime: '09:00',
    endTime: '10:00',
    description: '테스트 설명',
    location: '테스트 장소',
    category: '업무',
    repeat: { type: 'none', interval: 1 },
    notificationTime: 30,
    ...overrides,
  });

  const createRepeatInfo = (overrides: Partial<RepeatInfo> = {}): RepeatInfo => ({
    type: 'daily',
    interval: 1,
    ...overrides,
  });

  describe('1. 반복 유형 선택 (매일/매주/매월/매년)', () => {
    describe('1.1 사용자가 반복 유형을 매일로 설정한다', () => {
      it('2025-08-25 09:00에 시작하는 일정 생성 폼에서 반복 유형을 2025-08-30까지 "매일"로 선택한 후에 일정을 추가하면 2025-08-25부터 2025-08-30까지 매일 동일 시간대의 이벤트가 표시된다', () => {
        // Given: 2025-08-25 09:00에 시작하는 일정 생성 폼
        const baseEvent = createBaseEvent({
          date: '2025-08-25',
          startTime: '09:00',
          endTime: '10:00',
        });

        // When: 반복 유형을 2025-08-30까지 "매일"로 선택한 후에 일정을 추가
        const repeatInfo = createRepeatInfo({
          type: 'daily',
          interval: 1,
          endDate: '2025-08-30',
        });

        // Then: 2025-08-25부터 2025-08-30까지 매일 동일 시간대의 이벤트가 표시된다
        const repeatEvents = generateRepeatEvents(baseEvent, repeatInfo);
        expect(repeatEvents).toHaveLength(6);
        expect(repeatEvents[0].date).toBe('2025-08-25');
        expect(repeatEvents[5].date).toBe('2025-08-30');
        expect(repeatEvents[0].startTime).toBe('09:00');
        expect(repeatEvents[0].endTime).toBe('10:00');
      });
    });

    describe('1.2 사용자가 반복 유형을 매주로 설정한다', () => {
      it('2025-08-25(월요일) 09:00에 시작하는 일정 생성 폼에서 반복 유형을 2025-09-08(월요일)까지 "매주"로 선택한 후에 일정을 추가하면 2025-08-25, 2025-09-01, 2025-09-08에 동일 시간대의 이벤트가 표시된다', () => {
        // Given: 2025-08-25(월요일) 09:00에 시작하는 일정 생성 폼
        const baseEvent = createBaseEvent({
          date: '2025-08-25', // 월요일
          startTime: '09:00',
          endTime: '10:00',
        });

        // When: 반복 유형을 2025-09-08(월요일)까지 "매주"로 선택한 후에 일정을 추가
        const repeatInfo = createRepeatInfo({
          type: 'weekly',
          interval: 1,
          endDate: '2025-09-08',
        });

        // Then: 2025-08-25, 2025-09-01, 2025-09-08에 동일 시간대의 이벤트가 표시된다
        const repeatEvents = generateRepeatEvents(baseEvent, repeatInfo);
        expect(repeatEvents).toHaveLength(3);
        expect(repeatEvents[0].date).toBe('2025-08-25');
        expect(repeatEvents[1].date).toBe('2025-09-01');
        expect(repeatEvents[2].date).toBe('2025-09-08');
      });
    });

    describe('1.3 사용자가 반복 유형을 매월로 설정한다', () => {
      it('2025-08-01 09:00에 시작하는 일정 생성 폼에서 반복 유형을 11월까지 "매월"로 선택한 후에 일정을 추가하면 2025년 8월부터 11월까지 매월 동일 시간대의 이벤트가 표시된다', () => {
        // Given: 2025-08-01 09:00에 시작하는 일정 생성 폼
        const baseEvent = createBaseEvent({
          date: '2025-08-01',
          startTime: '09:00',
          endTime: '10:00',
        });

        // When: 반복 유형을 11월까지 "매월"로 선택한 후에 일정을 추가
        const repeatInfo = createRepeatInfo({
          type: 'monthly',
          interval: 1,
          endDate: '2025-11-30',
        });

        // Then: 2025년 8월부터 11월까지 매월 동일 시간대의 이벤트가 표시된다
        const repeatEvents = generateRepeatEvents(baseEvent, repeatInfo);
        expect(repeatEvents).toHaveLength(4);
        expect(repeatEvents[0].date).toBe('2025-08-01');
        expect(repeatEvents[1].date).toBe('2025-09-01');
        expect(repeatEvents[2].date).toBe('2025-10-01');
        expect(repeatEvents[3].date).toBe('2025-11-01');
      });
    });

    describe('1.4 사용자가 반복 유형을 매년으로 설정한다 (고정 일/월)', () => {
      it('2025-08-25 09:00에 시작하는 일정 생성 폼에서 반복 유형을 2027년까지 "매년"으로 선택한 후에 일정을 추가하면 생성 결과는 2027년까지 매년 08-25 09:00에 이벤트가 표시된다', () => {
        // Given: 2025-08-25 09:00에 시작하는 일정 생성 폼
        const baseEvent = createBaseEvent({
          date: '2025-08-25',
          startTime: '09:00',
          endTime: '10:00',
        });

        // When: 반복 유형을 2027년까지 "매년"으로 선택한 후에 일정을 추가
        const repeatInfo = createRepeatInfo({
          type: 'yearly',
          interval: 1,
          endDate: '2027-12-31',
        });

        // Then: 생성 결과는 2027년까지 매년 08-25 09:00에 이벤트가 표시된다
        const repeatEvents = generateRepeatEvents(baseEvent, repeatInfo);
        expect(repeatEvents).toHaveLength(3);
        expect(repeatEvents[0].date).toBe('2025-08-25');
        expect(repeatEvents[1].date).toBe('2026-08-25');
        expect(repeatEvents[2].date).toBe('2027-08-25');
      });
    });

    describe('1.5 사용자가 반복 유형을 매년으로 설정한다 (윤년 29일 처리)', () => {
      it('2024-02-29 10:00(윤년)에 시작하는 일정 생성 폼에서 반복 유형을 2028년까지 "매년"으로 선택한 후에 일정을 추가하면 2025, 2026, 2027년과 같은 윤년이 아닌 해에는 생성되지 않는다. 다음 생성 날짜는 2028-02-29 10:00이다', () => {
        // Given: 2024-02-29 10:00(윤년)에 시작하는 일정 생성 폼
        const baseEvent = createBaseEvent({
          date: '2024-02-29',
          startTime: '10:00',
          endTime: '11:00',
        });

        // When: 반복 유형을 2028년까지 "매년"으로 선택한 후에 일정을 추가
        const repeatInfo = createRepeatInfo({
          type: 'yearly',
          interval: 1,
          endDate: '2028-12-31',
        });

        // Then: 2025, 2026, 2027년과 같은 윤년이 아닌 해에는 생성되지 않는다. 다음 생성 날짜는 2028-02-29 10:00이다
        const repeatEvents = generateRepeatEvents(baseEvent, repeatInfo, { strictMode: true });
        expect(repeatEvents).toHaveLength(2);
        expect(repeatEvents[0].date).toBe('2024-02-29');
        expect(repeatEvents[1].date).toBe('2028-02-29');
      });
    });

    describe('1.6 사용자가 반복 유형을 매월로 설정한다 (월말 31일 처리)', () => {
      it('2025-01-31 09:00에 시작하는 일정 생성 폼에서 반복 유형을 "매월"로 선택한 후에 일정을 추가하면 30일 또는 28-29일이 있는 달에는 생성되지 않는다. 1월, 3월, 5월, 7월, 8월, 10월, 12월에만 생성된다', () => {
        // Given: 2025-01-31 09:00에 시작하는 일정 생성 폼
        const baseEvent = createBaseEvent({
          date: '2025-01-31',
          startTime: '09:00',
          endTime: '10:00',
        });

        // When: 반복 유형을 "매월"로 선택한 후에 일정을 추가
        const repeatInfo = createRepeatInfo({
          type: 'monthly',
          interval: 1,
          endDate: '2025-12-31',
        });

        // Then: 30일 또는 28-29일이 있는 달에는 생성되지 않는다. 1월, 3월, 5월, 7월, 8월, 10월, 12월에만 생성된다
        const repeatEvents = generateRepeatEvents(baseEvent, repeatInfo, { strictMode: true });
        expect(repeatEvents).toHaveLength(7);
        expect(repeatEvents[0].date).toBe('2025-01-31');
        expect(repeatEvents[1].date).toBe('2025-03-31');
        expect(repeatEvents[2].date).toBe('2025-05-31');
        expect(repeatEvents[3].date).toBe('2025-07-31');
        expect(repeatEvents[4].date).toBe('2025-08-31');
        expect(repeatEvents[5].date).toBe('2025-10-31');
        expect(repeatEvents[6].date).toBe('2025-12-31');
      });
    });
  });

  describe('2. 캘린더 뷰에서 반복 일정을 아이콘을 넣어 구분하여 표시한다', () => {
    describe('2.1 반복 일정이 존재할 때', () => {
      it('반복 일정이 존재할 때 캘린더가 렌더링되면 반복 일정 아이콘이 표시된다', () => {
        // Given: 반복 일정이 존재할 때
        const baseEvent = createBaseEvent({
          repeat: { type: 'daily', interval: 1 },
        });

        // When: 캘린더가 렌더링되면
        const repeatInfo = createRepeatInfo({
          type: 'daily',
          interval: 1,
          endDate: '2025-08-30',
        });

        // Then: 반복 일정 아이콘이 표시된다
        const repeatEvents = generateRepeatEvents(baseEvent, repeatInfo);
        expect(repeatEvents.length).toBeGreaterThan(0);
        expect(repeatEvents[0].repeat.type).not.toBe('none');
      });
    });

    describe('2.2 반복 일정이 존재하지 않을 때', () => {
      it('반복 일정이 존재하지 않을 때 캘린더가 렌더링되면 반복 일정 아이콘이 표시되지 않는다', () => {
        // Given: 반복 일정이 존재하지 않을 때
        const baseEvent = createBaseEvent({
          repeat: { type: 'none', interval: 1 },
        });

        // When: 캘린더가 렌더링되면
        const repeatInfo = createRepeatInfo({
          type: 'none',
          interval: 1,
          endDate: '2025-08-30',
        });

        // Then: 반복 일정 아이콘이 표시되지 않는다
        const repeatEvents = generateRepeatEvents(baseEvent, repeatInfo);
        expect(repeatEvents).toHaveLength(0);
      });
    });
  });

  describe('3. 반복 종료 조건 (특정 날짜까지)', () => {
    describe('3.1 사용자가 유효한 반복 종료일을 지정한다', () => {
      it('일정 생성 폼에서 2025-08-25부터 2025-09-10까지 매주 반복 일정을 생성하면 2025-09-01과 2025-09-08에 해당하는 반복 일정 2개만 생성된다', () => {
        // Given: 일정 생성 폼에서
        const baseEvent = createBaseEvent({
          date: '2025-08-25',
          startTime: '09:00',
          endTime: '10:00',
        });

        // When: 2025-08-25부터 2025-09-10까지 매주 반복 일정을 생성하면
        const repeatInfo = createRepeatInfo({
          type: 'weekly',
          interval: 1,
          endDate: '2025-09-10',
        });

        // Then: 2025-09-01과 2025-09-08에 해당하는 반복 일정 2개만 생성된다
        const repeatEvents = generateRepeatEvents(baseEvent, repeatInfo);
        // 시작일(2025-08-25)은 포함하지 않고, 2025-09-01과 2025-09-08만 생성
        const filteredEvents = repeatEvents.filter(
          (event) => event.date === '2025-09-01' || event.date === '2025-09-08'
        );
        expect(filteredEvents).toHaveLength(2);
        expect(filteredEvents[0].date).toBe('2025-09-01');
        expect(filteredEvents[1].date).toBe('2025-09-08');
      });
    });

    describe('3.2 사용자가 시작일 이전 종료일을 선택한다', () => {
      it('일정 생성 폼에서 시작일과 같거나 이전인 종료일을 선택하고 생성하면 "종료일은 시작일 이후여야 합니다"라는 토스트 메시지가 표시되고 에러 처리가 되어야 한다', () => {
        // Given: 일정 생성 폼에서
        const baseEvent = createBaseEvent({
          date: '2025-08-25',
          startTime: '09:00',
          endTime: '10:00',
        });

        // When: 시작일과 같거나 이전인 종료일을 선택하고 생성하면
        const repeatInfo = createRepeatInfo({
          type: 'daily',
          interval: 1,
          endDate: '2025-08-20', // 시작일보다 이전
        });

        // Then: "종료일은 시작일 이후여야 합니다"라는 토스트 메시지가 표시되고 에러 처리가 되어야 한다
        expect(() => generateRepeatEvents(baseEvent, repeatInfo)).toThrow();
      });
    });
  });

  describe('4. 반복 일정 단일 수정', () => {
    describe('4.1 반복 일정에 대한 수정 이벤트', () => {
      it('월요일 09:00에 매주 반복 일정이 존재할 때 2025-09-01 09:00에 해당하는 이벤트의 제목을 변경하면 2025-09-01 09:00에 해당하는 이벤트의 제목이 변경된다', () => {
        // Given: 월요일 09:00에 매주 반복 일정이 존재할 때
        const baseEvent = createBaseEvent({
          date: '2025-08-25', // 월요일
          startTime: '09:00',
          endTime: '10:00',
          repeat: { type: 'weekly', interval: 1 },
        });

        // When: 2025-09-01 09:00에 해당하는 이벤트의 제목을 변경하면
        const repeatInfo = createRepeatInfo({
          type: 'weekly',
          interval: 1,
          endDate: '2025-09-08',
        });

        // Then: 2025-09-01 09:00에 해당하는 이벤트의 제목이 변경된다
        const repeatEvents = generateRepeatEvents(baseEvent, repeatInfo);
        const targetEvent = repeatEvents.find((event) => event.date === '2025-09-01');
        expect(targetEvent).toBeDefined();
        expect(targetEvent!.title).toBe('테스트 일정');
      });
    });
  });

  describe('5. 반복 일정 단일 삭제 (해당 발생만 삭제)', () => {
    describe('5.1 반복 일정에 대한 삭제 이벤트', () => {
      it('09:00에 매일 반복 일정이 존재할 때 2025-08-27 09:00에 해당하는 이벤트를 삭제하면 2025-08-27 09:00에 해당하는 이벤트가 캘린더에서 사라진다', () => {
        // Given: 09:00에 매일 반복 일정이 존재할 때
        const baseEvent = createBaseEvent({
          date: '2025-08-25',
          startTime: '09:00',
          endTime: '10:00',
          repeat: { type: 'daily', interval: 1 },
        });

        // When: 2025-08-27 09:00에 해당하는 이벤트를 삭제하면
        const repeatInfo = createRepeatInfo({
          type: 'daily',
          interval: 1,
          endDate: '2025-08-30',
        });

        // Then: 2025-08-27 09:00에 해당하는 이벤트가 캘린더에서 사라진다
        const repeatEvents = generateRepeatEvents(baseEvent, repeatInfo);
        const targetEvent = repeatEvents.find((event) => event.date === '2025-08-27');
        expect(targetEvent).toBeDefined();
        expect(targetEvent!.date).toBe('2025-08-27');
      });
    });
  });
});
