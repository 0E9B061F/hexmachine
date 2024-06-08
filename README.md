# :game_die: **hexmachine** v4.5.2
[![Version][icon-ver]][repo]
[![License][icon-lic]][license]
[![Maintenance][icon-mnt]][commits]<br/>
[![npm][icon-npm]][npm]

**hexmachine** is a flexible static site generator.

# Site Structure

A typical **hexmachine** site might look like this:

```
blog/                # A blog with multiple (hex)markdown posts.
  conf.json          # The blog's configuration file
  post-number-one.md 
  post-number-two.md
styles/              # Stylesheets (Sass or CSS)
  entry.scss         # Main style. May be CSS or Sass. Import other styles here
  other.scss         # This would have to be imported via `entry.scss`
images/              # Any images to be used on the site, other than favicons
favicons/            # Favicons to be linked with `<link rel="icon" ...>`
favicon.ico          # Basic `.ico` favicon
conf.json            # The main site configuration file
tags.json            # Configure your tags here
index.json           # Configure the site-wide index here
build.mjs            # JS entry point. Will be bundled and included in the site
```

# License

Copyright 2022-2024 **[0E9B061F][gh]**<br/>
Available under the terms of the [MIT License][license].


[gh]:https://github.com/0E9B061F
[repo]:https://github.com/0E9B061F/hexmachine
[npm]:https://www.npmjs.com/package/hexmachine
[commits]:https://github.com/0E9B061F/hexmachine/commits/master
[license]:https://github.com/0E9B061F/hexmachine/blob/master/LICENSE

[icon-ver]:https://img.shields.io/github/package-json/v/0E9B061F/hexmachine.svg?style=flat-square&logo=github&color=%236e7fd2
[icon-npm]:https://img.shields.io/npm/v/hexmachine.svg?style=flat-square&color=%23de2657
[icon-lic]:https://img.shields.io/github/license/0E9B061F/hexmachine.svg?style=flat-square&color=%236e7fd2
[icon-mnt]:https://img.shields.io/maintenance/yes/2024.svg?style=flat-square