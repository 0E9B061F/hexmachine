# v4.5.0
* added `Document`s node. this is very similar to the `Blog`
  node but non-chronological, so `Post`s under a `Document` node will no have
  "previous" or "next" posts, and will not be displayed with those links
* add REPL script for easier debugging. call it with a site
  source directory (`bin/repl.mjs ~/site-source`) and it will create a new
  `Site` instance from that source without compiling it, available in the global
  context as `site`

# v4.4.0
* made content node configurable in the main `conf.json`. these
  are `Blog` and `Gallery` nodes. added internal node addressing system to
  facilitate this, under `site.go`
* sort posts under tag indices by date, like other indices

# v4.3.0
* add mirror mode, which adds a `noindex` link to all built
  pages.

# v4.2.0
* improve modification time handling for better sitemaps. nodes
  with the rebirth module will now look for `node.conf.edited` for their
  modification time. if not set, their modification time will match their birth
  time, which may be given as `node.conf.date`
* replace spaces in tag URLs with underscores
* add `timebubbleMod` to set birth and modification times of
  indices from child posts. fixed birth and modification times for DataPost
  nodes. these changes directly improve the sitemap