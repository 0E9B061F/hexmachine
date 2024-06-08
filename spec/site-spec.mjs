import Site from "../lib/site.mjs"

describe("Site", ()=> {
  it("can be constructed", async ()=> {
    const node = await Site.make({path: "./spec/test", outPath: "./spec/bar"})
    expect(node.path).toBe("./spec/test")
    expect(node.title).toBe("test website")
    expect(node.desc).toBe("a website for testing")
    expect(node.host).toBe("https://example.com")
    expect(node.version).toBe("8.9.10")
    expect(node.go("/blog").title).toBe("test blog")
    expect(node.go("/blog").desc).toBe("a blog for testing")
  })
})
