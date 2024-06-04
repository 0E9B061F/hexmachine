import { relative } from "node:path"

export const tcase = s => {
  return s.split(" ").map(w => w[0].toUpperCase() + w.slice(1)).join(" ")
}

export const mkhref = (base, abs, file=false) => {
  const p = relative(base, abs)
  if (p) {
    const trail = file ? "" : "/"
    return `/${p}${trail}`
  } else {
    return "/"
  }
}

export const ancestors =obj=> {
  switch (true) {
    case (obj === undefined): return;
    case (obj === null): return [];
    default:
      return [obj, ...(ancestors(Object.getPrototypeOf(obj)))];
  }
}
