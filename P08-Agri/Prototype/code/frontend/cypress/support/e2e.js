// Cypress support file — runs before every spec.

import './commands'

// Some React apps log async errors during E2E when APIs are mocked; avoid failing the run on benign ones.
Cypress.on('uncaught:exception', (err) => {
  // Axios / network errors after navigation are sometimes surfaced as uncaught
  if (err.message.includes('Network Error') || err.message.includes('Request failed')) {
    return false
  }
  return undefined
})
