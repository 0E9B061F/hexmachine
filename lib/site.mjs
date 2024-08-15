import { cp, writeFile } from "node:fs/promises"
import { basename } from "node:path"

import Color from "color"
import { toHast } from "mdast-util-to-hast"
import { toString } from "mdast-util-to-string"

import { templateMod, infoMod, siteInfoMod, confMod, hexInfoMod, hrefMod } from "./modules.mjs"
import SiteNode from "./site-node.mjs"
import Templates from "./templates.mjs"
import Sitemap from "./sitemap.mjs"
import Robots from "./robots.mjs"
import ImageSet from "./image-set.mjs"
import { TagSet, GroupSet } from "./tag-set.mjs"
import { Index } from "./space.mjs"
import available from "./available.mjs"

const autoseek = "://"
const autoext =(url, full=false)=> {
  let si = 0
  let out, c, n
  for (n = 0; n < url.length; n++) {
    c = url[n]
    if (c == autoseek[si]) {
      si += 1
      if (si > autoseek.length - 1) {
        out = url.slice(n+1)
        break
      }
    } else if (si > 0) {
      out = url.slice(n)
      break
    }
  }
  if (full) {
    for (n = 0; n < out.length; n++) {
      c = out[n]
      if (c == ":" || c == "/") {
        out = out.slice(0, n)
        break
      }
    }
  }
  return out
}

const hexlink =(ast, conf)=> {
  conf = {
    href: "/",
    external: false,
    decorated: false,
    current: false,
    content: false,
    ...conf,
  }

  const data = ast.data || (ast.data = {})

  const classes = ["hexlink", "hl-shortcut"]
  if (conf.external) {
    classes.push("hl-external", `hl-${conf.external}`)
  }
  if (conf.decorated) classes.push("hl-decorated")
  if (conf.current) classes.push("hl-current")
  const innertag = conf.current ? "span" : "a"

  if (!conf.content) {
    conf.content = toString(ast.children)
  }

  data.hName = "span"
  data.hProperties = {
    className: classes,
  }
  data.hChildren = [{
    type: "element", tagName: innertag,
    properties: {
      href: conf.href,
      className: ["hl-inner"],
    },
    children: [
      {type: "element", tagName: "span", properties: {
        className: ["hl-title"],
      }, children: [
        {type: "text", value: conf.content},
      ]}
    ],
  }]
}

const truncate =s=> {
  let c
  for (let n = 0; n < s.length; n++) {
    c = s[n]
    if (c == "'" || c == "(" || c == ")" || c == "," || c == "[" || c == "]" || c == ":") {
      return s.slice(0, n).trim()
    }
  }
}

const parseExtLink =s=> {
	const p1 = s.split("|")
	let label = p1[0]
	let url = p1[1]
  if (label == "") {
    label = autoext(url, true)
  } else if (!url) {
		url = label
    label = autoext(url)
	}
  return { url, label }
}

const parseMailLink =s=> {
	const p1 = s.split("|")
	let label = p1[0]
	let addr = p1[1]
  if (!addr) {
		addr = label
	}
  return { addr, label }
}

const parseIsfdbLink =(s, type)=> {
	const p1 = s.split("|")
	let label = p1[0]
	let id = p1[1]
  if (!id) {
		id = label
    label = `ISFDB ${type} Record #${id}`
	}
  return { id, label }
}

const parseWikiLink =s=> {
	const p1 = s.split("|")
	let label = p1[0]
	let title = p1[1]
  if (label === "") {
    label = truncate(title)
  } else if (title === "") {
    title = truncate(label)
  } else if (!title) {
		title = label
    label = null
	}
  const data = { title, label }
  return data
}

const parseGithubLink =s=> {
	const p1 = s.split("|")
	let label = p1[0]
	let repo = p1[1]
  if (label === "") {
    label = basename(repo)
  } else if (!repo) {
		repo = label
    label = repo
	}
  const data = { repo, label }
  return data
}

