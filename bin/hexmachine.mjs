#!/usr/bin/env node

import { join, resolve } from "node:path"
import { parseArgs } from "node:util"
import webpack from "webpack"
import Site from "../lib/site.mjs"
import config from "../lib/webpack.config.mjs"

let {
  values: { source },
  positionals,
} = parseArgs({
  allowPositionals: true,
  options: {
    source: {
      type: "string",
      short: "s",
      default: ".",
    },
  },
})

source = resolve(source)
const entry = join(source, "build.mjs")
let output = positionals[0] || join(source, "HEXBUILD")
output = resolve(output)

const site = await Site.make({
  path: resolve(source),
  outPath: resolve(output),
})
await site.compile()

const compiler = webpack(config(entry, output))
compiler.run((err, stats)=> {
  console.log("webpack compiler run", err)
  compiler.close((closeErr)=> {
    console.log("webpack compiler closed", closeErr)
  })
})
