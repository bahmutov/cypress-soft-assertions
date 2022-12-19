/// <reference types="cypress" />

function addBetterStyles() {
  const styleId = 'better-styles-v9'
  const doc = window.top.document
  // check if there is already the style element
  if (doc.getElementById(styleId)) {
    return
  }
  const style = doc.createElement('style')
  doc.head.appendChild(style)
  style.setAttribute('id', styleId)
  style.setAttribute('type', 'text/css')
  style.innerHTML = `
    // warnings (failed soft assertions)
    .reporter .command.command-name-warn .command-state-passed {
      background-color: #37240f;
    }
    .reporter .command.command-name-warn .command-state-passed.command-wrapper {
        border-left: 2px solid orange;
    }
    .reporter .command.command-name-warn .command-state-passed .command-message {
      color: orange;
    }
    .reporter .command.command-name-warn .command-state-passed .command-method {
      color: orange;
    }
    .reporter .command.command-name-warn .command-state-passed strong {
      color: darkOrange;
    }
    .reporter .command.command-name-warn .command-state-passed .command-number-column {
      color: orange;
    }
    .reporter .command-name-warn .command-state-passed .command-method span {
      color: black;
      background-color: darkOrange;
      border-radius: 2px;
      padding: 0 3px;
      font-size: 12px;
      display: inline-block;
      line-height: 14px;
    }

    // passing assertions
    .reporter .command.command-name-better .command-state-passed {
      background-color: #69d3a7;
    }
    .reporter .command.command-name-better .command-state-passed .command-message {
      color: #69d3a7;
    }
    .reporter .command.command-name-better .command-state-passed .command-method {
      color: #69d3a7;
    }
    .reporter .command-name-better .command-state-passed .command-method span {
      color: black;
      background-color: #1fa971;
      border-radius: 2px;
      padding: 0 3px;
      font-size: 12px;
      display: inline-block;
      line-height: 14px;
    }
    .reporter .command.command-name-better .command-state-passed strong {
      color: #69d3a7;
    }
    .reporter .command.command-name-better .command-state-passed .command-number-column {
      color: #69d3a7;
    }
  `
}

addBetterStyles()

const _ = Cypress._
const reExistence = /exist/
const reHaveLength = /length/
const $dom = Cypress.dom

const onBeforeLog = (log, command, commandLogId) => {
  // console.log('onBeforeLog', { log, command, commandLogId })
  log.set('commandLogId', commandLogId)

  const previousLogInstance = command
    .get('logs')
    .find(_.matchesProperty('attributes.commandLogId', commandLogId))

  if (previousLogInstance) {
    // log.merge unsets any keys that aren't set on the new log instance. We
    // copy over 'snapshots' beforehand so that existing snapshots aren't lost
    // in the merge operation.
    log.set('snapshots', previousLogInstance.get('snapshots'))
    previousLogInstance.merge(log)

    if (previousLogInstance.get('end')) {
      previousLogInstance.end()
    }

    // Returning false prevents this new log from being added to the command log
    return false
  }

  return true
}

