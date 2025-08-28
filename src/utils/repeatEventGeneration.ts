import { EventForm, RepeatType } from '../types';

export const generateRepeatEvents = (baseEvent: EventForm, repeatInfo: RepeatInfo): EventForm[] => {
  if (repeatInfo.type === 'none') {
    return [];
  }

  const events: EventForm[] = [];
  const startDate = new Date(baseEvent.date);
  const endDate = repeatInfo.endDate
    ? new Date(repeatInfo.endDate)
    : new Date('2025-10-30');

  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    events.push({
      ...baseEvent,
      date: currentDate.toISOString().split('T')[0],
    });

    // 다음 날짜 계산 - 새로운 Date 객체 생성으로 참조 문제 해결
    switch (repeatInfo.type) {
      case 'daily':
        currentDate = new Date(
          currentDate.getTime() + repeatInfo.interval * 24 * 60 * 60 * 1000
        );
        break;
      case 'weekly':
        currentDate = new Date(
          currentDate.getTime() + repeatInfo.interval * 7 * 24 * 60 * 60 * 1000
        );
        break;
      case 'monthly': {
        const nextMonth = new Date(currentDate);
        // 날짜를 1일로 설정한 후 월 변경 (31일 문제 방지)
        nextMonth.setDate(1);
        nextMonth.setMonth(nextMonth.getMonth() + repeatInfo.interval);

        // 원래 날짜로 복원 (31일이 있으면 31일, 없으면 해당 월의 마지막 날)
        if (startDate.getDate() === 31) {
          const lastDayOfMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);
          const adjustedDate = Math.min(31, lastDayOfMonth.getDate());
          nextMonth.setDate(adjustedDate);
        } else {
          nextMonth.setDate(startDate.getDate());
        }

        currentDate = nextMonth;
        break;
      }
      case 'yearly': {
        // 새로운 Date 객체를 생성하여 정확한 날짜 계산
        const nextYear = new Date(
          currentDate.getFullYear() + repeatInfo.interval,
          startDate.getMonth(),
          startDate.getDate()
        );

        // 윤년 29일 문제 처리 - 생성된 날짜가 원하는 날짜와 다른 경우 조정
        if (startDate.getDate() === 29 && startDate.getMonth() === 1) {
          const isLeapYear = new Date(nextYear.getFullYear(), 1, 29).getDate() === 29;
          if (!isLeapYear) {
            // 평년인 경우 2월 28일로 설정
            nextYear.setMonth(1); // 2월
            nextYear.setDate(28);
          }
        }
        currentDate = nextYear;
        break;
      }
    }
  }

  return events;
};
