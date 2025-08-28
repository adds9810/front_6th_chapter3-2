import { EventForm, RepeatInfo } from '../types';

// 상수 정의
const DEFAULT_END_DATE = '2025-10-30';
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const MILLISECONDS_PER_WEEK = 7 * MILLISECONDS_PER_DAY;
const FEBRUARY_MONTH = 1; // JavaScript Date에서 2월은 1
const LEAP_YEAR_DAY = 29;

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

const calculateNextMonthlyDate = (currentDate: Date, startDate: Date, interval: number): Date => {
  const nextMonth = new Date(currentDate);
  nextMonth.setDate(1);
  nextMonth.setMonth(nextMonth.getMonth() + interval);

  const originalDay = startDate.getDate();
  if (originalDay === 31) {
    // 31일인 경우 해당 월의 마지막 날로 조정
    const lastDay = getLastDayOfMonth(nextMonth.getFullYear(), nextMonth.getMonth());
    nextMonth.setDate(Math.min(31, lastDay));
  } else {
    nextMonth.setDate(originalDay);
  }

  return nextMonth;
};

const calculateNextYearlyDate = (currentDate: Date, startDate: Date, interval: number): Date => {
  const nextYear = new Date(
    currentDate.getFullYear() + interval,
    startDate.getMonth(),
    startDate.getDate()
  );

  // 윤년 29일 문제 처리
  if (startDate.getDate() === LEAP_YEAR_DAY && startDate.getMonth() === FEBRUARY_MONTH) {
    if (!isLeapYear(nextYear.getFullYear())) {
      nextYear.setMonth(FEBRUARY_MONTH);
      nextYear.setDate(28);
    }
  }

  return nextYear;
};

const calculateNextDate = (currentDate: Date, startDate: Date, repeatInfo: RepeatInfo): Date => {
  switch (repeatInfo.type) {
    case 'daily':
      return addDays(currentDate, repeatInfo.interval);
    case 'weekly':
      return addWeeks(currentDate, repeatInfo.interval);
    case 'monthly':
      return calculateNextMonthlyDate(currentDate, startDate, repeatInfo.interval);
    case 'yearly':
      return calculateNextYearlyDate(currentDate, startDate, repeatInfo.interval);
    default:
      throw new Error(`Unsupported repeat type: ${repeatInfo.type}`);
  }
};

export const generateRepeatEvents = (baseEvent: EventForm, repeatInfo: RepeatInfo): EventForm[] => {
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

  while (currentDate <= endDate) {
    events.push({
      ...baseEvent,
      date: formatDateToString(currentDate),
    });

    currentDate = calculateNextDate(currentDate, startDate, repeatInfo);
  }

  return events;
};
