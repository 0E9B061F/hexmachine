import { Space, postMod, DataPost } from "./space.mjs"
import { templateMod } from "./modules.mjs"


export class Gallery extends Space {
  static modules = [
    ...this.modules,
    postMod(DataPost, (n, fn, abs) => {
      return fn.endsWith(".json") && fn != "conf.json"
    }),
    templateMod("gallery", {
      ctxSelf: node => {
        return { list: node.clip() }
      },
    }),
  ]
}


export default Gallery
