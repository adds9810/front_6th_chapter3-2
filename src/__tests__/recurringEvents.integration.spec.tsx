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

  it('반복 일정 체크박스를 체크하면 반복 설정 필드들이 나타난다', async () => {
    const { user } = setup(<App />);

    // 이미 일정 추가 폼이 열려있으므로 바로 반복 일정 체크박스를 찾기
    const repeatCheckbox = screen.getByLabelText('반복 일정');
    expect(repeatCheckbox).toBeInTheDocument();

    // 반복 일정 체크박스를 체크
    await user.click(repeatCheckbox);

    // 반복 설정 필드들이 나타나는지 확인 (가장 기본적인 것만)
    await waitFor(() => {
      expect(screen.getByText('반복 유형')).toBeInTheDocument();
    });

    // Select 컴포넌트가 나타나는지 확인 (클릭하지 않고 존재만 확인)
    expect(screen.getByTestId('repeat-type-select')).toBeInTheDocument();
  });
});
