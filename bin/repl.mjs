#!/usr/bin/env node

import { resolve } from "node:path"
import { parseArgs } from "node:util"
import repl from "node:repl"
import Site from "../lib/site.mjs"

let {
  positionals,
} = parseArgs({
  allowPositionals: true,
})

const source = positionals[0]

const site = await Site.make({
  path: resolve(source),
  outPath: resolve("/tmp/HEXOUT"),
})

function initialize(ctx) {
  ctx.site = site
}

const r = repl.start({ prompt: 'HEX> ' })

initialize(r.context)
r.on('reset', initialize)
