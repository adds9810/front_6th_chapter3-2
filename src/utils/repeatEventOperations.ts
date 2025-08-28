import { Event, EventForm } from '../types';

// 상수 정의
const API_ENDPOINTS = {
  EVENTS: '/api/events',
  EVENTS_LIST: '/api/events-list',
} as const;

const HTTP_METHODS = {
  PUT: 'PUT',
  DELETE: 'DELETE',
} as const;

const HEADERS = {
  CONTENT_TYPE: 'application/json',
} as const;

// 에러 메시지
const ERROR_MESSAGES = {
  MODIFY_FAILED: 'Failed to modify repeat event',
  DELETE_FAILED: 'Failed to delete repeat event',
  GROUP_MODIFY_FAILED: 'Failed to modify repeat event group',
  GROUP_DELETE_FAILED: 'Failed to delete repeat event group',
} as const;

// 타입 정의
type ApiResponse<T> = Promise<T>;
type EventUpdate = Partial<EventForm>;

// 유틸리티 함수
const createApiRequest = (url: string, method: string, body?: string) => ({
  method,
  headers: { 'Content-Type': HEADERS.CONTENT_TYPE },
  ...(body && { body }),
});

const handleApiResponse = async (response: Response, errorMessage: string) => {
  if (!response.ok) {
    throw new Error(errorMessage);
  }
  return response;
};

// 반복 일정 수정 - 독립 이벤트로 변환
export const modifyRepeatEvent = async (event: Event, updates: EventUpdate): Promise<Event> => {
  const modifiedEvent: Event = {
    ...event,
    ...updates,
    repeat: {
      type: 'none',
      interval: 1,
      endDate: undefined,
      repeatId: undefined,
    },
  };

  const response = await fetch(
    `${API_ENDPOINTS.EVENTS}/${event.id}`,
    createApiRequest(`${API_ENDPOINTS.EVENTS}/${event.id}`, HTTP_METHODS.PUT, JSON.stringify(modifiedEvent))
  );

  await handleApiResponse(response, ERROR_MESSAGES.MODIFY_FAILED);
  return modifiedEvent;
};

// 반복 일정 삭제 - 해당 일정만 삭제
export const deleteRepeatEvent = async (eventId: string): Promise<void> => {
  const response = await fetch(
    `${API_ENDPOINTS.EVENTS}/${eventId}`,
    createApiRequest(`${API_ENDPOINTS.EVENTS}/${eventId}`, HTTP_METHODS.DELETE)
  );

  await handleApiResponse(response, ERROR_MESSAGES.DELETE_FAILED);
};

// 반복 일정 그룹 전체 수정
export const modifyRepeatEventGroup = async (events: Event[], updates: EventUpdate): Promise<Event[]> => {
  const updatedEvents = events.map(event => ({
    ...event,
    ...updates,
  }));

  const response = await fetch(
    API_ENDPOINTS.EVENTS_LIST,
    createApiRequest(API_ENDPOINTS.EVENTS_LIST, HTTP_METHODS.PUT, JSON.stringify({ events: updatedEvents }))
  );

  await handleApiResponse(response, ERROR_MESSAGES.GROUP_MODIFY_FAILED);
  return updatedEvents;
};

// 반복 일정 그룹 전체 삭제
export const deleteRepeatEventGroup = async (eventIds: string[]): Promise<void> => {
  const response = await fetch(
    API_ENDPOINTS.EVENTS_LIST,
    createApiRequest(API_ENDPOINTS.EVENTS_LIST, HTTP_METHODS.DELETE, JSON.stringify({ eventIds }))
  );

  await handleApiResponse(response, ERROR_MESSAGES.GROUP_DELETE_FAILED);
};
