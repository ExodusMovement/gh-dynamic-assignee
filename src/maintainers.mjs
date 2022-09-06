import getOctokit from './octokit.mjs'

export async function readMaintainerTxt(owner, repo, sha) {
  const octokit = getOctokit()
  const res2 = await octokit.request(`GET /repos/${owner}/${repo}/contents/MAINTAINER.txt`, {
    ref: sha,
  })
  return Buffer.from(res2.data.content, 'base64').toString('utf8').replaceAll('\n', '')
}

export async function readCodeOwners(owner, repo, sha) {
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
