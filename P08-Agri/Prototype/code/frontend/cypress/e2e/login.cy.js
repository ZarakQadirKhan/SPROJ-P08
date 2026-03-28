/**
 * Login flow with mocked API — uses shared cy.loginWithMock from support/commands.js.
 */
describe('Login (mocked API)', () => {
  beforeEach(() => {
    cy.viewport(1280, 800)
  })

  it('logs in as farmer and lands on farmer dashboard', () => {
    cy.loginWithMock('farmer')
    cy.url().should('include', '/farmer-dashboard')
    cy.contains('Test Farmer', { matchCase: false })
  })
})
