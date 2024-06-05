import { readFile, writeFile, readdir, rm } from "node:fs/promises"
import { join, resolve, dirname } from "node:path"
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))


export const confMod =(conf={})=> {
  conf = {
    filename: "conf.json",
    defaults: {},
    ...conf,
  }
  return async function confMod(node) {
    node.conf_path = join(node.path, conf.filename)
    const raw = await readFile(node.conf_path, "utf-8")
    node.conf = {...conf.defaults, ...node.conf, ...JSON.parse(raw)}
  }
}

export const infoMod = async node => {
  node.title = node.conf.title || node.pretty
  const hmd = await node.root.hmd.inline(node.title)
  node.titleHtml = hmd.inline
  node.titlePlain = hmd.plain
  node.desc = node.conf.desc
}

export const siteInfoMod = async node => {
  node.hosts = node.conf.host || []
  if (!Array.isArray(node.hosts)) node.hosts = [node.hosts]
  node.host = node.hosts[0]
  node.mirrors = node.hosts.slice(1)
  node.generated = (new Date()).toISOString()
  if (node.conf.package) {
    const pkg = resolve(dirname(node.conf_path), node.conf.package)
    const data = await readFile(pkg, {encoding: "utf-8"})
    const info = JSON.parse(data)
    node.version = info.version
    node.license = info.license
    if (!node.conf.title) node.conf.title = info.name
    if (!node.conf.desc) node.conf.desc = info.description
    node.repository = info.repository
    node.author = info.author
  } else {
    node.version = node.conf.version
    node.license = node.conf.license
    node.repository = node.conf.repository
    node.author = node.conf.author
  }
}

export const hexInfoMod =(root=".")=> {
  return async function hexInfoMod(node) {
    const pkg = resolve(__dirname, join(root, "package.json"))
    const data = await readFile(pkg, {encoding: "utf-8"})
    const info = JSON.parse(data)
    node.generator = {
      name: "hexmachine",
      version: info.version,
      homepage: info.homepage,
    }
  }
}

export const hrefMod =(conf)=> {
  conf = {
    filename: "",
    silent: false,
    ...conf
  }
  return async function hrefMod(node) {
    node.href = node.outhref(conf.filename)
    node.abs = `${node.root.host}${node.href}`
    node.coords = conf.silent ? null : {
      loc: node.abs,
      date: new Date(node.mtime).toISOString().replace(/T.*$/, ""),
    }
  }
}

export const templateMod = (name, conf={}) => {
  conf = {
    filename: "index.html",
    silent: false,
    wrapper: null,
    wraps: true,
    ctxAll: {},
    ctxSelf: {},
    ctxWrap: {},
    solo: false,
    ...conf
  }
  return [
    async function templateMod(node) {
      node.index = node.outfile(conf.filename)
      node.template = node.root.templates.get(name)
      node.wrapper = conf.wrapper ? node.root.templates.get(conf.wrapper) : null
      node.wraps = conf.wraps
      node.ctxAll = conf.ctxAll
      node.ctxWrap = conf.ctxWrap
      node.ctxSelf = conf.ctxSelf
      node.hook("compile", async n => {
        await writeFile(n.index, await n.render({ solo: conf.solo }))
      })
      node.hook("clobber", async n => {
        await rm(n.index)
      })
    },
    hrefMod({
      filename: conf.filename,
      silent: conf.silent,
    }),
  ]
}

export const scanMod =block=> {
  return async function scanMod(node) {
    const files = await readdir(node.path)
    for (let i = 0; i < files.length; i++) {
      const abs = join(node.path, files[i])
      await block(node, files[i], abs)
    }
  }
}

export const rebirthMod = async node=> {
  if (node.conf.date) {
    node.btime = Date.parse(node.conf.date)
    node.bdate = new Date(node.btime).toLocaleDateString("en-US").replace(/\//g, "-")
    node.mtime = node.btime
    node.mdate = node.bdate
  }
  if (node.conf.edited) {
    node.mtime = Date.parse(node.conf.edited)
    node.mdate = new Date(node.mtime).toLocaleDateString("en-US").replace(/\//g, "-")
  }
}
