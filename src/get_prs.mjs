const query = `#graphql
  query PRsByLabelQuery($owner: String!, $repo: String!, $labelName: String!, $first: Int!, $after: String) {
    repository(owner: $owner, name: $repo) {
      label(name: $labelName) {
        pullRequests(first: $first, after: $after) {
          nodes {
            id
            number
            title
          }
          pageInfo {
            hasNextPage
            endCursor
          }
          totalCount
        }
      }
    }
  }`

export default async function getPullRequests(octokit, owner, repo, labelName) {
  let hasNextPage
  let after
  let prList = []

  do {
    const result = await octokit.graphql(query, {
      owner,
      repo,
      labelName,
      first: 100,
      after,
    })
    const label = result.repository.label
    const pullRequests = label?.pullRequests
    const pageInfo = pullRequests?.pageInfo
    const theNodes = pullRequests?.nodes

    hasNextPage = pageInfo?.hasNextPage
    after = pageInfo?.endCursor

    if (theNodes) {
      prList = prList.concat(theNodes.map((node) => node.id))
    }
  } while (hasNextPage)

  return prList
}
