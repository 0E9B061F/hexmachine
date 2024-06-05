#!/usr/bin/env node

import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { parseArgs } from "node:util"
import webpack from "webpack"
import Site from "../lib/site.mjs"
import config from "../lib/webpack.config.mjs"

let {
  values: { pkg, source },
  positionals,
} = parseArgs({
  allowPositionals: true,
  options: {
    pkg: {
      type: "string",
      short: "p",
      default: "./package.json",
    },
    source: {
      type: "string",
      short: "s",
      default: ".",
    },
  },
})

pkg = resolve(pkg)
source = resolve(source)
const entry = join(source, "build.mjs")
let output = positionals[0] || join(source, "HEXBUILD")
output = resolve(output)

let siteInfo = {}
if (existsSync(pkg)) {
  const data = await readFile(pkg, {encoding: "utf-8"})
  siteInfo = JSON.parse(data)
}

console.log("> Building ...")
console.log(`  source: ${source}`)
console.log(`  output: ${output}`)
const site = await Site.make({
  path: resolve(source),
  outPath: resolve(output),
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
