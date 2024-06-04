import SiteNode from "./site-node.mjs"
import { scanMod } from "./modules.mjs"
import { mkhref } from "./util.mjs"

import { rmSync, mkdirSync, statSync } from "node:fs"
import sharp from "sharp"
import { join } from "node:path"


export class Image extends SiteNode {
  static modules = [
    node => {
      node.hook("compile", n => {
        mkdirSync(n.outPath, { recursive: true })
        // create thumbs
        sharp(n.path)
          .resize(2048, 2048, { fit: "inside", withoutEnlargement: true })
          .toFile(n.thOut("full"), (err, info) => { })
        sharp(n.path)
          .resize(450, 450, { fit: "inside", withoutEnlargement: true })
          .toFile(n.thOut(450), (err, info) => { })
        sharp(n.path)
          .resize(280, 280, { fit: "inside", withoutEnlargement: true })
          .toFile(n.thOut(280), (err, info) => { })
      })
      node.hook("clobber", n => {
        rmSync(n.outPath, {recursive: true})
      })
    }
  ]
  thName(size) {
    if (!size) size = "full"
    return `${this.core}-${size}.${this.ext}`
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
