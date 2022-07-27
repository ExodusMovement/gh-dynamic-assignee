import * as core from '@actions/core'
import * as github from '@actions/github'

function getOctokit() {
  const token = core.getInput('github_token') || process.env.GITHUB_TOKEN
  return new github.getOctokit(token)
}

async function readMaintainerTxt(owner, repo, sha) {
  const octokit = getOctokit()
  const res2 = await octokit.request(`GET /repos/${owner}/${repo}/contents/MAINTAINER.txt`, {
    ref: sha,
  })
  return Buffer.from(res2.data.content, 'base64').toString('utf8')
}

// Run this function when a push to `master` happens and MAINTAINER.txt got changed
async function assignMaintainer(owner, repo, sha) {
  const octokit = getOctokit()

  const path = `GET /repos/${owner}/${repo}/commits/${sha}`
  console.info('path=', path)

  const res = await octokit.request(path)
  console.info('files=', res.data.files)

  if (
    res.data.files.findIndex(
      (entry) => entry.filename === 'MAINTAINER.txt' && entry.status === 'modified'
    ) !== -1
  ) {
    const maintainer = await readMaintainerTxt(owner, repo, sha)
    console.info('maintainer=', maintainer)
  }
}

// Call this when a the 'Ready to Merge' label is applied
async function assignOnLabel(owner, repo, sha) {
  const maintainer = await readMaintainerTxt(owner, repo, sha)
  console.info(`maintainer=${maintainer}`)
}

async function run() {
  try {
    console.log('github.context=', github.context)

    const { eventName, sha } = github.context
    const { owner, repo } = github.context.repo
    console.info('eventName=', eventName)
    console.info('sha=', sha)
    console.info('owner=', owner)
    console.info('repo=', repo)

    if (eventName === 'pull_request') {
      await assignOnLabel(owner, repo, sha)
    } else if (eventName === 'push') {
      await assignMaintainer(owner, repo, sha)
    }
  } catch (err) {
    core.setFailed(err.message)
  }
}

run()
