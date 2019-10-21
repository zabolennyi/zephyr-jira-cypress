describe('set zephyr test to pass', () => {
  it('set all step results and entire test to pass', () => {
    const cycleName = 'newCycle2'
    const folderName = 'cycle3'
    const versionId = 10001
    const issueKey = 'JOJO-1'
    cy.setZephyrTestToPass(cycleName, folderName, versionId, issueKey)
  })
})

describe('setStepResultByStepName', () => {
  it('set specific test step to pass', () => {
    const cycleName = 'newCicle'
    const folderName = 'cycle2'
    const versionId = 10000
    const issueKey = 'JOJO-2'
    const testStepName = 'TesStep1'
    cy.setStepResultByStepName(cycleName, folderName, versionId, issueKey, testStepName)
  })
})


