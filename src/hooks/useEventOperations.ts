import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';

import { Event, EventForm } from '../types';
import { generateRepeatEvents } from '../utils/repeatEventGeneration';

export const useEventOperations = (editing: boolean, onSave?: () => void) => {
  const [events, setEvents] = useState<Event[]>([]);
  const { enqueueSnackbar } = useSnackbar();

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const { events } = await response.json();
      setEvents(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      enqueueSnackbar('이벤트 로딩 실패', { variant: 'error' });
    }
  };

  const saveEvent = async (eventData: Event | EventForm) => {
    try {
      let response;

      // 반복 일정인 경우 여러 개의 이벤트를 생성
      if (!editing && eventData.repeat.type !== 'none') {
        const repeatEvents = generateRepeatEvents(eventData, eventData.repeat);

        // 반복 일정들을 서버에 저장
        const savePromises = repeatEvents.map(async (event) => {
          const response = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
          });

          if (!response.ok) {
            throw new Error('Failed to save repeat event');
          }

          return response.json();
        });

        await Promise.all(savePromises);
        enqueueSnackbar(`${repeatEvents.length}개의 반복 일정이 생성되었습니다.`, {
          variant: 'success',
        });
      } else {
        // 일반 일정 또는 수정
        if (editing) {
          response = await fetch(`/api/events/${(eventData as Event).id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData),
          });
        } else {
          response = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData),
          });
        }

        if (!response.ok) {
          throw new Error('Failed to save event');
        }

        enqueueSnackbar(editing ? '일정이 수정되었습니다.' : '일정이 추가되었습니다.', {
          variant: 'success',
        });
      }

      await fetchEvents();
      onSave?.();
    } catch (error) {
      console.error('Error saving event:', error);
      enqueueSnackbar('일정 저장 실패', { variant: 'error' });
    }
  };

  // 반복 일정 수정 - 독립 이벤트로 변환
  const modifyRepeatEvent = async (event: Event, updates: Partial<EventForm>): Promise<Event> => {
    try {
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

      await fetchEvents();
      enqueueSnackbar('반복 일정이 독립 일정으로 변환되었습니다.', { variant: 'success' });

      return modifiedEvent;
    } catch (error) {
      console.error('Error modifying repeat event:', error);
      enqueueSnackbar('반복 일정 수정 실패', { variant: 'error' });
      throw error;
    }
  };

  // 반복 일정 삭제 - 해당 일정만 삭제
  const deleteRepeatEvent = async (eventId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete repeat event');
      }

      await fetchEvents();
      enqueueSnackbar('반복 일정이 삭제되었습니다.', { variant: 'info' });
    } catch (error) {
      console.error('Error deleting repeat event:', error);
      enqueueSnackbar('반복 일정 삭제 실패', { variant: 'error' });
      throw error;
    }
  };

  // 반복 일정 그룹 전체 수정
  const modifyRepeatEventGroup = async (
    events: Event[],
    updates: Partial<EventForm>
  ): Promise<Event[]> => {
    try {
      const updatedEvents = events.map((event) => ({
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

      await fetchEvents();
      enqueueSnackbar('반복 일정 그룹이 수정되었습니다.', { variant: 'success' });

      return updatedEvents;
    } catch (error) {
      console.error('Error modifying repeat event group:', error);
      enqueueSnackbar('반복 일정 그룹 수정 실패', { variant: 'error' });
      throw error;
    }
  };

  // 반복 일정 그룹 전체 삭제
  const deleteRepeatEventGroup = async (eventIds: string[]): Promise<void> => {
    try {
      const response = await fetch('/api/events-list', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete repeat event group');
      }

      await fetchEvents();
      enqueueSnackbar('반복 일정 그룹이 삭제되었습니다.', { variant: 'info' });
    } catch (error) {
      console.error('Error deleting repeat event group:', error);
      enqueueSnackbar('반복 일정 그룹 삭제 실패', { variant: 'error' });
      throw error;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/events/${id}`, { method: 'DELETE' });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      await fetchEvents();
      enqueueSnackbar('일정이 삭제되었습니다.', { variant: 'info' });
    } catch (error) {
      console.error('Error deleting event:', error);
      enqueueSnackbar('일정 삭제 실패', { variant: 'error' });
    }
  };

  async function init() {
    await fetchEvents();
    enqueueSnackbar('일정 로딩 완료!', { variant: 'info' });
  }

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    events,
    fetchEvents,
    saveEvent,
    deleteEvent,
    modifyRepeatEvent,
    deleteRepeatEvent,
    modifyRepeatEventGroup,
    deleteRepeatEventGroup,
  };
};
