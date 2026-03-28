const { defineConfig } = require('cypress')

/**
 * Cypress E2E config for Create React App (default dev server: http://localhost:3000).
 *
 * How to run:
 *  1) Terminal A: npm start
 *  2) Terminal B: npm run cypress:open   (interactive)  OR  npm run cypress:run   (headless)
 *
 * One-shot (starts app + runs tests): npm run test:e2e:ci
 */
module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.js',
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    setupNodeEvents() {
      // extend with plugins later if needed
    }
  }
})
