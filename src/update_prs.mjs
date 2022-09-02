import getOctokit from './octokit.mjs'

function generateMutation(prCount) {
  let query = `mutation AssignPrs(`

  for (let idx = 0; idx < prCount; idx++) {
    query += `${idx === 0 ? '' : ','} $prId${idx}: ID!, $assigneeIds${idx}: [ID!]`
  }

  query += ') {\n'

  for (let idx = 0; idx < prCount; idx++) {
    query += `pr${idx}: updatePullRequest(input: {assigneeIds: $assigneeIds${idx}, pullRequestId: $prId${idx}}) {
      pullRequest {
        number
        title
      }
    }\n`
  }

  query += '}\n'

  return query
}

function generateQuery(loginCount) {
  let query = `query GetUsers(`

  for (let idx = 0; idx < loginCount; idx++) {
    query += `${idx === 0 ? '' : ','} $loginId${idx}: String!`
  }

  query += `) {\n`

  for (let idx = 0; idx < loginCount; idx++) {
    query += `user${idx}: user(login: $loginId${idx}) {
        id
      }\n`
  }

  query += `}`

  return query
}

export async function lookupLoginIds(octokit, loginIdList) {
  const query = generateQuery(loginIdList.length)
  const loginParams = loginIdList.reduce(
    (acc, login, idx) => ({ [`loginId${idx}`]: login, ...acc }),
    {}
  )
  const result = await octokit.graphql(query, loginParams)
  return Object.values(result)
}

export function testQuery(count) {
  const query = generateQuery(count)
  console.info('query=', query)
}

export function testMutation(count) {
  const mutation = generateMutation(count)
  console.info('mutation=', mutation)
}

export default async function updatePrs(maintainer, codeOwners, prList) {
  const octokit = getOctokit()
  const maintainerList = await lookupLoginIds(octokit, [
    maintainer,
    ...codeOwners.filter((login) => login !== maintainer),
  ])
  const mutation = generateMutation(prList.length)
  const params = new Map()

  for (let idx = 0; idx < prList.length; idx++) {
    const pr = prList[idx]
    const assignees = [
      maintainerList[0],
      ...pr.assignees.filter((userId) => !maintainerList.includes(userId)),
    ]

    params.set(`prId${idx}`, pr.id)
    params.set(`assigneeIds${idx}`, assignees)
  }

  return await octokit.graphql(mutation, params)
}
