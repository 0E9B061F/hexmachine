# v4.5.4
* Fix spec dir

# v4.5.4
* Improved tests

# v4.5.3
* Change publishing workflow to use npm

# v4.5.2
* Fixes for GitHub publishing workflow

# v4.5.1
* Minor fixes
* Add GitHub workflow to publish package

# v4.5.0
* Added `Document`s node. This is very similar to the `Blog`
  node but non-chronological, so `Post`s under a `Document` node will no have
  "previous" or "next" posts, and will not be displayed with those links
* Add REPL script for easier debugging. Call it with a site
  source directory (`bin/repl.mjs ~/site-source`) and it will create a new
  `Site` instance from that source without compiling it, available in the global
  context as `site`

# v4.4.0
* Made content node configurable in the main `conf.json`. These
  are `Blog` and `Gallery` nodes. Added internal node addressing system to
  facilitate this, under `site.go`
* Sort posts under tag indices by date, like other indices

# v4.3.0
* Add mirror mode, which adds a `noindex` link to all built
  pages.

# v4.2.0
* Improve modification time handling for better sitemaps. Nodes
  with the rebirth module will now look for `node.conf.edited` for their
  modification time. If not set, their modification time will match their birth
  time, which may be given as `node.conf.date`
* Replace spaces in tag URLs with underscores
* Add `timebubbleMod` to set birth and modification times of
  indices from child posts. Fixed birth and modification times for DataPost
  nodes. These changes directly improve the sitemap