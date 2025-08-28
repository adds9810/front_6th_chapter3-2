describe('반복 일정 E2E 테스트', () => {
  beforeEach(() => {
    // 각 테스트 전에 메인 페이지 방문
    cy.visit('/');
  });

  describe('반복 일정 생성', () => {
    it('매일 반복 일정을 생성할 수 있다', () => {
      // Given: 2025-08-25 09:00에 시작하는 일정 생성 폼
      // When: 반복 유형을 2025-08-30까지 "매일"로 선택한 후에 일정을 추가
      cy.fillRecurringEventForm('매일 회의', '2025-08-25', '09:00', '10:00', 'daily', '2025-08-30');

      // Then: 2025-08-25부터 2025-08-30까지 매일 동일 시간대의 이벤트가 표시된다
      cy.verifyRecurringEventDisplay(['25', '26', '27', '28', '29', '30'], true);
    });

    it('매주 반복 일정을 생성할 수 있다', () => {
      // Given: 2025-08-25 (월요일) 09:00에 시작하는 일정 생성 폼
      // When: 반복 유형을 2025-09-08 (월요일)까지 "매주"로 선택한 후에 일정을 추가
      cy.fillRecurringEventForm(
        '주간 회의',
        '2025-08-25',
        '09:00',
        '10:00',
        'weekly',
        '2025-09-08'
      );

      // Then: 2025-08-25, 2025-09-01, 2025-09-08에 이벤트가 표시된다
      cy.verifyRecurringEventDisplay(['25', '1', '8'], true);
    });

    it('매월 반복 일정을 생성할 수 있다', () => {
      // Given: 2025-08-01 09:00에 시작하는 일정 생성 폼
      // When: 반복 유형을 11월까지 "매월"로 선택한 후에 일정을 추가
      cy.fillRecurringEventForm(
        '월간 회의',
        '2025-08-01',
        '09:00',
        '10:00',
        'monthly',
        '2025-11-01'
      );

      // Then: 8월부터 11월까지 매월 이벤트가 표시된다
      cy.verifyRecurringEventDisplay(['1'], true);
    });

    it('매년 반복 일정을 생성할 수 있다', () => {
      // Given: 2025-08-25 09:00에 시작하는 일정 생성 폼
      // When: 반복 유형을 2027까지 "매년"으로 선택한 후에 일정을 추가
      cy.fillRecurringEventForm(
        '연간 회의',
        '2025-08-25',
        '09:00',
        '10:00',
        'yearly',
        '2027-08-25'
      );

      // Then: 08-25 09:00에 매년 이벤트가 표시된다
      cy.verifyRecurringEventDisplay(['25'], true);
    });
  });

  describe('반복 일정 표시', () => {
    it('반복 일정에 반복 아이콘이 표시된다', () => {
      // Given: 반복 일정이 존재하는 상태
      cy.fillRecurringEventForm(
        '테스트 일정',
        '2025-08-25',
        '09:00',
        '10:00',
        'daily',
        '2025-08-27'
      );

      // When: 캘린더가 렌더링된다
      // Then: 반복 일정 아이콘이 표시된다
      cy.get('[data-testid="week-view"]').find('svg[data-testid="RepeatIcon"]').should('exist');
    });

    it('단일 일정에는 반복 아이콘이 표시되지 않는다', () => {
      // Given: 반복 일정이 존재하지 않는 상태
      // When: 캘린더가 렌더링된다
      // Then: 반복 일정 아이콘이 표시되지 않는다
      cy.get('[data-testid="week-view"]').find('svg[data-testid="RepeatIcon"]').should('not.exist');
    });
  });

  describe('반복 종료 조건', () => {
    it('유효한 종료일을 설정할 수 있다', () => {
      // Given: 일정 생성 폼에서
      // When: 2025-08-25부터 2025-09-10까지 주간 반복 일정을 생성
      cy.fillRecurringEventForm(
        '테스트 일정',
        '2025-08-25',
        '09:00',
        '10:00',
        'weekly',
        '2025-09-10'
      );

      // Then: 2025-09-01과 2025-09-08에 해당하는 반복 일정만 2개 생성된다
      cy.verifyRecurringEventDisplay(['25', '1', '8'], true);
    });

    it('시작일 이전의 종료일을 설정하면 에러가 발생한다', () => {
      // Given: 일정 생성 폼에서
      // When: 시작일과 같거나 이전인 종료일을 선택하고 생성
      cy.fillRecurringEventForm(
        '테스트 일정',
        '2025-08-25',
        '09:00',
        '10:00',
        'daily',
        '2025-08-20'
      );

      // Then: "종료일은 시작일 이후여야 합니다" 토스트 메시지가 표시되고 에러 처리가 발생한다
      cy.contains('종료일은 시작일 이후여야 합니다').should('be.visible');
    });
  });

  describe('반복 일정 단일 수정', () => {
    it('반복 일정의 개별 발생을 수정할 수 있다', () => {
      // Given: 월요일 09:00에 주간 반복 일정이 존재
      cy.fillRecurringEventForm(
        '주간 회의',
        '2025-08-25',
        '09:00',
        '10:00',
        'weekly',
        '2025-09-08'
      );

      // When: 2025-09-01 09:00 이벤트의 제목을 변경
      cy.contains('2025-09-01').parent().find('[aria-label="Edit event"]').click();
      cy.get('#title').clear().type('수정된 주간 회의');
      cy.get('[data-testid="event-submit-button"]').click();

      // Then: 2025-09-01 09:00 이벤트의 제목이 변경된다
      cy.contains('수정된 주간 회의').should('be.visible');
    });
  });

  describe('반복 일정 단일 삭제', () => {
    it('반복 일정의 개별 발생을 삭제할 수 있다', () => {
      // Given: 09:00에 매일 반복 일정이 존재
      cy.fillRecurringEventForm('매일 회의', '2025-08-25', '09:00', '10:00', 'daily', '2025-08-29');

      // When: 2025-08-27 09:00 이벤트를 삭제
      cy.contains('2025-08-27').parent().find('[aria-label="Delete event"]').click();

      // Then: 2025-08-27 09:00 이벤트가 캘린더에서 사라진다
      cy.contains('2025-08-27').should('not.exist');
      cy.contains('2025-08-25').should('exist');
      cy.contains('2025-08-26').should('exist');
      cy.contains('2025-08-28').should('exist');
      cy.contains('2025-08-29').should('exist');
    });
  });
});
