# v4.2.0
* [master 5dccd67] improve modification time handling for better sitemaps. nodes
  with the rebirth module will now look for `node.conf.edited` for their
  modification time. if not set, their modification time will match their birth
  time, which may be given as `node.conf.date`
* [master c3e92eb] replace spaces in tag URLs with underscores
* [master b1fe13c] add `timebubbleMod` to set birth and modification times of
  indices from child posts. fixed birth and modification times for DataPost
  nodes. these changes directly improve the sitemap