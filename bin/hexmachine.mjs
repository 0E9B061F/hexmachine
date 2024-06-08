#!/usr/bin/env node

import { join, resolve } from "node:path"
import { parseArgs } from "node:util"
import webpack from "webpack"
import Site from "../lib/site.mjs"
import config from "../lib/webpack.config.mjs"

let {
  values: { source, mirror },
  positionals,
} = parseArgs({
  allowPositionals: true,
  options: {
    source: {
      type: "string",
      short: "s",
      default: ".",
    },
    mirror: {
      type: "boolean",
      short: "m",
      default: false,
    },
  },
})

source = resolve(source)
const entry = join(source, "build.mjs")
let output = positionals[0] || join(source, "HEXBUILD")
output = resolve(output)

console.log("> Building ...")
console.log(`  source: ${source}`)
console.log(`  output: ${output}`)
const site = await Site.make({
  path: resolve(source),
  outPath: resolve(output),
  mirror,
})
await site.compile()

console.log("> Bundling ...")
console.log(`  entry:  ${entry}`)

const compiler = webpack(config(entry, output))
compiler.run((err, stats)=> {
  console.log(stats.toString({
    chunks: false,
    colors: true,
  }))
  compiler.close((closeErr)=> {
  })
})
