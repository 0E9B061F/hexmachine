import { mkhref } from "./util.mjs"

import fsp from "node:fs/promises"
import fse from "fs-extra/esm"
import { relative, join } from "node:path"


export const confMod =(conf={})=> {
  conf = {
    filename: "conf.json",
    defaults: {},
    ...conf,
  }
  return async function confMod(node) {
    node.conf_path = join(node.path, conf.filename)
    const raw = await fsp.readFile(node.conf_path, "utf-8")
    node.conf = {...conf.defaults, ...JSON.parse(raw)}
  }
}

export const infoMod = async node => {
  node.title = node.conf.title || node.pretty
  const hmd = await node.root.hmd.inline(node.title)
  node.titleHtml = hmd.inline
  node.titlePlain = hmd.plain
  node.desc = node.conf.desc
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
        await fsp.writeFile(n.index, await n.render({ solo: conf.solo }))
      })
      node.hook("clobber", async n => {
        await fse.remove(n.index)
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
    const files = await fsp.readdir(node.path)
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
  }
}
