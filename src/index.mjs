import * as core from '@actions/core'
import * as github from '@actions/github'

import { assignOnLabel, assignMaintainer } from './assign.mjs'

async function run() {
  try {
    const { eventName, sha, payload } = github.context
    const { owner, repo } = github.context.repo

    const labelName = core.getInput('label_name')

    console.info(`event '${eventName}' for ${owner}/${repo}, sha='${sha}', labelName=${labelName}`)

    if (eventName === 'pull_request' && payload?.label?.name?.startsWith(labelName)) {
      console.info(`assign label '${payload.label.name}'`)
      await assignOnLabel(owner, repo, sha, payload.pull_request.number)
    } else if (eventName === 'push') {
      console.info('maintainer change')
      await assignMaintainer(owner, repo, sha, labelName)
    }
  } catch (err) {
    core.setFailed(err.message)
  }
}

run()
