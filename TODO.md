* figure out templates. figure out inserting links to bundled JS/CSS (this has to be done manually in the site source currently)
* place js and css links into HTML automatically
* place favicon links in HTML automatically
* add image caching to build
* add modes to site `conf.json`, like:
  ```json
  {
    "analytics-key": "jjhfghubghubrtuhijadsck",
    "modes": {
      "mirror-a": {
        "mirror": true,
        "analytics-key": "jknewhbufgvdsfasjfgklkj"
      },
      "mirror-a": {
        "mirror": true,
        "analytics-key": "ikjsdfijuhjoenjeanjhaft"
      }
    }
  }
  ```
  this makes it possible to easily produce multiple builds of a given site with
  different configurations. any config given inside a mode will override the
  main config for the same values when compiling in that mode
