import * as core from '@actions/core'
import * as github from '@actions/github'
import { getPullRequests, getPullRequest } from './get_prs.mjs'
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

async function readCodeOwners(owner, repo, sha) {
  const octokit = getOctokit()
  const res2 = await octokit.request(`GET /repos/${owner}/${repo}/contents/.github/CODEOWNERS`, {
    ref: sha,
  })
  return Buffer.from(res2.data.content, 'base64')
    .toString('utf8')
    .split('\n')
    .find((line) => line.startsWith('MAINTAINER.txt'))
    .split(' ')
    .filter((entry) => entry !== '' && entry !== 'MAINTAINER.txt')
    .map((entry) => entry.replace('@', ''))
}

// Run this function when a push to `master` happens and MAINTAINER.txt got changed
export async function assignMaintainer(owner, repo, sha, labelName) {
  const octokit = getOctokit()
  const path = `GET /repos/${owner}/${repo}/commits/${sha}`
  const res = await octokit.request(path)

  if (
    res.data.files.findIndex(
      (entry) => entry.filename === 'MAINTAINER.txt' && entry.status === 'modified'
    ) !== -1
  ) {
    const maintainer = await readMaintainerTxt(owner, repo, sha)
    const codeOwners = await readCodeOwners(owner, repo, sha)
    const prList = await getPullRequests(octokit, owner, repo, labelName)

    if (prList.length > 0) {
      return await updatePrs(octokit, maintainer, codeOwners, prList)
    }
  }
}

// Call this when a the label is applied
export async function assignOnLabel(owner, repo, sha, prNumber) {
  const octokit = getOctokit()
  const maintainer = await readMaintainerTxt(owner, repo, sha)
  const codeOwners = await readCodeOwners(owner, repo, sha)
  const pr = await getPullRequest(octokit, owner, repo, prNumber)

  return await updatePrs(octokit, maintainer, codeOwners, [pr])
}
