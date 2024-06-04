import SiteNode from "./site-node.mjs"
import { templateMod } from "./modules.mjs"


export class Robots extends SiteNode {
  static modules = [
    templateMod("robots", { filename: "robots.txt", silent: true, solo: true }),
  ]
}


export default Robots
