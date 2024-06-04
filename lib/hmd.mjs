import { unified } from 'unified'

import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkGemoji from 'remark-gemoji'
import remarkDirective from 'remark-directive'
import remarkTextr from 'remark-textr'

import remarkRehype from 'remark-rehype'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'

import { toc } from 'mdast-util-toc'
import { toText } from 'hast-util-to-text'
import { visit } from 'unist-util-visit'
import { h } from 'hastscript'
import { matter } from 'vfile-matter'


class Directive {
  constructor(name, types, block) {
    this.name = name
    this.types = types.map(t=> `${t}Directive`)
    this.block = block
  }
}

function splitToc() {
  return (node, file)=> {
    const result = toc(node, {
      ordered: true,
    })
    if (!result.map) node.children = []
    else node.children = [
      result.map,
    ]
  }
}

function matterize() {
  return function (_, file) {
    matter(file)
  }
}

function plainize() {
  return (node, file) => {
    file.data.plain = toText(node)
  }
}

function dashes(input) {
  return input.replace(/\-{3}/gim, '—').replace(/\-{2}/gim, '–')
}

class HexDoc {
  constructor(doc, toc=null) {
    this.matter = doc.data.matter || {}
    this.html = String(doc)
    this.inline = this.html.replace(/[\n\s]+/g, " ")
    this.toc = toc ? String(toc) : ""
    this.plain = doc.data.plain || ""
  }
}

class HexMD {
  static directives = []
  static directive(...args) {
    this.directives.push(new Directive(...args))
  }
  static directiveHandler() {
    return tree=> {
      visit(tree, node=> {
        HexMD.directives.forEach(d => {
          if (node.name === d.name && d.types.indexOf(node.type) >= 0) {
            d.block(node)
          }
        })
      })
    }
  }
  static async parse(raw) {
    const doc = await this.parseDoc(raw)
    const toc = await this.parseToc(raw)
    return new HexDoc(doc, toc)
  }
  static async inline(raw) {
    const doc = await this.parseInline(raw)
    return new HexDoc(doc)
  }
  static async parseInline(raw) {
    return await unified()
      .data('settings', { fragment: true })
      .use(remarkParse)
      .use(remarkTextr, { plugins: [dashes] })
      .use(remarkDirective)
      .use(this.directiveHandler)
      .use(remarkGfm)
      .use(remarkGemoji)
      .use(remarkRehype)
      .use(rehypeSanitize, {
        strip: ['script'],
        ancestors: {},
        protocols: { href: ['http', 'https'] },
        tagNames: ['code', 'strong', 'b', 'em', 'i', 'strike', 's', 'del', 'a'],
        attributes: {
          a: ['href'],
          '*': ['title']
        }
      })
      .use(plainize)
      .use(rehypeStringify)
      .process(raw)
  }
  static async parseDoc(raw) {
    return await unified()
      .data('settings', { fragment: true })
      .use(remarkParse)
      .use(remarkTextr, { plugins: [dashes] })
      .use(remarkDirective)
      .use(this.directiveHandler)
      .use(remarkGfm)
      .use(remarkGemoji)
      .use(remarkRehype)
      .use(plainize)
      .use(rehypeStringify)
      .use(rehypeSlug, {prefix: ''})
      .use(rehypeAutolinkHeadings, {
        content(node) {
          return [
            h('span', '§'),
          ]
        }
      })
      .use(remarkFrontmatter)
      .use(matterize)
      .process(raw)
  }
  static async parseToc(raw) {
    return await unified()
      .use(remarkParse)
      .use(remarkTextr, { plugins: [dashes] })
      .use(remarkFrontmatter)
      .use(remarkDirective)
      .use(this.directiveHandler)
      .use(remarkGfm)
      .use(remarkGemoji)
      .use(splitToc)
      .use(remarkRehype)
      .use(rehypeStringify)
      .process(raw)
  }
}


export default HexMD
