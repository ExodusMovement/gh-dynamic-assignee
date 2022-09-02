import getOctokit from '../src/octokit.mjs'
import { lookupLoginIds } from '../src/update_prs.mjs'

async function run() {
  const octokit = getOctokit()
  const loginIdList = ['dooglio', 'nachoaIvarez', 'ChALkeR']

  return await lookupLoginIds(octokit, loginIdList)
}

run().then(console.info).catch(console.error)
