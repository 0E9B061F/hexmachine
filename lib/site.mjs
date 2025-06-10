import { cp, writeFile, mkdir } from "node:fs/promises"
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
    anchor: false,
    current: false,
    content: false,
    ...conf,
  }

  const data = ast.data || (ast.data = {})

  const classes = ["hexlink", "hl-shortcut"]
  if (conf.external) {
    classes.push("hl-external", `hl-${conf.external}`)
  }
  if (conf.anchor) classes.push("hl-anchor")
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

const hexaline =(ln)=> {
  const className = ["hg-line"]
  if (ln.host) className.push("hg-host")
  const line = {
    type: "element", tagName: "div",
    properties: { className }, children: [],
  }
  if (ln.yin) {
    const second = { type: "element", tagName: "div", properties: { className: ["hg-segment"] }, children: [] }
    if (ln.old) {
      // second.children.push()
    }
    line.children.push(
      { type: "element", tagName: "div", properties: { className: ["hg-segment hg-black"] } },
      second,
      { type: "element", tagName: "div", properties: { className: ["hg-segment hg-black"] } },
    )
  } else {
    const main = { type: "element", tagName: "div", properties: { className: ["hg-segment hg-black hg-full"] }, children: [] }
    if (ln.old) {
      // main.children.push()
    }
    line.children.push(main)
  }
  return line
}

const buildhex =(conf)=> {
  const headc = []
  const infoc = []
  const leftc = []
  const footc = []
  if (conf.info) {
    if (conf.full) {
      infoc.push(
        { type: "element", tagName: "div", properties: { className: ["hgi-line", "hgi-title"] }, children: [
          { type: "element", tagName: "div", properties: { className: ["hgi-number"] }, children: [{ type: "text", value: `${conf.hg.num.toString()}.` }] },
          { type: "element", tagName: "div", properties: { className: ["hgi-names"] }, children: [
            { type: "element", tagName: "span", properties: { className: ["hgi-eng"] }, children: [{ type: "text", value: conf.hg.pretty }] },
            { type: "element", tagName: "br", properties: {} },
            { type: "element", tagName: "span", properties: { className: ["hgi-tc"] }, children: [{ type: "text", value: conf.hg.tc }] },
            { type: "text", value: " " },
            { type: "element", tagName: "span", properties: { className: ["hgi-pinyin"] }, children: [{ type: "text", value: `(${conf.hg.pinyin})` }] },
          ]},
        ]},
        { type: "element", tagName: "div", properties: { className: ["hgi-binary"] }, children: [
          { type: "text", value: "Binary: "},
          { type: "element", tagName: "span", properties: { className: ["hgi-literal"] }, children: [{ type: "text", value: conf.hg.literal }] },
          { type: "text", value: " Value: "},
          { type: "element", tagName: "span", properties: { className: ["hgi-binay"] }, children: [{ type: "text", value: conf.hg.binary.toString() }] },
        ] },
        { type: "element", tagName: "div", properties: { className: ["hgi-opposite"] }, children: [
          { type: "element", tagName: "div", properties: { className: ["hgi-oplab"] }, children: [{ type: "text", value: "Opposite: " }] },
          { type: "element", tagName: "div", properties: { className: ["hgi-card"] }, children: buildhex({
            hg: conf.hg.opposite,
            info: true,
            full: false,
            left: true,
          })}
        ], }
      )
    } else if (conf.left)  {
      leftc.push(
        { type: "element", tagName: "div", properties: { className: ["hgi-tc"] }, children: [{ type: "text", value: conf.hg.tc }] },
        { type: "element", tagName: "div", properties: { className: ["hgi-eng"] }, children: [{ type: "text", value: conf.hg.pretty }] },
      )
    } else {
      headc.push(
        { type: "element", tagName: "div", properties: { className: ["hgi-number"] }, children: [{ type: "text", value: `${conf.hg.num.toString()}.` }] },
      )
      infoc.push(
        { type: "element", tagName: "div", properties: { className: ["hgi-tc"] }, children: [{ type: "text", value: conf.hg.tc }] },
        { type: "element", tagName: "div", properties: { className: ["hgi-eng"] }, children: [{ type: "text", value: conf.hg.pretty }] },
      )
      footc.push(
        { type: "element", tagName: "div", properties: { className: ["hgi-literal"] }, children: [{ type: "text", value: conf.hg.literal }] },
      )
    }
  }

  const mchildren = []
  if (leftc.length) {
    mchildren.push({
      type: "element", tagName: "div", properties: { className: ["hg-left"] }, children: leftc
    })
  }
  mchildren.push({
    type: "element", tagName: "div", properties: { className: ["hexagram"] }, children: conf.hg.lines.map(ln => hexaline(ln))
  })
  if (infoc.length) {
    mchildren.push({
      type: "element", tagName: "div", properties: { className: ["hg-info"] }, children: infoc
    })
  }
  const children = [
    { type: "element", tagName: "div", properties: { className: ["hg-head"] }, children: headc },
    { type: "element", tagName: "div", properties: { className: ["hg-main"] }, children: mchildren },
    { type: "element", tagName: "div", properties: { className: ["hg-foot"] }, children: footc },
  ]

  return children
}

