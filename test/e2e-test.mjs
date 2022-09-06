import { lookupLoginIds } from '../src/update_prs.mjs'
import { getPullRequests } from '../src/get_prs.mjs'

async function run() {
  const loginIdList = ['dooglio', 'nachoaIvarez', 'ChALkeR']

  const lookupResult = await lookupLoginIds(loginIdList)

  const prResult = await getPullRequests('ExodusMovement', 'gh-webhook-link', 'merge-ready')

  return { lookupResult, prResult }
}

run().then(console.info).catch(console.error)
