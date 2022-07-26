import * as core from '@actions/core'
import * as github from '@actions/github'

async function run() {
  try {
    // const token = core.getInput('github_token') || process.env.GITHUB_TOKEN
    // const octokit = new github.getOctokit(token)
    console.log('github.context=', github.context)
    console.log('github.context.repo=', github.context.repo)

    // core.setOutput(id)
  } catch (err) {
    core.setFailed(err.message)
  }
}

run()
