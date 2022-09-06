import { getPullRequests, getPullRequest } from './get_prs.mjs'
import getOctokit from './octokit.mjs'
import { readMaintainerTxt, readCodeOwners } from './maintainers.mjs'
import updatePrs from './update_prs.mjs'

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
      return await updatePrs(maintainer, codeOwners, prList)
    }
  }
}

// Call this when a the label is applied
export async function assignOnLabel(owner, repo, sha, prNumber) {
  const maintainer = await readMaintainerTxt(owner, repo, sha)
  const codeOwners = await readCodeOwners(owner, repo, sha)
  const pr = await getPullRequest(owner, repo, prNumber)

  return await updatePrs(maintainer, codeOwners, [pr])
}
