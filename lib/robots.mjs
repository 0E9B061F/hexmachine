import SiteNode from "./site-node.mjs"
import { templateMod } from "./modules.mjs"


export class Robots extends SiteNode {
  static defaults = {
    filename: "robots.txt",
  }
  static modules = [
    templateMod("robots", { silent: true, solo: true }),
  ]
}


export default Robots
