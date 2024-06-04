import SiteNode from "./site-node.mjs"
import { confMod, infoMod, rebirthMod, scanMod, templateMod } from "./modules.mjs"

import fs from "node:fs"


export class Tag extends SiteNode {
  static modules = [
    async node=> {
      node.tag = node.outName
      node.title = node.tag
      node.titlePlain = node.tag
      node.titleHtml = node.tag
      node.posts = node.parent.raw[node.tag]
      node.count = node.posts.length
      node.color = node.parent.conf.tags[node.tag]?.color || null
      node.desc = node.parent.conf.tags[node.tag]?.desc || null
    },
    templateMod("blog", {
      ctxSelf: node => {
        return { list: node.posts }
      },
    }),
  ]
}

export class TagSet extends SiteNode {
  static modules = [
    async node => {
      node.raw = {}
      await node.root.visit({
        Post: async n=> {
          for (let x = 0; x < n.tags.length; x++) {
            if (!node.raw[n.tags[x]]) node.raw[n.tags[x]] = []
            node.raw[n.tags[x]].push(n)
          }
        }
      })
      node.names = Object.keys(node.raw)
      node.map = {}
    },
    confMod({
      filename: "tags.json",
      defaults: {
        tags: {},
      },
    }),
    infoMod,
    templateMod("tagset"),
    async node=> {
      node.tags = []
      let tag
      for (let x = 0; x < node.names.length; x++) {
        tag = node.names[x]
        const t = await node.add(Tag, {name: "", outName: tag})
        node.tags.push(t)
        node.map[tag] = t
      }
      node.tags.sort((a, b) => b.posts.length - a.posts.length)
      await node.root.visit({
        Post: async n => {
          n.taglist = n.tags.map(t=> node.get(t))
        }
      })
    },
  ]
  get(t) { return this.map[t] }
  clip(n = 0) {
    return n ? this.tags.slice(0, n) : this.tags
  }
}


export default TagSet
