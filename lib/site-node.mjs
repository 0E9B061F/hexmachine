import { tcase, ancestors, mkhref } from "./util.mjs"

import fs from "node:fs"
import { join, basename, relative } from "node:path"


export class SiteNode {
  static depthname = [null, "page", "post"]
  static modules = []
  static modlist() {
    return this.modules.flat()
  }
  static modmap() {
    let m = this.modlist().filter(m => m.name).map(m => m.name)
    return [...m, ...m.map(m => m.replace(/Mod$/, ""))]
  }
  static hookname = ["compile", "clobber", "finalize"]
  static hookmap() {
    const map = {}
    this.hookname.forEach(n => map[n] = [])
    return map
  }
  static async make(...args) {
    const n = new this(...args)
    await n.doinit()
    return n
  }
  static defaults = {}
  constructor(conf) {
    this.id = ancestors(this.constructor).map(a=> a.name).filter(a=> a)
    this.id.forEach(id=> {
      this[`is${id}`] = true
    })
    this.modules = this.constructor.modmap()
    this.hooks = this.constructor.hookmap()
    this.conf = {
      parent: null,
      path: null,
      name: null,
      out: null,
      children: [],
      filename: null,
      abstract: null,
      ...this.constructor.defaults,
      ...conf,
    }
    this.parent = this.conf.parent
    this.depthname = SiteNode.depthname[this.depth()]
    this.children = this.conf.children

    this.path = this.conf.path
    this.name = this.conf.name
    if (this.parent) {
      if (typeof (this.name) === "string") {
        this.path = join(this.parent.path, this.name)
      }
    }

    const stat = fs.statSync(this.path)
    this.mtime = stat.mtimeMs
    this.mdate = new Date(this.mtime).toLocaleDateString("en-US").replace(/\//g, "-")
    this.btime = stat.birthtimeMs
    this.bdate = new Date(this.btime).toLocaleDateString("en-US").replace(/\//g, "-")
    this.isdir = stat.isDirectory()

    this.base = basename(this.path)
    this.core = this.isdir ? this.base : this.base.replace(/\.[^.]+?$/, "")
    this.ext = this.isdir ? null : this.base.replace(/^.+\./, "")
    this.pretty = tcase(this.core.replace(/[_\-]+/g, " "))

    this.outPath = this.conf.outPath
    this.outName = this.conf.outName
    if (typeof (this.outName) === "function") {
      this.outName = this.outName(this)
    }
    if (this.parent) {
      if (typeof (this.outName) === "string") {
        this.outPath = join(this.parent.outPath, this.outName)
      }
    }
    if (!this.outPath) this.outPath = this.path
    if (!this.outName) this.outName = basename(this.outPath)
    this.setFilename(this.conf.filename, this.conf.abstract)
  }
  get root() {
    return this.parent ? this.parent.root : this
  }
  setFilename(fn, an=null) {
    this.filename = fn
    this.abstract = an === null ? fn : an
    if (this.filename) {
      this.index = this.outfile(this.filename)
    } else {
      this.index = null
    }
    if (this.abstract !== null) {
      this.space = this.outspace(this.abstract)
      this.root.register(this)
    } else {
      this.space = null
    }
  }
  depth(d = 0) {
    return this.parent ? this.parent.depth(d + 1) : d
  }
  hasMod(name) {
    return this.modules.indexOf(name) >= 0
  }
  outfile(name) {
    return join(this.outPath, name)
  }
  outspace(name) {
    if (name == "index.html") name = ""
    let s = this.outfile(name)
    s = relative(this.root.outPath, s)
    return `/${s}`
  }
  outhref(name) {
    if (name == "index.html") name = ""
    const p = this.outfile(name)
    return mkhref(this.root.outPath, p, !!name)
  }
  hook(name, block) {
    this.hooks[name].push(block)
  }
  hasId(id) {
    return this.id.indexOf(id) >= 0
  }
  async visit(actions) {
    const ids = Object.keys(actions)
    for (let x = 0; x < ids.length; x++) {
      if (this.hasId(ids[x])) {
        await actions[ids[x]](this)
      }
    }
    for (let x = 0; x < this.children.length; x++) {
      await this.children[x].visit(actions)
    }
  }
  async init() { }
  async initEarly() { }
  async doinit() {
    await this.initEarly()
    const mods = this.constructor.modlist()
    let mod
    for (let i = 0; i < mods.length; i++) {
      mod = mods[i]
      await mod(this)
    }
    await this.init()
  }
  async finally() { }
  async finalize() {
    await this.finally()
    let child
    for (let i = 0; i < this.children.length; i++) {
      child = this.children[i]
      await child.finalize()
    }
  }
  async add(type, conf) {
    conf = { ...conf, parent: this }
    const n = await type.make(conf)
    this.children.push(n)
    return n
  }
  async list() {
    const base = this.coords ? [this.coords] : []
    const out = []
    let child, sub
    for (let i = 0; i < this.children.length; i++) {
      child = this.children[i]
      sub = await child.list()
      out.push(sub)
    }
    return base.concat(...out)
  }
  async wrap(ctx) {
    if (this.hasMod("template") && this.wraps) {
      let ctxAll = this.ctxAll || {}
      if (typeof (ctxAll) === "function") ctxAll = await ctxAll(this, ctx)
      let ctxWrap = this.ctxWrap || {}
      if (typeof (ctxWrap) === "function") ctxWrap = await ctxWrap(this, ctx)
      ctx = { ...ctx, local: this, trail: [...ctx.trail, this], ...ctxAll, ...ctxWrap }
      if (this.depthname) ctx[this.depthname] = this
      ctx = { ...ctx, content: this.wrapper ? this.wrapper(ctx) : this.template(ctx) }
    }
    if (this.parent) {
      return await this.parent.wrap(ctx)
    } else {
      return ctx.content
    }
  }
  async render(conf) {
    conf = {
      solo: false,
      ctx: {},
      ...conf,
    }
    if (this.hasMod("template")) {
      let ctx = { site: this.root, current: this, local: this, trail: [this] }
      let ctxAll = this.ctxAll || {}
      if (typeof (ctxAll) === "function") ctxAll = await ctxAll(this, ctx)
      let ctxSelf = this.ctxSelf || {}
      if (typeof (ctxSelf) === "function") ctxSelf = await ctxSelf(this, ctx)
      ctx = { ...ctx, ...ctxAll, ...ctxSelf, ...conf.ctx }
      if (this.depthname) ctx[this.depthname] = this
      ctx = { ...ctx, content: this.template(ctx) }
      if (this.wrapper) return await this.wrap(ctx)
      else {
        if (this.parent && !conf.solo) {
          return await this.parent.wrap(ctx)
        } else {
          return ctx.content
        }
      }
    }
  }
  async compile() {
    fs.mkdirSync(this.outPath, { recursive: true })
    for (let i = 0; i < this.hooks["compile"].length; i++) {
      await this.hooks["compile"][i](this)
    }
    for (let i = 0; i < this.children.length; i++) {
      await this.children[i].compile()
    }
    console.log(`compiled ${this.constructor.name}:/${this.space}`)
  }
  async clobber() {
    // XXX should this be "clobber" instead of "compile"?
    for (let i = 0; i < this.hooks["compile"].length; i++) {
      await this.hooks["clobber"][i](this)
    }
    for (let i = 0; i < this.children.length; i++) {
      await this.children[i].clobber()
    }
  }
}


export default SiteNode