const parseInnerLink =s=> {
	const p1 = s.split("|")
	let label = p1[0]
	let id = p1[1]
	if (!id) {
		id = label
    label = null
	}
  const p2 = id.split(":")
  let ns = p2[0]
	let title = p2[1]
  if (!title) {
    title = ns
    ns = null
	}
  const data = {ns, title, label }
  return data
}

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
          { type: "null", data: { hName: "img", hProperties: { src, baseimg: conf.img, className: ["heximage"] } } },
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

  node.hmd.directive("i", ["text"], ast=> {
    let txt = toString(ast.children)
    let data = parseInnerLink(txt)
    const implied = !data.ns
    const effective = data.ns || node.conf.defaultns
    let href = `/${effective}/${data.title}`
    if (!data.label) {
      data.label = implied ? data.title : `${data.ns}:${data.title}`
    }

    hexlink(ast, { href, content: data.label })
  })

  node.hmd.directive("e", ["text"], ast=> {
    let txt = toString(ast.children)
    let data = parseExtLink(txt)
    if (!data.label) {
      data.label = autoext(data.url)
    }

    hexlink(ast, {
      href: data.url, external: "generic", decorated: true, content: data.label,
    })
  })

  node.hmd.directive("w", ["text"], ast=> {
    let txt = toString(ast.children)
    let data = parseWikiLink(txt)
    if (!data.label) {
      data.label = data.title
    }
    data.title = data.title.replace(/\s+/g, '_')
    const href = `https://en.wikipedia.org/wiki/${data.title}`

    hexlink(ast, {
      href, external: "wiki", decorated: true, content: data.label,
    })
  })

  node.hmd.directive("gh", ["text"], ast=> {
    let txt = toString(ast.children)
    let data = parseGithubLink(txt)
    const href = `https://github.com/${data.repo}`

    hexlink(ast, {
      href, external: "github", decorated: true, content: data.label,
    })
  })

  node.hmd.directive("m", ["text"], ast=> {
    let txt = toString(ast.children)
    let data = parseMailLink(txt)
    const href = `mailto:${data.addr}`

    hexlink(ast, {
      href, external: "mail", decorated: true, content: data.label,
    })
  })

  const isfdb =(ast, type, url)=> {
    let txt = toString(ast.children)
    let data = parseIsfdbLink(txt, type)

    hexlink(ast, {
      href: `${url}?${data.id}`,
      external: "isfdb", decorated: true, content: data.label,
    })
  }

  node.hmd.directive("sfa", ["text"], ast=> {
    isfdb(ast, "Author", "https://www.isfdb.org/cgi-bin/ea.cgi")
  })
  
  node.hmd.directive("sfp", ["text"], ast=> {
    isfdb(ast, "Publication", "https://www.isfdb.org/cgi-bin/pl.cgi")
  })
  
}

export const mountMod =async(node)=> {
  const paths = Object.keys(node.conf.mount)
  let path, type
  for (let n = 0; n < paths.length; n++) {
    path = paths[n]
    type = node.conf.mount[path]
    await node.add(available[type], { name: path, outName: path })
  }
}


export class Copier extends SiteNode {
  static modules = [
    async node => {
      node.setFilename(node.base)
      node.hook("compile", async n => {
        await cp(n.path, n.outfile(n.base), {recursive: true})
      })
    },
  ]
}

export class Metadata extends SiteNode {
  static defaults = {
    filename: "metadata.json"
  }
  static modules = [
    async node => {
      node.hook("compile", async n => {
        await writeFile(n.index, JSON.stringify({
          title: n.root.title,
          desc: n.root.desc,
          author: n.root.author,
          version: n.root.version,
          license: n.root.license,
          host: n.root.host,
          mirrors: n.root.mirrors,
          repository: n.root.repository,
          generator: n.root.generator,
        }, null, 2), {encoding: "utf-8"})
      })
    },
    hrefMod(),
  ]
}

class CSSDeclaration {
  constructor(prop, val) {
    this.prop = prop
    this.val = val
  }
}

class CSSRule {
  constructor(selector, declarations) {
    this.selector = selector
    this.declarations = Object.entries(declarations).map(p=> new CSSDeclaration(p[0], p[1]))
  }
}

export class CSS extends SiteNode {
  static defaults = {
    filename: "style.css",
  }
  static modules = [
    async node=> {
      node.rules = []
    },
    templateMod("css", {solo: true}),
  ]
  addRule(selector, declarations) {
    this.rules.push(new CSSRule(selector, declarations))
  }
}

