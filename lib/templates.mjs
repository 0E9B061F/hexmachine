import SiteNode from "./site-node.mjs"
import { scanMod } from "./modules.mjs"

import fs from "node:fs"
import fsp from "node:fs/promises"


export class Templates extends SiteNode {
  static modules = [
    async n => {
      const { default: hbs } = await import("handlebars")
      n.hbs = hbs
      n.index = {}
    },
    scanMod(async (n, fn, abs) => {
      const m = fn.match(/^(?<part>_)?(?<core>.+?)\.hbs$/i)
      if (m && fs.statSync(abs).isFile()) {
        const raw = await fsp.readFile(abs, "utf-8")
        if (m.groups.part) {
          n.addPart(m.groups.core, raw)
        } else {
          n.addTemp(m.groups.core, raw)
        }
      }
    })
  ]
  helper(...args) {
    return this.hbs.registerHelper(...args)
  }
  addPart(name, raw) {
    this.hbs.registerPartial(name, raw)
  }
  addTemp(name, raw) {
    this.index[name] = this.hbs.compile(raw)
  }
  get(name) { return this.index[name] }
}


export default Templates
