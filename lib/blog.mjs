import { Space, postMod, HMDPost } from "./space.mjs"
import { templateMod } from "./modules.mjs"


export class Blog extends Space {
  static modules = [
    ...this.modules,
    postMod(HMDPost, (n, fn, abs) => fn.endsWith(".md")),
    templateMod("blog", {
      ctxSelf: node => {
        return { list: node.clip() }
      },
    }),
  ]
}


export default Blog
