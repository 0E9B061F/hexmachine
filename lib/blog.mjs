import { Space, postMod, sortPosts, processPosts, HMDPost, HMDArticle, HMDPage } from "./space.mjs"
import { templateMod, scanMod, timebubbleMod } from "./modules.mjs"
import { stat } from "node:fs/promises"


export class Blog extends Space {
  static modules = [
    ...this.modules,
    postMod(HMDPost, (n, fn, abs) => fn.endsWith(".md")),
    timebubbleMod({prop: "posts"}),
    templateMod("blog", {
      ctxSelf: node => {
        return { list: node.clip() }
      },
    }),
  ]
}

export class Documents extends Space {
  static modules = [
    ...this.modules,
    postMod(HMDArticle, (n, fn, abs) => fn.endsWith(".md")),
    timebubbleMod({prop: "posts"}),
    templateMod("blog", {
      ctxSelf: node => {
        return { list: node.clip() }
      },
    }),
  ]
}

export class Book extends Space {
  static modules = [
    ...this.modules,
    scanMod(async (n, fn, abs) => {
      if ((await stat(abs)).isFile() && fn.endsWith(".md")) {
        const p = await n.add(HMDPage, { name: fn, outName: n => n.core })
        n.posts.push(p)
      }
    }),
    sortPosts({by: "page"}),
    processPosts,
    timebubbleMod({ prop: "posts" }),
    templateMod("blog", {
      ctxSelf: node => {
        return { list: node.clip() }
      },
    }),
  ]
}

export default Blog
