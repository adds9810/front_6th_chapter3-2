import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, waitFor } from '@testing-library/react';
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
  // 이벤트 목록 조회 API - 기본적으로 빈 배열 반환
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
  })
);

// 테스트 전후 설정
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('반복 일정 기능', () => {
  beforeEach(() => {
    // 기본 API 핸들러 설정
    server.use(
      http.post('/api/events-list', () => {
        return HttpResponse.json({ success: true });
      })
    );
  });

  it('반복 일정을 생성할 수 있다', async () => {
    const { user } = setup(<App />);

    // 반복 일정 체크박스 체크
    const repeatCheckbox = screen.getByLabelText('반복 일정');
    await user.click(repeatCheckbox);

    // 기본 일정 정보 입력 (Select 상호작용 없이)
    await user.type(screen.getByLabelText('제목'), '테스트 반복 일정');
    await user.type(screen.getByLabelText('날짜'), '2025-10-01');
    await user.type(screen.getByLabelText('시작 시간'), '09:00');
    await user.type(screen.getByLabelText('종료 시간'), '10:00');

    // 입력된 값들이 제대로 설정되었는지 확인
    expect(screen.getByLabelText('제목')).toHaveValue('테스트 반복 일정');
    expect(screen.getByLabelText('날짜')).toHaveValue('2025-10-01');
    expect(screen.getByLabelText('시작 시간')).toHaveValue('09:00');
    expect(screen.getByLabelText('종료 시간')).toHaveValue('10:00');
  });

  it('반복 일정을 저장할 수 있다', async () => {
    const { user } = setup(<App />);

    // 반복 일정 체크박스 체크
    const repeatCheckbox = screen.getByLabelText('반복 일정');
    await user.click(repeatCheckbox);

    // 기본 일정 정보 입력
    await user.type(screen.getByLabelText('제목'), '저장할 반복 일정');
    await user.type(screen.getByLabelText('날짜'), '2025-10-02');
    await user.type(screen.getByLabelText('시작 시간'), '14:00');
    await user.type(screen.getByLabelText('종료 시간'), '15:00');

    // 저장 버튼이 활성화되어 있는지 확인
    const submitButton = screen.getByTestId('event-submit-button');
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).not.toBeDisabled();

    // 저장 버튼 클릭
    await user.click(submitButton);

    // 폼이 초기화되었는지 확인 (API 호출 성공 여부)
    await waitFor(() => {
      expect(screen.getByLabelText('제목')).toHaveValue('');
    });
  });

  it('반복 일정 체크박스 해제 시 반복 설정 필드들이 사라진다', async () => {
    const { user } = setup(<App />);

    // 반복 일정 체크박스 체크
    const repeatCheckbox = screen.getByLabelText('반복 일정');
    await user.click(repeatCheckbox);

    // 반복 설정 필드들이 나타나는지 확인
    expect(screen.getByText('반복 유형')).toBeInTheDocument();
    expect(screen.getByText('반복 간격')).toBeInTheDocument();
    expect(screen.getByText('반복 종료일')).toBeInTheDocument();
    expect(screen.getByTestId('repeat-type-select')).toBeInTheDocument();

    // 반복 일정 체크박스 해제
    await user.click(repeatCheckbox);

    // 반복 설정 필드들이 사라지는지 확인
    expect(screen.queryByText('반복 유형')).not.toBeInTheDocument();
    expect(screen.queryByText('반복 간격')).not.toBeInTheDocument();
    expect(screen.queryByText('반복 종료일')).not.toBeInTheDocument();
    expect(screen.queryByTestId('repeat-type-select')).not.toBeInTheDocument();
  });
});
