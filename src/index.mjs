import * as core from '@actions/core'
import * as github from '@actions/github'

async function run() {
  try {
    // console.log('github.context=', github.context)

    const { eventName, sha } = github.context
    const { owner, repo } = github.context.repo
    console.info('eventName=', eventName)
    console.info('sha=', sha)
    console.info('owner=', owner)
    console.info('repo=', repo)

    if (['pull_request', 'push'].includes(eventName)) {
      const token = core.getInput('github_token') || process.env.GITHUB_TOKEN
      const octokit = new github.getOctokit(token)

      const path = `GET /repos/${owner}/${repo}/commits/${sha}`
      console.info('path=', path)

      const res = await octokit.request(path)
      console.info('files=', res.data.files)

      if (res.data.files.findIndex((entry) => entry.filename === 'MAINTAINER.txt') !== -1) {
        const res2 = await octokit.request(`GET /repos/${owner}/${repo}/contents/MAINTAINER.txt`, {
          ref: sha,
        })
        const contents = Buffer.from(res2.data.content, 'base64').toString('utf8')
        console.info('contents=', contents)
      }

      // core.setOutput(id)
    }
  } catch (err) {
    core.setFailed(err.message)
  }
}

run()
