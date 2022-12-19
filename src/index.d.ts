declare namespace Cypress {
  interface Chainable {
    /**
     * Soft assertion warning if the given assertion does not pass.
     * @example cy.wrap('Hello').better('equal', 'Hi')
     * @see https://github.com/bahmutov/cypress-soft-assertions
     */
    better(assertion: string, ...args: any[]): Chainable<any>
  }
}
