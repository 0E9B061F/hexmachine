import Color from "color"
import SiteNode from "./site-node.mjs"
import { confMod, infoMod, templateMod, timebubbleMod } from "./modules.mjs"
import { sortPosts } from "./space.mjs"

// /groups/personal
// /tags/update

export class Group extends SiteNode {
  static modules =[
    async node=> {
      node.name = node.conf.group.name
      node.slug = Tag.slug(node.name)
      node.pretty = node.name.replace(/(\s|^)[a-z]/g, (m)=> m.toUpperCase())
      node.title = node.pretty
      node.titlePlain = node.pretty
      node.titleHtml = node.pretty
      node.color = node.conf.group.color
      node.tags = []
      node.posts = []
      node.colorclass = `grouped-${node.slug}`
    },
    sortPosts({prop: "tags", by: "count"}),
    sortPosts(),
    timebubbleMod({prop: "tags"}),
    templateMod("blog", {
      ctxSelf: node => {
        return { list: node.posts }
      },
    }),
  ]
  get count() {
    return this.tags.length
  }
  addTag(t) {
    this.tags.push(t)
    this.posts.push(...t.posts)
    this.posts = [...new Set(this.posts)]
    t.setGroup(this)
  }
}

export class GroupSet extends SiteNode {
  static modules = [
    confMod({
      filename: "groups.json",
      defaults: {
        groups: {},
      },
    }),
    async node=> {
      node.index = {}
      node.groups = []
      node.ungrouped = await node.add(Group, {name: "", outName: Tag.slug("ungrouped"), group: {
        name: "ungrouped",
      }})
      const pairs = Object.entries(node.conf.groups)
      let g, p, obj
      for (let n = 0; n < pairs.length; n++) {
        p = pairs[n]
        obj = {
          name: p[0],
          color: p[1].color,
        }
        g = await node.add(Group, {name: "", outName: Tag.slug(obj.name), group: obj})
        node.index[g.name] = g
        node.groups.push(g)
      }
      await node.root.visit({
        Tag: async n=> {
          if (n.group) {
            if (!node.index[n.group]) {
              g = await node.add(Group, {name: "", outName: Tag.slug(n.group), group: {name: n.group}})
              node.index[g.name] = g
              node.groups.push(g)
            }
            node.index[n.group].addTag(n)
          } else {
            node.ungrouped.addTag(n)
          }
        }
      })
      node.addRules()
    },
    infoMod,
    sortPosts({prop: "groups", by: "count"}),
    timebubbleMod({prop: "groups"}),
    templateMod("groups"),
  ]
  addRules() {
    let group
    for (let x = 0; x < this.groups.length; x++) {
      group = this.groups[x]
      if (group.color) {
        const hl = Color(group.color).lighten(0.4).hex()
        this.root.tagcss.addRule(`.hexlink.grouped-${group.slug}:not(.hl-plain, .hl-current) > .hl-inner > .hl-title, .colorize.grouped-${group.slug}`, {
          color: `${group.color} !important`,
        })
        this.root.tagcss.addRule(`.hexlink.grouped-${group.slug}:not(.hl-plain, .hl-current):hover > .hl-inner > .hl-title`, {
          color: `${hl} !important`,
          "text-decoration-color": `${hl} !important`,
        })
      }
    }
  }
}

export class Tag extends SiteNode {
  static slug(s) {
    return s.replace(/\s/g, "_")
  }
  static modules = [
    async node=> {
      node.tag = node.conf.tag
      node.group = node.parent.conf.tags[node.tag]?.group
      node.slug = Tag.slug(node.tag)
      node.title = node.tag
      node.titlePlain = node.tag
      node.titleHtml = node.tag
      node.posts = node.parent.raw[node.tag]
      node.color = node.parent.conf.tags[node.tag]?.color || null
      node.desc = node.parent.conf.tags[node.tag]?.desc || null
      node.colorclass = `tagged-${node.slug}`
    },
    sortPosts(),
    timebubbleMod({prop: "posts"}),
    templateMod("blog", {
      ctxSelf: node => {
        return { list: node.posts }
      },
    }),
  ]
  get count() {
    return this.posts.length
  }
  setGroup(g) {
    this.groupobj = g
    this.colorclass = `${g.colorclass} ${this.colorclass}`
  }
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
    async node=> {
      node.tags = []
      let tag
      for (let x = 0; x < node.names.length; x++) {
        tag = node.names[x]
        const t = await node.add(Tag, {name: "", outName: Tag.slug(tag), tag})
        node.tags.push(t)
        node.map[tag] = t
      }
      node.tags.sort((a, b) => b.posts.length - a.posts.length)
      await node.root.visit({
        Post: async n=> {
          n.taglist = n.tags.map(t=> node.get(t))
        }
      })
      node.addRules()
    },
    timebubbleMod({prop: "tags"}),
    templateMod("tagset"),
  ]
  get(t) { return this.map[t] }
  clip(n = 0) {
    return n ? this.tags.slice(0, n) : this.tags
  }
  addRules() {
    let tag
    for (let x = 0; x < this.tags.length; x++) {
      tag = this.tags[x]
      if (tag.color) {
        const hl = Color(t.color).lighten(0.4).hex()
        node.root.tagcss.addRule(`.hexlink.tagged-${tag.slug}:not(.hl-plain, .hl-current) > .hl-inner > .hl-title, .colorize.tagged-${tag.slug}`, {
          color: `${t.color} !important`,
        })
        node.root.tagcss.addRule(`.hexlink.tagged-${tag.slug}:not(.hl-plain, .hl-current):hover > .hl-inner > .hl-title`, {
          color: `${hl} !important`,
          "text-decoration-color": `${hl} !important`,
        })
      }
    }
  }
}


export default TagSet