const HexMode = {
  Plain: 0,
  Info: 1,
  Left: 2,
  Full: 3,
}

const hexagram =(ast, conf)=> {
  conf = {
    hg: null,
    hosted: true,
    info: true,
    full: false,
    left: false,
    mode: HexMode.Info,
    ...conf,
  }

  if (typeof (conf.info) === "string") conf.info = conf.info === "true"
  if (typeof (conf.full) === "string") conf.full = conf.full === "true"
  if (typeof (conf.hosted) === "string") conf.hosted = conf.hosted === "true"

  const data = ast.data || (ast.data = {})
  
  data.hName = "div"
  data.hProperties = {
    className: ["hg-card"],
  }
  data.hChildren = buildhex(conf)
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

const parseInnerLink =(s, info)=> {
	const p1 = s.split("|")
	let label = p1[0]
	let id = p1[1]
	if (id === undefined) {
		id = label
    label = null
	}
  const p2 = id.split(">")
  let ns = p2[0] || null
	let title = p2[1]
  if (title === undefined) {
    title = ns
    ns = null
	} else if (title === "") title = null
  if (title == "@") {
    ns = info.namespace
    title = info.title
    console.log(ns, title)
    throw new Error()
  }
  const data = { ns, title, label }
  return data
}

const directiveMod = async node=> {
  node.hmd.directive("abbr", ["text"], ast=> {
    const conf = {
      def: "",
      ...ast.attributes,
    }
    const data = ast.data || (ast.data = {})
    data.hName = "abbr"
    data.hProperties = {
      title: conf.def,
    }
  })

  node.hmd.directive("clear", ["text", "leaf"], ast=> {
    const data = ast.data || (ast.data = {})
    data.hName = "div"
    data.hProperties = {
      class: ["clear"],
    }
  })

  node.hmd.directive("dec", ["container"], ast=> {
    const conf = {
      ...ast.attributes,
    }
    const data = ast.data || (ast.data = {})
    conf.names = conf.names || conf.id
    conf.names = conf.names.split(",").map(n=> `deco-${n}`)
    conf.names.push("decorated", "decorated-block")

    data.hName = "div"
    data.hProperties = {
      class: conf.names,
    }
  })
  node.hmd.directive("dec", ["text"], ast=> {
    const conf = {
      ...ast.attributes,
    }
    const data = ast.data || (ast.data = {})
    conf.names = conf.names || conf.id
    conf.names = conf.names.split(",").map(n=> `deco-${n}`)
    conf.names.push("decorated", "decorated-line")

    data.hName = "span"
    data.hProperties = {
      class: conf.names,
    }
  })
  node.hmd.directive("dec", ["leaf"], ast=> {
    const conf = {
      ...ast.attributes,
    }
    const data = ast.data || (ast.data = {})
    conf.names = conf.names || conf.id
    conf.names = conf.names.split(",").map(n=> `deco-${n}`)
    conf.names.push("decorated", "decorated-para")

    data.hName = "p"
    data.hProperties = {
      class: conf.names,
    }
  })
  node.hmd.directive("fig", ["leaf", "text"], ast=> {
    const conf = {
      pos: "right",
      ...ast.attributes,
    }
    const data = ast.data || (ast.data = {})

    if (!conf.size) {
      if (conf.pos == "center") conf.size = 450
      else conf.size = 280
    }

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

  node.hmd.directive("section", ["container"], ast=> {
    const conf = {
      collapse: false,
      ...ast.attributes,
    }
    const data = ast.data || (ast.data = {})

    const state = conf.collapse ? "collapsed" : "open"

    data.hName = "div"
    data.hProperties = {
      class: ["hex-section", `hs-${state}`]
    }
  })

  node.hmd.directive("hgchart", ["container"], ast => {
    const conf = {
      ...ast.attributes,
    }
    const data = ast.data || (ast.data = {})

    data.hName = "div"
    data.hProperties = {
      class: ["hg-chart"]
    }
  })

  node.hmd.directive("hg", ["text", "leaf"], (ast, file, info)=> {
    const conf = { ...ast.attributes }
    const lit = conf.id
    if (lit[0] == "n") {
      const id = parseInt(lit.slice(1))
      conf.hg = Hexagram.bynumber[id]
    } else {
      const reduced = lit.split("").map(n=> {
        n = parseInt(n)
        return n > 1 ? n - 2 : n
      }).join("")
      const id = parseInt(reduced, 2)
      conf.hg = Hexagram.bybinary[id]
    }
    hexagram(ast, conf)
  })

  node.hmd.directive("i", ["text"], (ast, file, info)=> {
    let txt = toString(ast.children)
    let data = parseInnerLink(txt, info)
    let href
    if (!data.ns && !data.title) {
      href = "/"
      if (!data.label) {
        data.label = node.title
      }
    } else {
      const implied = !data.ns
      const effective = data.ns || node.conf.defaultns
      href = `/${effective}/${data.title}`
      if (!data.label) {
        data.label = implied ? data.title : `${data.ns}:${data.title}`
      }
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

  node.hmd.directive("a", ["text"], ast=> {
    const txt = toString(ast.children)
    const slug = txt.replace(/\s+/g, "-").toLowerCase()

    hexlink(ast, {
      href: `#${slug}`, content: txt, anchor: true,
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

class Hexaline {
  constructor(id, host) {
    this.id = id
    this.host = host
    switch (this.id) {
      case 0:
        this.yin = true
        this.old = false
        break
      case 1:
        this.yin = false
        this.old = false
        break
      case 2:
        this.yin = true
        this.old = true
        break
      case 3:
        this.yin = false
        this.old = true
        break
      default:
        throw new Error(`invalid line id ${this.id}`)
    }
  }
}

class Hexagram {
  static inventory = []
  static bynumber = {}
  static bybinary = {}
  static add(...args) {
    const hg = new this(...args)
    this.inventory.push(hg)
    this.bynumber[hg.num] = hg
    this.bybinary[hg.binary] = hg
  }
  static link() {
    this.inventory.forEach(hg=> hg.link())
  }
  constructor(num, tc, sc, pinyin, eng, binary, od, hosts) {
    this.num = num
    this.tc = tc
    this.sc = sc
    this.pinyin = pinyin
    this.eng = eng
    this.pretty = this.eng.replace(/\b([a-z])/g, (m, p) => p.toUpperCase())
    this.binary = binary
    this.od = od
    this.hosts = hosts
    this.literal = this.binary.toString(2).padStart(6, "0")
    this.lines = this.literal.split("").map((n, i)=> {
      n = parseInt(n)
      const host = this.hosts.indexOf(7 - (i + 1)) >= 0
      return new Hexaline(n, host)
    })
  }
  link() {
    this.opposite = this.constructor.bynumber[this.od]
  }
}

Hexagram.add(1, "乾", "乾", "qián", "initiating", 0b111111, 2, [5])
Hexagram.add(2, "坤", "坤", "kūn", "responding", 0b000000, 1, [2])
Hexagram.add(3, "屯", "屯", "zhūn", "beginning", 0b010001, 50, [1,5])
Hexagram.add(4, "蒙", "蒙", "méng", "childhood", 0b100010, 49, [2,5])
Hexagram.add(5, "需", "需", "xū", "needing", 0b010111, 35, [5])
Hexagram.add(6, "訟", "讼", "sòng", "contention", 0b111010, 36, [5])
Hexagram.add(7, "師", "师", "shī", "multitude", 0b000010, 13, [2])
Hexagram.add(8, "比", "比", "bǐ", "union", 0b010000, 14, [5])
Hexagram.add(9, "小畜", "小畜", "xiǎo chù", "little accumulation", 0b110111, 16, [4])
Hexagram.add(10, "履", "履", "lǚ", "fulfillment", 0b111011, 15, [3,5])
Hexagram.add(11, "泰", "泰", "tài", "advance", 0b000111, 12, [2,5])
Hexagram.add(12, "否", "否", "pǐ", "hindrance", 0b111000, 11, [2,5])
Hexagram.add(13, "同人", "同人", "tóng rén", "seeking harmony", 0b111101, 7, [2,5])
Hexagram.add(14, "大有", "大有", "dà yǒu", "great harvest", 0b101111, 8, [5])
Hexagram.add(15, "謙", "谦", "qiān", "humbleness", 0b000100, 10, [3])
Hexagram.add(16, "豫", "豫", "yù", "delight", 0b001000, 9, [4])
Hexagram.add(17, "隨", "随", "suí", "following", 0b011001, 18, [1])
Hexagram.add(18, "蠱", "蛊", "gǔ", "remedying", 0b100110, 17, [6])
Hexagram.add(19, "臨", "临", "lín", "approaching", 0b000011, 33, [1,2])
Hexagram.add(20, "觀", "观", "guān", "watching", 0b110000, 34, [5,6])
Hexagram.add(21, "噬嗑", "噬嗑", "shì kè", "eradicating", 0b101001, 48, [4])
Hexagram.add(22, "賁", "贲", "bì", "adorning", 0b100101, 47, [2,6])
Hexagram.add(23, "剝", "剥", "bō", "falling away", 0b100000, 43, [6])
Hexagram.add(24, "復", "复", "fù", "turning back", 0b000001, 44, [1])
Hexagram.add(25, "無妄", "无妄", "wú wàng", "without falsehood", 0b111001, 46, [1,5])
Hexagram.add(26, "大畜", "大畜", "dà chù", "great accumulation", 0b100111, 45, [6])
Hexagram.add(27, "頤", "颐", "yí", "nourishing", 0b100001, 28, [6])
Hexagram.add(28, "大過", "大过", "dà guò", "great exceeding", 0b011110, 27, [2,5])
Hexagram.add(29, "坎", "坎", "kǎn", "darkness", 0b010010, 30, [2,5])
Hexagram.add(30, "離", "离", "lí", "brightness", 0b101101, 29, [2,5])
Hexagram.add(31, "咸", "咸", "xián", "mutual influence", 0b011100, 41, [3,6])
Hexagram.add(32, "恆", "恒", "héng", "long lasting", 0b001110, 42, [2])
Hexagram.add(33, "遯", "遯", "dùn", "Retreat", 0b111100, 19, [2])
Hexagram.add(34, "大壯", "大壮", "dà zhuàng", "Great Strength", 0b001111, 20, [4])
Hexagram.add(35, "晉", "晋", "jìn", "Proceeding Forward", 0b101000, 5, [5])
Hexagram.add(36, "明夷", "明夷", "míng yí", "Brilliance Injured", 0b000101, 6, [2,5])
Hexagram.add(37, "家人", "家人", "jiā rén", "Household", 0b110101, 40, [2,5])
Hexagram.add(38, "睽", "睽", "kuí", "Diversity", 0b101011, 39, [2,5])
Hexagram.add(39, "蹇", "蹇", "jiǎn", "Hardship", 0b010100, 38, [5])
Hexagram.add(40, "解", "解", "xiè", "Relief", 0b001010, 37, [2,5])
Hexagram.add(41, "損", "损", "sǔn", "Decreasing", 0b100011, 31, [5])
Hexagram.add(42, "益", "益", "yì", "Increasing", 0b110001, 32, [1])
Hexagram.add(43, "夬", "夬", "guài", "Eliminating", 0b011111, 23, [6])
Hexagram.add(44, "姤", "姤", "gòu", "Encountering", 0b111110, 24, [1])
Hexagram.add(45, "萃", "萃", "cuì", "Bringing Together", 0b011000, 26, [2,5])
Hexagram.add(46, "升", "升", "shēng", "Growing Upward", 0b000110, 25, [1])
Hexagram.add(47, "困", "困", "kùn", "Exhausting", 0b011010, 22, [5])
Hexagram.add(48, "井", "井", "jǐng", "Replenishing", 0b010110, 21, [5])
Hexagram.add(49, "革", "革", "gé", "Abolishing The Old", 0b011101, 4, [5])
Hexagram.add(50, "鼎", "鼎", "dǐng", "Establishing The New", 0b101110, 3, [5])
Hexagram.add(51, "震", "震", "zhèn", "Taking Action", 0b001001, 57, [1])
Hexagram.add(52, "艮", "艮", "gèn", "Keeping Still", 0b100100, 58, [6])
Hexagram.add(53, "漸", "渐", "jiàn", "Developing Gradually", 0b110100, 54, [2,5])
Hexagram.add(54, "歸妹", "归妹", "guī mèi", "Marrying Maiden", 0b001011, 53, [3,5])
Hexagram.add(55, "豐", "丰", "fēng", "Abundance", 0b001101, 59, [5])
Hexagram.add(56, "旅", "旅", "lǚ", "Travelling", 0b101100, 60, [5])
Hexagram.add(57, "巽", "巽", "xùn", "Proceeding Humbly", 0b110110, 51, [5])
Hexagram.add(58, "兌", "兑", "duì", "Joyful", 0b011011, 52, [2,5])
Hexagram.add(59, "渙", "涣", "huàn", "Dispersing", 0b110010, 55, [4,5])
Hexagram.add(60, "節", "节", "jié", "Restricting", 0b010011, 56, [5])
Hexagram.add(61, "中孚", "中孚", "zhōng fú", "Innermost Sincerity", 0b110011, 62, [2,5])
Hexagram.add(62, "小過", "小过", "xiǎo guò", "Little Exceeding", 0b001100, 61, [2,5])
Hexagram.add(63, "既濟", "既济", "jì jì", "Already Fulfilled", 0b010101, 64, [2])
Hexagram.add(64, "未濟", "未济", "wèi jì", "Not Yet Fulfilled", 0b101010, 63, [5])
Hexagram.link()

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
      n.imageCache = n.conf.imageCache || false
      if (n.imageCache) await mkdir(n.imageCache, {recursive: true})
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
    this.templates.helper('getlines', (lit) => {
      if (typeof (lit) === "number") {
        lit = lit.toString(4)
      }
      const reduced = lit.split("").map(n=> {
        n = parseInt(n)
        return n > 1 ? n - 2 : n
      }).join("")
      const id = parseInt(reduced, 2)
      const hg = Hexagram.bybinary[id]
      const hosts = hg.hostsmask
      lit = lit.split("").map((n, i)=> {
        const host = hosts[i]
        n = parseInt(n)
        switch (n) {
          case 0:
            return { old: false, yin: true, host }
          case 1:
            return { old: false, yin: false, host }
          case 2:
            return { old: true, yin: true, host }
          case 3:
            return { old: true, yin: false, host }
        }
      })

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
