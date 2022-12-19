/// <reference types="cypress" />
// @ts-check

import '../../src'

// ughh, cannot figure it out, why it shows it passing, when the assertion fails
// https://github.com/bahmutov/cypress-soft-assertions/issues/2
it('shows a warning', () => {
  // cy.wrap([1, 2, 3]).better('have.length', 3)
  // ohh, seems "have.length" really runs two assertions
  // "have.property length"
  // "property length equals N"
  // causing us to incorrectly assign the resulting warning
  cy.wrap([1, 2, 3]).better('have.length', 4)
  // cy.wrap('foo').better('be.equal', 'bar')
  // cy.wrap('foo').better('have.length', 4)
})

it('checks property', () => {
  cy.wrap({}).better('have.property', 'length')
})

it('checks the yielded length property', () => {
  cy.wrap([1, 2, 3]).should('have.property', 'length').better('equal', 10)
})