export class Site extends SiteNode {
  static defaults = {
    colors: {
      depth: [
        "#de2657",
        "#dead25",
        "#6e7fd2",
      ],
      external: "#4090a7",
      anchor: "#af80ef",
    },
    defaultns: "main",
  }
  static modules = [
    async n=> {
      n.gomap = {}
      const { default: hmd } = await import("./hmd.mjs")
      n.hmd = hmd
      n.templates = await n.add(Templates, { name: "templates", outName: "templates", filename: "index.html" })
      n.images = await n.add(ImageSet, { name: "images", outName: "site/images" })
      n.mirror = n.conf.mirror
    },
    directiveMod,
    hexInfoMod(".."),
    confMod(),
    siteInfoMod,
    infoMod,
    mountMod,
    async n=> {
      await n.add(Copier, { name: "favicon.ico", outName: "" })
      await n.add(Copier, { name: "favicons", outName: "site" })
      
      n.tagcss = await n.add(CSS, { name: "", outName: "site", filename: "tags.css" })
      let color, hl
      for (let depth = 0; depth < n.conf.colors.depth.length; depth++) {
        color = n.conf.colors.depth[depth]
        hl = Color(color).lighten(0.4).hex()
        n.tagcss.addRule(`.hexlink.hl-depth${depth}:not(.hl-plain, .hl-current) > .hl-inner > .hl-title, .colorize.hl-depth${depth}`, {
          color: `${color} !important`,
        })
        n.tagcss.addRule(`.hexlink.hl-depth${depth}:not(.hl-plain, .hl-current):hover > .hl-inner > .hl-title`, {
          color: `${hl} !important`,
          "text-decoration-color": `${hl} !important`,
        })
      }

      color = n.conf.colors.external
      hl = Color(color).lighten(0.4).hex()
      n.tagcss.addRule(`.hexlink.hl-external:not(.hl-plain, .hl-current) > .hl-inner > .hl-title, .colorize.hl-external`, {
        color: `${color} !important`,
      })
      n.tagcss.addRule(`.hexlink.hl-external:not(.hl-plain, .hl-current):hover > .hl-inner > .hl-title`, {
        color: `${hl} !important`,
        "text-decoration-color": `${hl} !important`,
      })

      color = n.conf.colors.anchor
      hl = Color(color).lighten(0.4).hex()
      n.tagcss.addRule(`.hexlink.hl-anchor:not(.hl-plain, .hl-current) > .hl-inner > .hl-title, .colorize.hl-anchor`, {
        color: `${color} !important`,
      })
      n.tagcss.addRule(`.hexlink.hl-anchor:not(.hl-plain, .hl-current):hover > .hl-inner > .hl-title`, {
        color: `${hl} !important`,
        "text-decoration-color": `${hl} !important`,
      })

      n.tags = await n.add(TagSet, { name: "", outName: "tags" })
      n.groups = await n.add(GroupSet, { name: "", outName: "groups" })
      n.robots = await n.add(Robots, { name: "", outName: "" })
      n.siteindex = await n.add(Index, { name: "", outName: "index" })
      n.sitemap = await n.add(Sitemap, { name: "", outName: "" })
      await n.add(Metadata, { name: "", outName: "" })

      n.btime = n.siteindex.btime
      n.bdate = n.siteindex.bdate
      n.mtime = n.siteindex.mtime
      n.mdate = n.siteindex.mdate
    },
    templateMod("home", {
      wrapper: "site",
      ctxAll: async (node, ctx)=> {
        return {
          long: await node.siteindex.external(25, ctx),
          short: await node.siteindex.external(5, ctx),
          mainTags: node.tags.clip(10),
        }
      },
    }),
  ]
  async init() {
    // {{>linkto (ext https://downtranslated.com "dt.com") current=current}}
    this.templates.helper('enpm', (pkg, label)=> {
      if (!label || typeof(label) != "string") label = basename(pkg)
      const href = `https://www.npmjs.com/package/${pkg}`
      return {
        href,
        external: true,
        text: label,
        current: {href: "kjdskfjksdjfsdjfjerjewuir8948998943irjkjujfuehfuwef"}
      }
    })
    this.templates.helper('egh', (repo, label)=> {
      if (!label || typeof(label) != "string") label = basename(repo)
      const href = `https://github.com/${repo}`
      return {
        href,
        external: true,
        text: label,
        current: {href: "kjdskfjksdjfsdjfjerjewuir8948998943irjkjujfuehfuwef"}
      }
    })
    this.templates.helper('ext', (href, label)=> {
      if (!label) label = autoext(href)
      return {
        href,
        external: true,
        text: label,
        current: {href: "kjdskfjksdjfsdjfjerjewuir8948998943irjkjujfuehfuwef"}
      }
    })
    this.templates.helper('current', (href, current, anchor)=> {
      href = `${href}${anchor || ""}`
      return href == current
    })
    this.templates.helper('notcurrent', (href, current, anchor)=> {
      href = `${href}${anchor || ""}`
      return href != current
    })
    this.templates.helper('deref', (space)=> {
      if (typeof(space) == "string") return this.root.go(space)
      else return space
    })
    this.templates.helper('desc', (path)=> {
      return this.go(path)?.desc
    })
    this.templates.helper('go', (path)=> {
      return this.go(path)
    })
    this.templates.helper('autoext', (url)=> {
      return url.match(/^(?:.*:(?:\/\/)?)?(.*)$/)[1]
    })
    this.templates.helper('get', (obj, index)=> {
      return obj[index]
    })
    this.templates.helper('mask', (current, href, text)=> {
      href = this.go(href).href
      const cur = current.href == href
      return cur ? { href: null, text } : { href, text }
    })
    this.templates.helper('maskraw', function (current, href, text) {
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
    this.templates.helper('thumbable', (thumb, image)=> {
      return thumb && image
    })
    this.templates.helper('def', (val, def)=> {
      if (val === false || val === null || val === undefined) {
        return def
      } else {
        return val
      }
    })
    await this.finalize()
  }
  register(node) {
    this.gomap[node.space] = node
  }
  go(path) {
    return this.gomap[path]
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
