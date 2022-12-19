/// <reference types="cypress" />

import '../../src'

it('shows soft assertions', () => {
  cy.wrap(42, { timeout: 100 })
    .should('equal', 42) // passing assertion
    .better('equal', 42) // passing
    .better('equal', 10) // warning
    .then(cy.log)
})

it('shows soft assertion for cy.contains', () => {
  cy.document()
    .invoke('open')
    .invoke(
      'write',
      `
        <body>
          <p>Quick brown fox</p>
        </body>
      `,
    )
  cy.get('p').better('include.text', 'fox').better('have.value', 10)
})

it('retries the hard assertions', () => {
  const person = {}
  setTimeout(() => {
    person.name = 'Joe'
  }, 1000)
  cy.wrap(person).should('have.property', 'name', 'Joe')
})

// immediately passes with a warning
// desired behavior: retry until the "name: Joe" is set
it('retries the warnings', () => {
  const person = {}
  setTimeout(() => {
    person.name = 'Joe'
  }, 1000)
  cy.wrap(person)
    // .should('include.key', 'name')
    .better('have.property', 'name', 'Joe')
})

it.skip('shows hard assertions', () => {
  // hard assertion
  // fails the test if it fails
  cy.wrap(42, { timeout: 0 }).should('equal', 10)
})
