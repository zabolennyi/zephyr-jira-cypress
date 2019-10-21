
const cloudApiUrl = `https://prod-api.zephyr4jiracloud.com/connect/public/rest/api`

//Test Credentials
const zapiAccessKey = '' //e.x. `ZmY3NzNkNjctOTZkMC0z123456lZmUtMTlmMTU2MGIzYTg3ID`
const zapiSecretKey = '' //e.x. `aof_5utodhgTdRbWZAq12345rAm3Yj97hSjQuA`
const zapiUser = '' //e.x. `test@test.com`
const jiraUserAuth = '' //e.x. `ZWFw12345MjRAYmNhb28uY212345FeEIxZkI5QkpnMFl12345aXJTOEVGMg==`
const jiraDomain = '' //e.x. `https://test.atlassian.net`
const jiraUserId = '' //e.x. `5d91234510f41234541a6a01`
const jiraProjectId = 10000 //e.x. 10000

//method to generate zapi token
function tokenGen (method, apiUrl) {
  const jwt = require('json-web-token')
  const crypto = require('crypto')
  const hash = crypto.createHash('sha256')
  const iat = new Date().getTime()
  const exp = iat + 3600
  const BASE_URL = 'https://prod-api.zephyr4jiracloud.com/connect'

  let RELATIVE_PATH = apiUrl.split(BASE_URL)[1].split('?')[0]
  let QUERY_STRING = apiUrl.split(BASE_URL)[1].split('?')[1]
  let CANONICAL_PATH
  if (QUERY_STRING) {
      CANONICAL_PATH = `${method}&${RELATIVE_PATH}&${QUERY_STRING}`
  } else {
      CANONICAL_PATH = `${method}&${RELATIVE_PATH}&`
  }

  hash.update(CANONICAL_PATH)
  let encodedQsh = hash.digest('hex')

  let payload = {
      sub: zapiUser,
      qsh: encodedQsh,
      iss: zapiAccessKey,
      iat: iat,
      exp: exp
  }

  let token = jwt.encode(zapiSecretKey, payload, 'HS256', function(err, token) {
      if (err) { 
        console.error(err.name, err.message)
      }
      else { 
        return token
      }
  })
  return token 
}

Cypress.Commands.add("getCycleIdByCycleName", (cycleName) => {
  const endpoint = `/1.0/zql/search?isAdvanced=true`
  const token = tokenGen('POST', `${cloudApiUrl}${endpoint}`)
  cy.request({
   method: 'post',
   url: `${cloudApiUrl}${endpoint}`,
   headers: {
    zapiAccessKey : zapiAccessKey,
    Authorization: `JWT ${token}`
   },
   body: {"zqlQuery":`cycleName=${cycleName}`,"offset":0,"maxRecords":10,"isAdvanceSearch":true}
 })
 .then((response) => {
   expect(response.status).to.eq(200)
   let cycleId = response.body.searchObjectList[0].execution.cycleId
   return cycleId
 })
})

Cypress.Commands.add("getStepResultsByExecutionID", (executionId ,issueId) => {
  let endpoint = `/1.0/stepresult/search?executionId=${executionId}&issueId=${issueId}`
  let token = tokenGen('GET', `${cloudApiUrl}${endpoint}`)
  cy.request({
   method: 'get',
   url: `${cloudApiUrl}${endpoint}`,
   headers: {
    zapiAccessKey : zapiAccessKey,
    Authorization: `JWT ${token}`
   },
   body: {}
  })
 .then((response) => {
   expect(response.status).to.eq(200)
   let stepResults = response.body.stepResults
    return stepResults
 })
})

Cypress.Commands.add("setStepResult", (stepResultId, executionId, issueId, stepId, status) => {
  const endpoint = `/2.0/stepresult/${stepResultId}`
  const token = tokenGen('PUT', `${cloudApiUrl}${endpoint}`)
  cy.request({
   method: 'put',
   url: `${cloudApiUrl}${endpoint}`,
   headers: {
    zapiAccessKey : zapiAccessKey,
    Authorization: `JWT ${token}`
   },
   body: {"executionId":executionId,"stepId":stepId,"issueId":issueId,"status":{"id":status}}
 })
 .then((response) => {
   expect(response.status).to.eq(200)
 })
})

Cypress.Commands.add("setStepResultsToPass", (stepResultId, executionId, issueId, stepId) => {
  cy.setStepResult(stepResultId, executionId, issueId, stepId, 1)
})

Cypress.Commands.add("getListOfExecutionsByFolderID", (folderId, cycleId, versionId) => {
  let endpoint = `/2.0/executions/search/folder/${folderId}?cycleId=${cycleId}&projectId=${jiraProjectId}&versionId=${versionId}`
  let token = tokenGen('GET', `${cloudApiUrl}${endpoint}`)
  cy.request({
    method: 'get',
    url: `${cloudApiUrl}${endpoint}`,
    headers: {
     zapiAccessKey : zapiAccessKey,
     Authorization: `JWT ${token}`
    }
  })
  .then((response) => {
    let respi = response.body
    expect(response.status).to.eq(200)
    return respi
  })
})

Cypress.Commands.add("getListOfFoldersByCylcleId", (cycleId, versionId) => {
  let endpoint = `/1.0/folders?cycleId=${cycleId}&projectId=${jiraProjectId}&versionId=${versionId}`
  let token = tokenGen('GET', `${cloudApiUrl}${endpoint}`)
  cy.request({
    method: 'get',
    url: `${cloudApiUrl}${endpoint}`,
    headers: {
     zapiAccessKey : zapiAccessKey,
     Authorization: `JWT ${token}`
    }
  })
  .then((response) => {
    let respi = response.body
    expect(response.status).to.eq(200)
    return respi
  })
})

