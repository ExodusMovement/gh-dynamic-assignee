import getOctokit from './octokit.mjs'

const labelQuery = `#graphql
  query PRsByLabelQuery($owner: String!, $repo: String!, $labelName: String!, $first: Int!, $after: String) {
    repository(owner: $owner, name: $repo) {
      label(name: $labelName) {
        pullRequests(first: $first, after: $after) {
          nodes {
            id
            closed
            assignees(first: 100) {
              nodes {
                id
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  }`

const prQuery = `#graphql
  query prQuery($owner: String!, $repo: String!, $prNumber: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $prNumber) {
        id
        assignees(first: 100) {
          nodes {
            id
          }
        }
      }
    }
  }`

export async function getPullRequests(owner, repo, labelName) {
  const octokit = getOctokit()
  let hasNextPage
  let after
  const prList = []

  do {
    const result = await octokit.graphql(labelQuery, {
      owner,
      repo,
      labelName,
      first: 100,
      after,
    })
    const label = result.repository.label
    const pullRequests = label?.pullRequests
    const pageInfo = pullRequests?.pageInfo
    const nodeList = pullRequests?.nodes

    hasNextPage = pageInfo?.hasNextPage
    after = pageInfo?.endCursor

    if (nodeList) {
      for (const node of nodeList.filter((node) => !node.closed)) {
        prList.push({ id: node.id, assignees: node.assignees.nodes.map((node) => node.id) })
      }
    }
  } while (hasNextPage)

  return prList
}

export async function getPullRequest(owner, repo, prNumber) {
  const octokit = getOctokit()
  const result = await octokit.graphql(prQuery, {
    owner,
    repo,
    prNumber,
  })
  const pullRequest = result.repository.pullRequest
  return { id: pullRequest.id, assignees: pullRequest.assignees.nodes.map((node) => node.id) }
}
