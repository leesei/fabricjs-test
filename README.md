Origin: http://jsfiddle.net/pingcrosby/brZ2N/  
Demo: https://rawgit.com/leesei/fabricjs-test/master/index.html

I did the following modifications:
- update the dependencies
- install handler to `#commands>button`
- call `shape.setCoords()` when committing the shape on mouse up
  (this probably is the issue pingcrosby faces in http://stackoverflow.com/q/10195562/)
- reset mode after committing the shape

This is now a playground for [FabricJS](http://fabricjs.com/).

---

`canvas.calcOffset()` after canvas position change  
https://github.com/kangax/fabric.js/wiki/How-fabric-canvas-layering-works

custom build: ~200KB less  
http://fabricjs.com/build/files/text,parser,freedrawing,interaction,serialization.js
