import { Octokit } from '@octokit/rest'
import { graphql } from '@octokit/graphql'
import generateReleaseNotes from '../src/generate-release-notes.mjs'

async function run() {
  const octokit = {
    rest: new Octokit({ auth: process.env.GITHUB_TOKEN }),
    graphql: graphql.defaults({
      headers: {
        authorization: `token ${process.env.GITHUB_TOKEN}`,
      },
    }),
  }
  await generateReleaseNotes(octokit, {
    owner: 'ExodusMovement',
    repo: process.env.REPO || 'gh-release-generator-test',
  })
}

run().catch(console.error)
