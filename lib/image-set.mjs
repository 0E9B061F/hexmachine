import SiteNode from "./site-node.mjs"
import { scanMod } from "./modules.mjs"
import { mkhref } from "./util.mjs"

import { rmSync, mkdirSync, statSync, existsSync, cpSync } from "node:fs"
import { readFile } from "node:fs/promises"
import sharp from "sharp"
import { join } from "node:path"

export class Image extends SiteNode {
  static modules = [
    node=> {
      node.setFilename(node.thName("full"), "")
      if (node.root.imageCache) {
        node.cacheRoot = join(node.root.imageCache, node.space)
        mkdirSync(node.cacheRoot, {recursive: true})
      }
      node.hook("compile", n => {
        mkdirSync(n.outPath, { recursive: true })
        // create thumbs
        n.mksize(2048, true)
        n.mksize(450)
        n.mksize(280)
        n.mksize(128)
        n.mksize(64)
      })
      node.hook("clobber", n => {
        rmSync(n.outPath, {recursive: true})
      })
    }
  ]
  mksize(size, full=false) {
    const name = full ? "full" : size
    const out = this.thOut(name)
    if (this.root.imageCache) {
      const cache = this.thCache(name)
      if (!existsSync(cache)) {
        sharp(this.path)
          .resize(size, size, { fit: "inside", withoutEnlargement: true })
          .toFile(cache, (err, info) => {
            if (!err) {
              cpSync(cache, out)
            }
          })
      } else {
        cpSync(cache, out)
      }
    } else {
      sharp(this.path)
        .resize(size, size, {fit: "inside", withoutEnlargement: true})
        .toFile(out, (err, info) => {})
    }
  }
  thName(size) {
    if (!size) size = "full"
    return `${this.core}-${size}.webp`
  }
  thCache(size) {
    return join(this.root.imageCache, this.space, this.thName(size))
  }
  thOut(size) {
    return join(this.outPath, this.thName(size))
  }
  href(size) {
    return mkhref(this.root.outPath, this.thOut(size), true)
  }
}

export class ImageSet extends SiteNode {
  static modules = [
    async n => {
      n.setFilename("")
      n.images = []
      n.imgmap = {}
    },
    scanMod(async (n, fn, abs) => {
      if (fn.match(/\.(?:jpe?g|gif|png|webp)$/) && statSync(abs).isFile()) {
        const img = await n.add(Image, { name: fn, outName: n => n.core })
        n.images.push(img)
        n.imgmap[img.core] = img
      }
    }),
  ]
  get(name) {
    return this.imgmap[name]
  }
}

export default ImageSet
