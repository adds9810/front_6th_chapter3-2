import { http, HttpResponse } from 'msw';

import { events } from '../__mocks__/response/events.json' assert { type: 'json' };
import { Event } from '../types';

export const handlers = [
  http.get('/api/events', () => {
    return HttpResponse.json({ events });
  }),

  http.post('/api/events', async ({ request }) => {
    const newEvent = (await request.json()) as Event;
    newEvent.id = String(events.length + 1);
    return HttpResponse.json(newEvent, { status: 201 });
  }),

  http.put('/api/events/:id', async ({ params, request }) => {
    const { id } = params;
    const updatedEvent = (await request.json()) as Event;
    
    // 테스트를 위해 항상 성공 응답 반환
    return HttpResponse.json(updatedEvent);
  }),

  http.delete('/api/events/:id', ({ params }) => {
    const { id } = params;
    
    // 테스트를 위해 항상 성공 응답 반환
    return new HttpResponse(null, { status: 204 });
  }),

  // 반복 일정 그룹 생성을 위한 엔드포인트
  http.post('/api/events-list', async ({ request }) => {
    const { events: newEvents } = await request.json();
    const eventsWithIds = newEvents.map((event: Event, index: number) => ({
      ...event,
      id: String(events.length + index + 1),
    }));
    return HttpResponse.json(eventsWithIds, { status: 201 });
  }),

  // 반복 일정 그룹 수정을 위한 엔드포인트
  http.put('/api/events-list', async ({ request }) => {
    const { events: updatedEvents } = await request.json();
    // 테스트를 위해 성공 응답 반환
    return HttpResponse.json(updatedEvents, { status: 200 });
  }),

  // 반복 일정 그룹 삭제를 위한 엔드포인트
  http.delete('/api/events-list', async ({ request }) => {
    const { eventIds } = await request.json();
    // 테스트를 위해 성공 응답 반환
    return new HttpResponse(null, { status: 204 });
  }),
];
