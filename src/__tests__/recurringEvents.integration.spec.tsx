import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { SnackbarProvider } from 'notistack';
import { ReactElement } from 'react';

import App from '../App';

const theme = createTheme();

const setup = (element: ReactElement) => {
  const user = userEvent.setup();

  return {
    ...render(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider>{element}</SnackbarProvider>
      </ThemeProvider>
    ),
    user,
  };
};

// MSW 서버 설정
const server = setupServer(
  // 이벤트 목록 조회 API
  http.get('/api/events', () => {
    return HttpResponse.json({ events: [] });
  }),

  // 반복 일정 생성 API
  http.post('/api/events-list', () => {
    return HttpResponse.json({ success: true });
  }),

  // 일반 일정 API
  http.post('/api/events', () => {
    return HttpResponse.json({ success: true });
  }),

  // 일정 수정 API
  http.put('/api/events/:id', () => {
    return HttpResponse.json({ success: true });
  }),

  // 일정 삭제 API
  http.delete('/api/events/:id', () => {
    return HttpResponse.json({ success: true });
  })
);

// 테스트 전후 설정
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('반복 일정 통합 테스트', () => {
  it('매일 반복: 달력에 여러 날짜에 걸쳐 일정 표시', async () => {
    const { user } = setup(<App />);

    // 폼이 렌더링되었는지 확인
    expect(screen.getByRole('heading', { name: '일정 추가' })).toBeInTheDocument();

    // 반복 일정 체크박스가 이미 체크되어 있는지 확인 (useEventForm의 초기값)
    const repeatCheckbox = screen.getByLabelText('반복 일정') as HTMLInputElement;
    expect(repeatCheckbox).toBeInTheDocument();

    // 반복 설정 필드들이 나타나는지 확인 (isRepeating이 true일 때)
    await waitFor(() => {
      expect(screen.getByText('반복 유형')).toBeInTheDocument();
      expect(screen.getByText('반복 간격')).toBeInTheDocument();
    });

    // 기본 일정 정보 입력
    await user.type(screen.getByLabelText('제목'), '매일 아침 조깅');
    await user.type(screen.getByLabelText('날짜'), '2024-01-15');
    await user.type(screen.getByLabelText('시작 시간'), '07:00');
    await user.type(screen.getByLabelText('종료 시간'), '08:00');

    // 반복 유형을 '매일'로 설정 (기본값이 'none'이므로 변경 필요)
    const repeatTypeSelect = screen.getByDisplayValue('반복 없음');
    await user.click(repeatTypeSelect);
    await user.click(screen.getByText('매일'));

    // 반복 간격과 종료일 설정
    await user.type(screen.getByLabelText('반복 간격'), '1');
    await user.type(screen.getByLabelText('반복 종료일'), '2024-01-17');

    // 일정 추가
    const submitButton = screen.getByTestId('event-submit-button');
    await user.click(submitButton);

    // 성공 메시지 확인
    await waitFor(() => {
      expect(screen.getByText('3개의 반복 일정이 생성되었습니다.')).toBeInTheDocument();
    });

    // 달력에서 여러 날짜에 일정이 표시되는지 확인
    const calendarGrid = screen.getByTestId('month-view');

    // 15일, 16일, 17일에 일정이 표시되는지 확인
    for (let day = 15; day <= 17; day++) {
      const dayCell = within(calendarGrid).getByText(String(day));
      const dayContainer = dayCell.closest('td');
      expect(within(dayContainer as HTMLElement).getByText('매일 아침 조깅')).toBeInTheDocument();
    }
  });

  it('단일 인스턴스 수정: 반복 일정 중 하나 수정 시 해당 날짜만 단일 일정으로 변경', async () => {
    // 기존 반복 일정이 있는 상태로 MSW 설정
    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json({
          events: [
            {
              id: '1',
              title: '주간 회의',
              date: '2024-01-15',
              startTime: '10:00',
              endTime: '11:00',
              description: '주간 팀 미팅',
              location: '회의실 A',
              category: '업무',
              repeat: {
                type: 'weekly',
                interval: 1,
                endDate: '2024-01-29',
              },
              notificationTime: 10,
            },
          ],
        });
      })
    );

    const { user } = setup(<App />);

    // 기존 일정이 로드될 때까지 대기
    await waitFor(() => {
      expect(screen.getByText('주간 회의')).toBeInTheDocument();
    });

    // 1월 22일(월요일)의 일정을 편집
    const eventBoxes = screen.getAllByText('주간 회의');
    const secondEventBox = eventBoxes[1]; // 두 번째 인스턴스
    const editButton = within(secondEventBox.closest('div') as HTMLElement).getByLabelText(
      'Edit event'
    );
    await user.click(editButton);

    // 편집 모드로 변경되었는지 확인
    expect(screen.getByText('일정 수정')).toBeInTheDocument();

    // 제목 수정
    const titleInput = screen.getByLabelText('제목');
    await user.clear(titleInput);
    await user.type(titleInput, '수정된 회의');

    // 수정 완료
    const submitButton = screen.getByTestId('event-submit-button');
    await user.click(submitButton);

    // 성공 메시지 확인
    await waitFor(() => {
      expect(
        screen.getByText('반복 일정 중 하나가 단일 일정으로 수정되었습니다.')
      ).toBeInTheDocument();
    });

    // 1월 22일에는 수정된 일정이, 1월 29일에는 원래 일정이 표시되는지 확인
    const calendarGrid = screen.getByTestId('month-view');

    // 1월 22일에는 수정된 일정
    const day22Cell = within(calendarGrid).getByText('22');
    const day22Container = day22Cell.closest('td');
    expect(within(day22Container as HTMLElement).getByText('수정된 회의')).toBeInTheDocument();

    // 1월 29일에는 원래 일정
    const day29Cell = within(calendarGrid).getByText('29');
    const day29Container = day29Cell.closest('td');
    expect(within(day29Container as HTMLElement).getByText('주간 회의')).toBeInTheDocument();
  });

  it('단일 인스턴스 삭제: 반복 일정 중 하나 삭제 시 해당 날짜만 사라짐', async () => {
    // 기존 반복 일정이 있는 상태로 MSW 설정
    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json({
          events: [
            {
              id: '1',
              title: '매일 회의',
              date: '2024-01-15',
              startTime: '09:00',
              endTime: '10:00',
              description: '일일 스탠드업',
              location: '회의실 B',
              category: '업무',
              repeat: {
                type: 'daily',
                interval: 1,
                endDate: '2024-01-17',
              },
              notificationTime: 10,
            },
          ],
        });
      })
    );

    const { user } = setup(<App />);

    // 기존 일정이 로드될 때까지 대기
    await waitFor(() => {
      expect(screen.getByText('매일 회의')).toBeInTheDocument();
    });

    // 1월 16일의 일정을 삭제
    const eventBoxes = screen.getAllByText('매일 회의');
    const secondEventBox = eventBoxes[1]; // 두 번째 인스턴스
    const deleteButton = within(secondEventBox.closest('div') as HTMLElement).getByLabelText(
      'Delete event'
    );
    await user.click(deleteButton);

    // 삭제 확인 다이얼로그가 나타나는지 확인
    await waitFor(() => {
      expect(screen.getByText('일정을 삭제하시겠습니까?')).toBeInTheDocument();
    });

    // 삭제 확인
    const confirmButton = screen.getByText('삭제');
    await user.click(confirmButton);

    // 성공 메시지 확인
    await waitFor(() => {
      expect(screen.getByText('반복 일정 중 하나만 삭제되었습니다.')).toBeInTheDocument();
    });

    // 1월 16일에는 일정이 사라지고, 1월 15일과 17일에는 여전히 표시되는지 확인
    const calendarGrid = screen.getByTestId('month-view');

    // 1월 15일에는 일정이 표시됨
    const day15Cell = within(calendarGrid).getByText('15');
    const day15Container = day15Cell.closest('td');
    expect(within(day15Container as HTMLElement).getByText('매일 회의')).toBeInTheDocument();

    // 1월 16일에는 일정이 표시되지 않음
    const day16Cell = within(calendarGrid).getByText('16');
    const day16Container = day16Cell.closest('td');
    expect(within(day16Container as HTMLElement).queryByText('매일 회의')).not.toBeInTheDocument();

    // 1월 17일에는 일정이 표시됨
    const day17Cell = within(calendarGrid).getByText('17');
    const day17Container = day17Cell.closest('td');
    expect(within(day17Container as HTMLElement).getByText('매일 회의')).toBeInTheDocument();
  });

  it('원본 반복 일정 관리: 원본 수정 시 모든 미래 가상 일정 변경, 원본 삭제 시 모든 가상 일정 제거', async () => {
    // 기존 반복 일정이 있는 상태로 MSW 설정
    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json({
          events: [
            {
              id: '1',
              title: '원본 주간 회의',
              date: '2024-01-15',
              startTime: '14:00',
              endTime: '15:00',
              description: '원본 주간 팀 미팅',
              location: '회의실 C',
              category: '업무',
              repeat: {
                type: 'weekly',
                interval: 1,
                endDate: '2024-01-29',
              },
              notificationTime: 10,
            },
          ],
        });
      })
    );

    const { user } = setup(<App />);

    // 기존 일정이 로드될 때까지 대기
    await waitFor(() => {
      expect(screen.getByText('원본 주간 회의')).toBeInTheDocument();
    });

    // 원본 일정(1월 15일)을 편집
    const eventBoxes = screen.getAllByText('원본 주간 회의');
    const originalEventBox = eventBoxes[0]; // 첫 번째 인스턴스 (원본)
    const editButton = within(originalEventBox.closest('div') as HTMLElement).getByLabelText(
      'Edit event'
    );
    await user.click(editButton);

    // 편집 모드로 변경되었는지 확인
    expect(screen.getByText('일정 수정')).toBeInTheDocument();

    // 제목 수정
    const titleInput = screen.getByLabelText('제목');
    await user.clear(titleInput);
    await user.type(titleInput, '전사 타운홀 미팅');

    // 수정 완료
    const submitButton = screen.getByTestId('event-submit-button');
    await user.click(submitButton);

    // 성공 메시지 확인
    await waitFor(() => {
      expect(screen.getByText('일정이 수정되었습니다.')).toBeInTheDocument();
    });

    // 모든 미래 가상 일정이 함께 변경되었는지 확인
    const calendarGrid = screen.getByTestId('month-view');

    // 1월 15일, 22일, 29일에 모두 수정된 일정이 표시되는지 확인
    for (let day = 15; day <= 29; day += 7) {
      const dayCell = within(calendarGrid).getByText(String(day));
      const dayContainer = dayCell.closest('td');
      expect(within(dayContainer as HTMLElement).getByText('전사 타운홀 미팅')).toBeInTheDocument();
    }

    // 이제 원본 일정을 삭제
    const updatedEventBoxes = screen.getAllByText('전사 타운홀 미팅');
    const originalUpdatedEventBox = updatedEventBoxes[0]; // 첫 번째 인스턴스 (원본)
    const deleteButton = within(
      originalUpdatedEventBox.closest('div') as HTMLElement
    ).getByLabelText('Delete event');
    await user.click(deleteButton);

    // 삭제 확인 다이얼로그가 나타나는지 확인
    await waitFor(() => {
      expect(screen.getByText('일정을 삭제하시겠습니까?')).toBeInTheDocument();
    });

    // 삭제 확인
    const confirmButton = screen.getByText('삭제');
    await user.click(confirmButton);

    // 성공 메시지 확인
    await waitFor(() => {
      expect(screen.getByText('일정이 삭제되었습니다.')).toBeInTheDocument();
    });

    // 모든 가상 일정이 함께 사라졌는지 확인
    for (let day = 15; day <= 29; day += 7) {
      const dayCell = within(calendarGrid).getByText(String(day));
      const dayContainer = dayCell.closest('td');
      expect(
        within(dayContainer as HTMLElement).queryByText('전사 타운홀 미팅')
      ).not.toBeInTheDocument();
    }
  });
});
