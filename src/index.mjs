import * as core from '@actions/core'
import * as github from '@actions/github'

async function run() {
  try {
    console.log('github.context=', github.context)

    const { eventName, sha } = github.context
    const { owner, repo } = github.context.repo
    console.info('eventName=', eventName)
    console.info('sha=', sha)
    console.info('owner=', owner)
    console.info('repo=', repo)
    // console.info('payload=', payload)

    if (['pull_request', 'push'].includes(eventName)) {
      const token = core.getInput('github_token') || process.env.GITHUB_TOKEN
      const octokit = new github.getOctokit(token)

      const path = `GET /repos/ExodusMovement/${owner}/${repo}/commits/${sha}`
      console.info('path=', path)

      const res = await octokit.request(path)
      console.info('res=', res)

      // core.setOutput(id)
    }
  } catch (err) {
    core.setFailed(err.message)
  }
}

run()
