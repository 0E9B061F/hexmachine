import { SiteNode } from "../lib/site-node.mjs"

describe("SiteNode", ()=> {
  it("can be constructed", async ()=> {
    const node = await SiteNode.make({path: "./spec/test", outPath: "./spec/bar"})
    expect(node.path).toBe("./spec/test")
  })
})