Cypress.Commands.add("updateExecution", (executionId, cycleId, userId, issueId, versionId) => {
  let endpoint = `/1.0/execution/${executionId}?issueId=${issueId}&projectId=${jiraProjectId}`
  let token = tokenGen('PUT', `${cloudApiUrl}${endpoint}`)
  let today = new Date()
  let executedOn = `${today.getUTCMonth() + 1}-${today.getUTCDate()}-${today.getFullYear()} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}` 
  cy.request({
    method: 'put',
    url: `${cloudApiUrl}${endpoint}`,
    headers: {
     zapiAccessKey : zapiAccessKey,
     Authorization: `JWT ${token}`
    },
    body: {
      versionId: versionId,
      cycleId: cycleId,
      id: executionId,
      issueId: issueId,
      projectId: jiraProjectId,
      assignedTo: userId,
      executedBy: userId,
      executedByAccountId: userId,
      executedOn: executedOn,
      executedByZapi: true,
      status: {
          id: 1
      }
    }
  })
  .then((response) => {
    let respi = response.body
    expect(response.status).to.eq(200)
    return respi
  })
})

Cypress.Commands.add("getFolderIdByFolderName", (cycleName, folderName, versionId) => {
  cy.getCycleIdByCycleName(cycleName).then(cycleId => {
    cy.getListOfFoldersByCylcleId(cycleId, versionId).then(respi => {
      let country = respi.find(el => el.name === folderName)
      let folderId = country["id"] 
      return folderId 
    })
  })
})

Cypress.Commands.add("getAllTestStepsByIssueId", (issueId) => {
  let endpoint = `/2.0/teststep/${issueId}?projectId=${jiraProjectId}`
  let token = tokenGen('GET', `${cloudApiUrl}${endpoint}`)
  cy.request({
   method: 'get',
   url: `${cloudApiUrl}${endpoint}`,
   headers: {
    zapiAccessKey : zapiAccessKey,
    Authorization: `JWT ${token}`
   }
  })
  .then((response) => {
    expect(response.status).to.eq(200)
    let testSteps = response.body.testSteps
      return testSteps
  })
})

Cypress.Commands.add("getIssueIdByIssueKey", (issueKey) => {
  cy.request({
    method: 'get',
    url: `${jiraDomain}/rest/api/2/issue/${issueKey}`,
    headers: {
      Authorization: `Basic ${jiraUserAuth}`
      }
  })
  .then((response) => {
    expect(response.status).to.eq(200)
    let issueId = response.body.id
    return issueId
  })
})

Cypress.Commands.add("setAllStepResultsToPass", (cycleName, folderName, versionId, issueId) => {
  cy.getFolderIdByFolderName(cycleName, folderName, versionId).then(folderId => {
    cy.getCycleIdByCycleName(cycleName).then(cycleId => {
      cy.getListOfExecutionsByFolderID(folderId, cycleId, versionId).then(respi => {
        const executionId = respi.searchResult.searchObjectList[0].execution.id
        cy.getStepResultsByExecutionID(executionId, issueId).then(stepResults => {
          for (var i = 0; i < stepResults.length; i++) {
              cy.setStepResultsToPass(stepResults[i].id, executionId, issueId, stepResults[i].stepId)
          }
        })
      })
    })
  })
})

Cypress.Commands.add("setZephyrTestToPass", (cycleName, folderName, versionId, issueKey) => {
  let userId = jiraUserId
  cy.getIssueIdByIssueKey(issueKey).then(issueId => {
    cy.getFolderIdByFolderName(cycleName, folderName, versionId).then(folderId => {
      cy.getCycleIdByCycleName(cycleName).then(cycleId => {
        cy.getListOfExecutionsByFolderID(folderId, cycleId, versionId).then(respi => {
          let exexList = respi.searchResult.searchObjectList.find(el => el.issueKey === issueKey)
          let executionId = exexList.execution.id
          cy.getStepResultsByExecutionID(executionId, issueId).then(stepResults => {
            for (var i = 0; i < stepResults.length; i++) {
              cy.setStepResultsToPass(stepResults[i].id, executionId, issueId, stepResults[i].stepId)
          }
           cy.updateExecution(executionId, cycleId, userId, issueId, versionId)
          })
        })
      })
    })
  })
})

Cypress.Commands.add("setStepResultByStepName", (cycleName, folderName, versionId, issueKey, stepName) => {
  cy.getIssueIdByIssueKey(issueKey).then(issueId => {
    cy.getFolderIdByFolderName(cycleName, folderName, versionId).then(folderId => {
      cy.getCycleIdByCycleName(cycleName).then(cycleId => {
        cy.getListOfExecutionsByFolderID(folderId, cycleId, versionId).then(respi => {
          let exexList = respi.searchResult.searchObjectList.find(el => el.issueKey === issueKey)
          let executionId = exexList.execution.id
          cy.getAllTestStepsByIssueId(issueId).then(testSteps => {
            let stepList = testSteps.find(el => el.step === stepName)
            let stepId = stepList.id
            cy.getStepResultsByExecutionID(executionId, issueId).then(stepResults => {
              let stepResultsList = stepResults.find(el => el.stepId === stepId)
              let stepResultId = stepResultsList.id
              cy.setStepResultsToPass(stepResultId, executionId, issueId, stepId)
            })
          })
        })
      })
    })
  })
})
