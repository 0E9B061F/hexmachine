import SiteNode from "./site-node.mjs"
import { confMod, infoMod, rebirthMod, scanMod, templateMod, hrefMod } from "./modules.mjs"

import fs from "node:fs"
import fsp from "node:fs/promises"
import fse from "fs-extra"
import { resolve } from "node:path"

export class Post extends SiteNode {
  static defaults = {
    tags: [],
  }
  static modules = [
    infoMod,
    rebirthMod,
    async node=> {
      node.hasToc = !!node.toc

      node.prev = null
      node.next = null

      node.tags = node.conf.tags
      node.tags = [...new Set(node.tags)]
      node.type = node.conf.type

    },
  ]
  async finally() {
    const parts = this.parent.href.match(/[^/]+/g)
    this.namespace = parts[parts.length - 1]
  }
}

export class DataPost extends Post {
  static defaults = {
    ...this.defaults,
    copy: null,
    image: null,
  }
  static modules = [
    async node => {
      const raw = await fsp.readFile(node.path, "utf-8")
      node.conf = { ...this.defaults, ...JSON.parse(raw) }
      node.copy = resolve(node.path, "..", node.conf.copy || node.core)
      node.image = node.conf.image
      node.hook("compile", async n=> {
        await fse.copy(n.copy, n.outPath)
      })
    },
    hrefMod(),
    ...this.modules,
  ]
}

export class HMDPost extends Post {
  static modules = [
    async node=> {
      const raw = fs.readFileSync(node.path, "utf-8")
      const hmd = await node.root.hmd.parse(raw)
      node.conf = { ...this.defaults, ...hmd.matter }
      node.toc = hmd.toc
      node.content = hmd.html
    },
    ...this.modules,
    templateMod("post", {
      ctxSelf: node=> {
        return { toc: node.hasToc ? node.toc : null } 
      }
    }),
  ]
}

export const sortPosts = async node => {
  node.posts.sort((a, b) => b.btime - a.btime)
}
export const processPosts = async node=> {
  node.tags = {}
  let post
  for (let x = 0; x < node.posts.length; x++) {
    post = node.posts[x]
    if (node.posts[x + 1]) post.prev = node.posts[x + 1]
    if (node.posts[x - 1]) post.next = node.posts[x - 1]
    let tag
    for (let y = 0; y < post.tags.length; y++) {
      tag = post.tags[y]
      if (!node.tags[tag]) node.tags[tag] = []
      node.tags[tag].push(post)
    }
  }
}
export const postMod =(type, match)=> {
  return [
    scanMod(async (n, fn, abs) => {
      if (fs.statSync(abs).isFile() && match(n, fn, abs)) {
        const p = await n.add(type, { name: fn, outName: n => n.core })
        n.posts.push(p)
      }
    }),
    sortPosts,
    processPosts,
  ]
}

export class Space extends SiteNode {
  static modules = [
    async node => {
      node.posts = []
    },
    confMod(),
    rebirthMod,
    infoMod,
  ]
  clip(n = 0) {
    return n ? this.posts.slice(0, n) : this.posts
  }
  async external(n=0, ctx={}) {
    return await this.render({
      solo: true, ctx: {
        ...ctx,
        list: this.clip(n),
      }
    })
  }
}

export class Index extends Space {
  static modules = [
    async node => {
      node.posts = []
    },
    confMod({filename: "index.json"}),
    rebirthMod,
    infoMod,
    async node=> {
      await node.root.visit({
        Post: async n=> node.posts.push(n)
      })
    },
    sortPosts,
    templateMod("blog", {
      ctxSelf: node => {
        return { list: node.clip() }
      },
    }),
  ]
}


export default Space
