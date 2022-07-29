import * as core from '@actions/core'
import * as github from '@actions/github'
import getPullRequests from './get_prs.mjs'
import updatePrs from './update_prs.mjs'

function getOctokit() {
  const token = core.getInput('github_token') || process.env.GITHUB_TOKEN
  return new github.getOctokit(token)
}

async function readMaintainerTxt(owner, repo, sha) {
  const octokit = getOctokit()
  const res2 = await octokit.request(`GET /repos/${owner}/${repo}/contents/MAINTAINER.txt`, {
    ref: sha,
  })
  return Buffer.from(res2.data.content, 'base64').toString('utf8').replaceAll('\n', '')
}

// Run this function when a push to `master` happens and MAINTAINER.txt got changed
export async function assignMaintainer(owner, repo, sha) {
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

    const { labelId, prList } = await getPullRequests(octokit, owner, repo, 'Ready for Merge')
    const ret = await updatePrs(octokit, labelId, prList)
    console.info('ret=', ret)
  }
}

// Call this when a the 'Ready to Merge' label is applied
export async function assignOnLabel(owner, repo, sha, prNumber) {
  const maintainer = await readMaintainerTxt(owner, repo, sha)
  const path = `PATCH /repos/${owner}/${repo}/issues/${prNumber}`
  const octokit = getOctokit()

  const res = await octokit.request(path, { assignees: [maintainer] })
  console.info('res=', res)
  return res
}
