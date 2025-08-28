import { Event, EventForm } from '../types';

// 반복 일정 수정 - 독립 이벤트로 변환
export const modifyRepeatEvent = async (event: Event, updates: Partial<EventForm>): Promise<Event> => {
  // 반복 일정을 독립 이벤트로 변환
  const modifiedEvent: Event = {
    ...event,
    ...updates,
    repeat: {
      type: 'none',
      interval: 1,
      endDate: undefined,
      repeatId: undefined, // repeatId 제거
    },
  };

  const response = await fetch(`/api/events/${event.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(modifiedEvent),
  });

  if (!response.ok) {
    throw new Error('Failed to modify repeat event');
  }

  return modifiedEvent;
};

// 반복 일정 삭제 - 해당 일정만 삭제
export const deleteRepeatEvent = async (eventId: string): Promise<void> => {
  const response = await fetch(`/api/events/${eventId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete repeat event');
  }
};

// 반복 일정 그룹 전체 수정
export const modifyRepeatEventGroup = async (events: Event[], updates: Partial<EventForm>): Promise<Event[]> => {
  const updatedEvents = events.map(event => ({
    ...event,
    ...updates,
  }));

  const response = await fetch('/api/events-list', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events: updatedEvents }),
  });

  if (!response.ok) {
    throw new Error('Failed to modify repeat event group');
  }

  return updatedEvents;
};

// 반복 일정 그룹 전체 삭제
export const deleteRepeatEventGroup = async (eventIds: string[]): Promise<void> => {
  const response = await fetch('/api/events-list', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventIds }),
  });

  if (!response.ok) {
    throw new Error('Failed to delete repeat event group');
  }
};
