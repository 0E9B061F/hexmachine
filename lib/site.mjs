import fs from "node:fs"

import { templateMod, infoMod, confMod } from "./modules.mjs"
import SiteNode from "./site-node.mjs"
import Templates from "./templates.mjs"
import Sitemap from "./sitemap.mjs"
import Robots from "./robots.mjs"
import ImageSet from "./image-set.mjs"
import Blog from "./blog.mjs"
import Gallery from "./gallery.mjs"
import TagSet from "./tag-set.mjs"
import { Index } from "./space.mjs"

import fse from "fs-extra"


const directiveMod = async node=> {
  node.hmd.directive("fig", ["leaf", "text"], ast=> {
    const conf = {
      pos: "right",
      ...ast.attributes,
    }
    const data = ast.data || (ast.data = {})
    if (conf.pos == "center") conf.size = 450
    else conf.size = 280

    conf.img = conf.img || conf.id

    const src = node.images.get(conf.img).href(conf.size)
    const href = node.images.get(conf.img).href()

    data.hName = "figure"
    data.hProperties = {
      class: [`fig-${conf.pos}`]
    }

    ast.children = [
      {
        type: 'null', data: { hName: "a", hProperties: { href } }, children: [
          { type: "null", data: { hName: "img", hProperties: { src } } },
        ]
      },
      { type: "null", data: { hName: "figcaption" }, children: ast.children },
    ]
  })

  node.hmd.directive("gal", ["container"], ast=> {
    const conf = {
      ...ast.attributes,
    }
    const data = ast.data || (ast.data = {})

    data.hName = "div"
    data.hProperties = {
      class: ["figallery", "hexblock", "b1"]
    }
  })

  node.hmd.directive("w", ["text"], ast=> {
    const conf = {
      ...ast.attributes,
    }
    conf.q = conf.q || toString(ast.children)
    conf.q = conf.q.replace(/\s+/g, '_')


    const data = ast.data || (ast.data = {})

    data.hName = "a"
    data.hProperties = {
      class: ["link link-external link-shortcut link-wiki"],
      href: `https://en.wikipedia.org/wiki/${conf.q}`,
    }
  })

  node.hmd.directive("sfa", ["text"], ast=> {
    const conf = {
      ...ast.attributes,
    }
    const data = ast.data || (ast.data = {})

    data.hName = "a"
    data.hProperties = {
      class: ["link link-external link-shortcut link-isfdb"],
      href: `https://www.isfdb.org/cgi-bin/ea.cgi?${conf.id}`,
    }
  })
  
  node.hmd.directive("sfp", ["text"], ast=> {
    const conf = {
      ...ast.attributes,
    }
    const data = ast.data || (ast.data = {})

    data.hName = "a"
    data.hProperties = {
      class: ["link link-external link-shortcut link-isfdb"],
      href: `https://www.isfdb.org/cgi-bin/pl.cgi?${conf.id}`,
    }
  })
}


export class Copier extends SiteNode {
  static modules = [
    async node => {
      node.hook("compile", async n => {
        await fse.copy(n.path, n.outfile(n.base))
      })
    },
  ]
}


class Site extends SiteNode {
  static modules = [
    async n=> {
      const { default: hmd } = await import("./hmd.mjs")
      n.hmd = hmd
      n.templates = await n.add(Templates, { name: "templates" })
      n.images = await n.add(ImageSet, { name: "images", outName: "site/images" })
    },
    directiveMod,
    confMod(),
    infoMod,
    async n=> {
      n.host = n.conf.host
    },
    templateMod("home", {
      wrapper: "site",
      ctxAll: async (node, ctx)=> {
        console.log(node.href, ctx?.current?.href)
        return {
          long: await node.siteindex.external(25, ctx),
          short: await node.siteindex.external(5, ctx),
          mainTags: node.tags.clip(10),
        }
      },
    }),
    async n=> {
      n.sitemap = await n.add(Sitemap, { name: "", outName: "" })
      n.robots = await n.add(Robots, { name: "", outName: "" })
      n.blog = await n.add(Blog, { name: "blog", outName: "blog" })
      n.gallery = await n.add(Gallery, { name: "gallery", outName: "gallery" })
      n.docs = await n.add(Gallery, { name: "docs", outName: "docs" })
      n.tags = await n.add(TagSet, { name: "", outName: "tags" })
      n.siteindex = await n.add(Index, { name: "", outName: "index" })
      await n.add(Copier, { name: "favicon.ico", outName: "" })
      await n.add(Copier, { name: "favicons", outName: "site" })
    }
  ]
  async init() {
    this.templates.helper('mask', function (current, href, text) {
      const cur = current.href == href
      return cur ? { href: null, text } : { href, text }
    })
    this.templates.helper('image', (name, options) => {
      options.hash = {
        size: "full",
        ...options.hash,
      }
      return this.images.get(name).href(options.hash.size)
    })
    await this.finalize()
  }
}

// const out = "/tmp/site"
// fs.mkdirSync(out, { recursive: true })
// const s = await Site.make({path: "/home/nn/code/0E9B061F.github.io", outPath: out})
// console.log(await s.outPath)
// console.log(await s.index)
// console.log(await s.sitemap.outPath)
// console.log(await s.sitemap.index)
// console.log(await s.images.outPath)
// console.log(await s.images.images[0].outPath)
// console.log(await s.blog.outPath)
// console.log(await s.blog.index)

// await s.compile()

export default Site