Cypress.Commands.addAll(
  { type: 'assertion', prevSubject: true },
  {
    better(subject, chainers, ...args) {
      // console.log('better', { subject, chainers, args })

      // for all code, see Cypress repo driver/src/cy/commands/asserting.ts

      const command = cy.state('current')
      const currentAssertionCommand = command.get('currentAssertionCommand')
      // console.log({ command, currentAssertionCommand })

      const assertionIndex = cy.state('upcomingAssertions')
        ? cy.state('upcomingAssertions').indexOf(currentAssertionCommand)
        : 0
      // console.log({ assertionIndex })
      let logIndex = 0

      if (_.isFunction(chainers)) {
        cy.state('onBeforeLog', (log) => {
          logIndex++

          return onBeforeLog(log, command, `${assertionIndex}-${logIndex}`)
        })

        try {
          return shouldFnWithCallback.apply(this, [subject, chainers])
        } finally {
          cy.state('onBeforeLog', undefined)
        }
      }

      let exp = cy.expect(subject).to
      const originalChainers = chainers

      const throwAndLogErr = (err) => {
        // since we are throwing our own error
        // without going through the assertion we need
        // to ensure our .should command gets logged
        logIndex++
        const log = Cypress.log({
          name: 'better',
          type: 'child',
          message: [].concat(originalChainers, args),
          end: true,
          snapshot: true,
          error: err,
        })

        return $errUtils.throwErr(err, { onFail: log })
      }

      chainers = chainers.split('.')
      const lastChainer = _.last(chainers)

      // backup the original assertion subject
      const originalObj = exp._obj
      let err

      const isCheckingExistence = reExistence.test(chainers)
      const isCheckingLengthOrExistence =
        isCheckingExistence || reHaveLength.test(chainers)

      const applyChainer = function (memo, value) {
        logIndex++
        let chainerLog
        cy.state('onBeforeLog', (log) => {
          // console.log('log.name', log.attributes.name, log)
          log.attributes.name = 'better'
          chainerLog = log
          return onBeforeLog(log, command, `${assertionIndex}-${logIndex}`)
        })

        cy.state('onAfterLog', (log) => {
          // console.log('onAfterLog')
          // return onBeforeLog(log, command, `${assertionIndex}-${logIndex}`)
        })

        try {
          if (value === lastChainer && !isCheckingExistence) {
            // https://github.com/cypress-io/cypress/issues/16006
            // Referring some commands like 'visible'  triggers assert function in chai_jquery.js
            // It creates duplicated messages and confuses users.
            const cmd = memo[value]

            if (_.isFunction(cmd)) {
              try {
                return cmd.apply(memo, args)
              } catch (err) {
                // if we made it all the way to the actual
                // assertion but its set to retry false then
                // we need to log out this .should since there
                // was a problem with the actual assertion syntax
                // debugger
                if (err.retry === false) {
                  return throwAndLogErr(err)
                }

                // log.attributes.name = 'warn'
                // throw err
                if (chainerLog) {
                  // console.log('chainerLog set to warn', chainerLog)
                  chainerLog.attributes.name = 'warn'
                }
              }
            } else {
              return cmd
            }
          } else {
            return memo[value]
          }
        } finally {
          cy.state('onBeforeLog', undefined)
        }
      }

      const applyChainers = function () {
        // if we're not doing existence or length assertions
        // then check to ensure the subject exists
        // in the DOM if its a DOM subject
        // because its possible we're asserting about an
        // element which has left the DOM and we always
        // want to auto-fail on those
        if (!isCheckingLengthOrExistence && $dom.isElement(subject)) {
          cy.ensureAttached(subject, 'should')
        }

        const newExp = _.reduce(
          chainers,
          (memo, value) => {
            if (!(value in memo)) {
              err = $errUtils.cypressErrByPath('should.chainer_not_found', {
                args: { chainer: value },
              })
              err.retry = false
              throwAndLogErr(err)
            }

            // https://github.com/cypress-io/cypress/issues/883
            // A single chainer used that is not an actual assertion, like '.should('be', 'true')'
            if (
              chainers.length < 2 &&
              !isCheckingExistence &&
              !_.isFunction(memo[value])
            ) {
              err = $errUtils.cypressErrByPath('should.language_chainer', {
                args: { originalChainers },
              })
              err.retry = false
              throwAndLogErr(err)
            }

            // console.log({ memo, value })
            return applyChainer(memo, value)
          },
          exp,
        )

        exp = newExp ? newExp : exp
      }

      return Cypress.Promise.try(applyChainers).then(() => {
        // if the _obj has been mutated then we
        // are chaining assertion properties and
        // should return this new subject
        if (originalObj !== exp._obj) {
          return exp._obj
        }

        return subject
      })
    },
  },
)
