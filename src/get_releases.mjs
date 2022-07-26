export default async function getReleases(octokit, owner, name) {
  const result = await octokit.graphql(
    `#graphql
        query GetReleases($owner: String!, $name: String!) {
          repository(owner: $owner, name: $name) {
            latestRelease {
              id
              databaseId
              name
              description
              tagCommit {
                committedDate
              }
            }
            release(tagName: "draft-release-tag") {
              id
              databaseId
              name
              description
            }
          }
        }
      `,
    { owner, name }
  )

  return result.repository
}
