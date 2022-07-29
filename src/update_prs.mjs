function generateQuery(prCount) {
  let query = 'mutation AssignPrs($assigneeIds: [ID!]'

  for (let idx = 0; idx < prCount; idx++) {
    query += `, $prId${idx}: ID!`
  }

  query += ') {\n'

  for (let idx = 0; idx < prCount; idx++) {
    query += `pr${idx}: updatePullRequest(input: {assigneeIds: $assigneeIds, pullRequestId: $prId${idx}}) {
      pullRequest {
        number
        title
      }
    }\n`
  }

  query += '}\n'

  return query
}

async function lookupLoginId(octokit, loginId) {
  const result = await octokit.graphql(
    `#graphql
      query GetUser($loginId: String!) {
        user(login: $loginId) {
          id
        }
      }`,
    { loginId }
  )

  return result.data.user.id
}

export function testQuery(prCount) {
  const query = generateQuery(prCount)
  console.info('query=', query)
}

export default async function updatePrs(octokit, loginId, prIds) {
  const userId = await lookupLoginId(octokit, loginId)
  console.info(`loginId ${loginId}: ${userId}`)

  const query = generateQuery(prIds.length)
  const params = {
    assigneeIds: [userId],
  }

  for (let idx = 0; idx < prIds.length; idx++) {
    params[`prId${idx}`] = prIds[idx]
  }

  console.info('prIds=', prIds)
  console.info('query=', query)
  console.info('params=', params)

  return await octokit.graphql(query, params)
}
