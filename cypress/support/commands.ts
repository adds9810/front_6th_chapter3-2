// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * 반복 일정 생성 폼을 작성하는 커스텀 명령어
       */
      fillRecurringEventForm(
        title: string,
        date: string,
        startTime: string,
        endTime: string,
        repeatType: 'daily' | 'weekly' | 'monthly' | 'yearly',
        endDate?: string
      ): Chainable<void>;

      /**
       * 반복 일정이 올바르게 표시되는지 확인하는 커스텀 명령어
       */
      verifyRecurringEventDisplay(expectedDates: string[], hasRepeatIcon: boolean): Chainable<void>;
    }
  }
}

// 반복 일정 생성 폼 작성
Cypress.Commands.add(
  'fillRecurringEventForm',
  (
    title: string,
    date: string,
    startTime: string,
    endTime: string,
    repeatType: 'daily' | 'weekly' | 'monthly' | 'yearly',
    endDate?: string
  ) => {
    // 기본 정보 입력
    cy.get('#title').type(title);
    cy.get('#date').type(date);
    cy.get('#start-time').type(startTime);
    cy.get('#end-time').type(endTime);

    // 반복 일정 체크박스 활성화
    cy.get('input[type="checkbox"]').check();

    // 반복 유형 선택
    cy.get('select').eq(1).select(repeatType);

    // 반복 종료일 설정 (있는 경우)
    if (endDate) {
      cy.get('input[type="date"]').eq(1).type(endDate);
    }

    // 일정 추가 버튼 클릭
    cy.get('[data-testid="event-submit-button"]').click();
  }
);

// 반복 일정 표시 확인
Cypress.Commands.add(
  'verifyRecurringEventDisplay',
  (expectedDates: string[], hasRepeatIcon: boolean) => {
    expectedDates.forEach((date) => {
      cy.contains(date).should('be.visible');
    });

    if (hasRepeatIcon) {
      cy.get('[data-testid="week-view"], [data-testid="month-view"]')
        .find('svg[data-testid="RepeatIcon"]')
        .should('exist');
    }
  }
);
