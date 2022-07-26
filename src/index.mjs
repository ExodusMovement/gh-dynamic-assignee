import * as core from '@actions/core'
import * as github from '@actions/github'

async function run() {
  try {
    // console.log('github.context=', github.context)

    const { eventName, sha, repo, payload } = github.context.repo
    console.info('github.context.repo=', repo)
    console.info('payload=', payload)

    if (['pull_request', 'push'].includes(eventName)) {
      const token = core.getInput('github_token') || process.env.GITHUB_TOKEN
      const octokit = new github.getOctokit(token)

      const res = await octokit.request(
        `GET /repos/ExodusMovement/${repo.owner}/${repo.repo}/commits/${sha}`
      )

      console.info('res=', res)

      // core.setOutput(id)
    }
  } catch (err) {
    core.setFailed(err.message)
  }
}

run()
