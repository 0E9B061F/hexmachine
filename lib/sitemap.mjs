import SiteNode from "./site-node.mjs"
import { templateMod } from "./modules.mjs"

export class Sitemap extends SiteNode {
  static defaults = {
    filename: "sitemap.xml"
  }
  static modules = [
    templateMod("sitemap", { silent: true, solo: true }),
  ]
  async finally() {
    this.urls = await this.root.list()
  }
}


export default Sitemap
