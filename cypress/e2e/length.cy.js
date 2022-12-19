/// <reference types="cypress" />

import '../../src'

// ughh, cannot figure it out, why it shows it passing, when the assertion fails
// https://github.com/bahmutov/cypress-soft-assertions/issues/2
it('shows a warning', () => {
  // cy.wrap([1, 2, 3]).better('have.length', 3)
  // cy.wrap([1, 2, 3]).better('have.length', 4)
  // cy.wrap('foo').better('be.equal', 'bar')
  cy.wrap('foo').better('have.length', 4)
})
