import * as core from '@actions/core'
import * as github from '@actions/github'

import './dotenv.mjs'

export default function getOctokit() {
  const token = core.getInput('github_token') || process.env.GITHUB_TOKEN
  return new github.getOctokit(token)
}
