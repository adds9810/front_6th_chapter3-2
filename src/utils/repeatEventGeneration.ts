import { EventForm, RepeatInfo } from '../types';

// 상수 정의
const DEFAULT_END_DATE = '2025-10-30';
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const MILLISECONDS_PER_WEEK = 7 * MILLISECONDS_PER_DAY;
const FEBRUARY_MONTH = 1; // JavaScript Date에서 2월은 1
const LEAP_YEAR_DAY = 29;

// 옵션 인터페이스
interface GenerateOptions {
  strictMode?: boolean; // true: BDD 모드 (건너뛰기), false: TDD 모드 (조정, 기본값)
}

// 헬퍼 함수들
const createDateFromString = (dateString: string): Date => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  return date;
};

const formatDateToString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const addDays = (date: Date, days: number): Date => {
  return new Date(date.getTime() + days * MILLISECONDS_PER_DAY);
};

const addWeeks = (date: Date, weeks: number): Date => {
  return new Date(date.getTime() + weeks * MILLISECONDS_PER_WEEK);
};

const getLastDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

const isLeapYear = (year: number): boolean => {
  return new Date(year, FEBRUARY_MONTH, LEAP_YEAR_DAY).getDate() === LEAP_YEAR_DAY;
};

const calculateNextMonthlyDate = (
  currentDate: Date,
  startDate: Date,
  interval: number,
  strictMode: boolean = false
): Date => {
  const nextMonth = new Date(currentDate);
  nextMonth.setDate(1);
  nextMonth.setMonth(nextMonth.getMonth() + interval);

  const originalDay = startDate.getDate();

  // 31일인 경우 특별 처리
  if (originalDay === 31) {
    const lastDay = getLastDayOfMonth(nextMonth.getFullYear(), nextMonth.getMonth());

    if (strictMode) {
      // BDD 모드: 31일이 있는 달에만 생성, 없는 달은 건너뛰기
      if (lastDay >= 31) {
        nextMonth.setDate(31);
      } else {
        // 31일이 없는 달은 건너뛰고 다음 달로
        return calculateNextMonthlyDate(nextMonth, startDate, interval, strictMode);
      }
    } else {
      // TDD 모드: 31일이 없는 달은 해당 월의 마지막 날로 조정
      nextMonth.setDate(Math.min(31, lastDay));
    }
  } else {
    nextMonth.setDate(originalDay);
  }

  return nextMonth;
};

const calculateNextYearlyDate = (
  currentDate: Date,
  startDate: Date,
  interval: number,
  strictMode: boolean = false
): Date => {
  const nextYear = new Date(
    currentDate.getFullYear() + interval,
    startDate.getMonth(),
    startDate.getDate()
  );

  // 윤년 29일 문제 처리
  if (startDate.getDate() === LEAP_YEAR_DAY && startDate.getMonth() === FEBRUARY_MONTH) {
    if (!isLeapYear(nextYear.getFullYear())) {
      if (strictMode) {
        // BDD 모드: 윤년이 아닌 해는 건너뛰고 다음 윤년으로
        return calculateNextYearlyDate(nextYear, startDate, interval, strictMode);
      } else {
        // TDD 모드: 윤년이 아닌 해는 2월 28일로 조정
        nextYear.setMonth(FEBRUARY_MONTH);
        nextYear.setDate(28);
      }
    }
  }

  return nextYear;
};

const calculateNextDate = (
  currentDate: Date,
  startDate: Date,
  repeatInfo: RepeatInfo,
  strictMode: boolean = false
): Date => {
  switch (repeatInfo.type) {
    case 'daily':
      return addDays(currentDate, repeatInfo.interval);
    case 'weekly':
      return addWeeks(currentDate, repeatInfo.interval);
    case 'monthly':
      return calculateNextMonthlyDate(currentDate, startDate, repeatInfo.interval, strictMode);
    case 'yearly':
      return calculateNextYearlyDate(currentDate, startDate, repeatInfo.interval, strictMode);
    default:
      throw new Error(`Unsupported repeat type: ${repeatInfo.type}`);
  }
};

export const generateRepeatEvents = (
  baseEvent: EventForm,
  repeatInfo: RepeatInfo,
  options: GenerateOptions = {}
): EventForm[] => {
  const { strictMode = false } = options;

  // 입력값 검증
  if (!baseEvent || !repeatInfo) {
    throw new Error('baseEvent and repeatInfo are required');
  }

  if (repeatInfo.type === 'none') {
    return [];
  }

  if (repeatInfo.interval < 1) {
    throw new Error('Interval must be at least 1');
  }

  const events: EventForm[] = [];
  const startDate = createDateFromString(baseEvent.date);
  const endDate = repeatInfo.endDate
    ? createDateFromString(repeatInfo.endDate)
    : createDateFromString(DEFAULT_END_DATE);

  if (startDate > endDate) {
    throw new Error('Start date cannot be after end date');
  }

  let currentDate = new Date(startDate);
  let attempts = 0;
  const maxAttempts = 1000; // 무한 루프 방지

  // 종료일까지 생성 (종료일 포함)
  while (currentDate <= endDate && attempts < maxAttempts) {
    events.push({
      ...baseEvent,
      date: formatDateToString(currentDate),
    });

    currentDate = calculateNextDate(currentDate, startDate, repeatInfo, strictMode);
    attempts++;
  }

  return events;
};
