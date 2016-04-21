(function(global) {
    "use strict";
    var canvas = global.canvas =
        new fabric.Canvas('canvas', {

        });
    var getRandomInt = fabric.util.getRandomInt;

    /* canvas observers */
    canvas.observe('object:selected', onObjectSelected);
    canvas.observe('group:selected', onObjectSelected);
    canvas.observe('selection:cleared', onSelectionCleared);
    canvas.observe('mouse:down', onMousedown);
    canvas.observe('mouse:move', onMousemove);
    canvas.observe('mouse:up', onMouseup);

    // capture right click within canvas, taking Fabric's layer into account
    // https://github.com/kangax/fabric.js/wiki/How-fabric-canvas-layering-works
    document.querySelectorAll('#canvas+.upper-canvas')[0]
        .addEventListener('contextmenu',
            function (e) { // Not compatible with IE < 9
                e.preentDefault();
                var tgt = canvas.findTarget(e);
                if(tgt) console.log(tgt);
            },
            false
        );

    /* drawing mode stuff */
    var drawingModeEl = document.getElementById('drawing-mode');
    var drawingColorEl = document.getElementById('drawing-color');
    var drawingLineWidthEl = document.getElementById('drawing-line-width');
    var removeSelectedEl = document.getElementById('remove-selected');

    /* this where it all happens really ! */
    var creatingShape = false;
    var x = 0;
    var y = 0;
    var shapeToDraw = null;

    var buttons = document.querySelectorAll('#commands>button');
    [].forEach.call(buttons, function(btn) {
        btn.addEventListener('click', function(e) {
            e = e || window.event;
            var element = e.target || e.srcElement;

            if (e.preentDefault) e.preentDefault();
            else if (e.returnValue) e.returnValue = false;

            if (element.nodeName.toLowerCase() !== 'button')
                element = element.parentNode;

            console.log(element.id)
            console.log(element.className)
            if (element.id === 'drawing-mode') {
              onDrawingModeChange(!canvas.isDrawingMode);
            }
            else if (canvas.isDrawingMode) {
              console.log('force exit drawing')
              onDrawingModeChange(false);
            }

            shapeToDraw = element.className;
            if (shapeToDraw == 'clear') canvas.clear();

            DisplayMode();
        });
    });

    function onDrawingModeChange(newMode) {
      canvas.isDrawingMode = newMode;
      if (canvas.isDrawingMode) {
          drawingModeEl.innerHTML = 'Cancel drawing mode';
          drawingModeEl.className = 'is-drawing';
      }
      else {
          drawingModeEl.innerHTML = 'Enter drawing mode';
          drawingModeEl.className = '';
      }
    }

    drawingColorEl.onchange = function() {
        canvas.freeDrawingColor = drawingColorEl.value;
    };

    drawingLineWidthEl.onchange = function() {
        canvas.freeDrawingLineWidth = parseInt(drawingLineWidthEl.value, 10) || 1; // disallow 0, NaN, etc.
    };

    removeSelectedEl.onclick = function() {
        var activeObject = canvas.getActiveObject();
        var activeGroup = canvas.getActiveGroup();
        if (activeObject) {
            canvas.remove(activeObject);
        }
        else if (activeGroup) {
            var objectsInGroup = activeGroup.getObjects();
            canvas.discardActiveGroup();
            objectsInGroup.forEach(function(object) {
                canvas.remove(object);
            });
        }
    };

    /* mouse canvas interaction */

    function onMousedown(e) {
        // determine if there is an object under this point (if there is then assume we are editing it)
        // so dont allow us to add a new object at this point (click elsewhere and move if you must)
        if (e.target) return; // dont do anything as we are supposed to be creating a new shape and there is already a shape under the cursor
        // clicking in the canvas is supposed to put us in object creation mode (creatingShape=true)
        var mouse = canvas.getPointer(e.e);
        x = mouse.x;
        y = mouse.y;

        var new_shape = null;
        switch (shapeToDraw) {
        case 'rect':
            new_shape = new fabric.Rect({
                left: x,
                top: y,
                fill: drawingColorEl.value,
                width: 5,
                height: 5,
                opacity: 0.8,
                centeredScaling: true
            });
            creatingShape = true;
            break;
        case 'circle':
            new_shape = new fabric.Circle({
                left: x,
                top: y,
                fill: drawingColorEl.value,
                radius: 5,
                opacity: 0.8,
                centeredScaling: true
            });
            creatingShape = true;
            break;
        case 'text':
            new_shape = new fabric.Text('SAMPLE\nTEXT', {
                left: x,
                top: y,
                fontFamily: 'sans serif',
                fill: drawingColorEl.value,
                centeredScaling: true
            });
            creatingShape = true;
            break;
        case 'select':
            // do nothing we are not creating a new shape!
            break;
        }

        if (new_shape) {
            // new shape created so add it and set it to active to allow us to resize it during the mouse move
            canvas.add(new_shape);
            canvas.renderAll();
            canvas.setActiveObject(new_shape);
        }
    }

    function onMousemove(e) {
        // if we have not just created && added a new shape to the canvas then ignore this mouse move
        if (!creatingShape) return false;

        // the mouse always seems to be *not* where it should be (top/left is centre of obj and this throws me out)
        var mouse = canvas.getPointer(e.e);

        var w = Math.abs(mouse.x - x); // the distance we have moved
        var h = Math.abs(mouse.y - y); // the distance we have moved
        // we should have an active object it was set during the mouse down when we created this shape
        var shape = canvas.getActiveObject();
        if (shape) {
            switch (shape.type) {
            case 'circle':
                var d = Math.min(w,h);
                if (d) {
                    shape.set('radius', d/2);
                    //setting radius alone is not enough.. we need to set shape width as this is what the handles need
                    var radiusBy2ByScale = shape.get('radius') * 2 * shape.get('scaleX');
                    shape.set('width', radiusBy2ByScale).set('height', radiusBy2ByScale);
                }
                break;
            case 'rect':
                if (w || h) {
                    shape.set('width', w);
                    shape.set('height', h);
                }
                break;
            }
        }
        canvas.renderAll();
    }

    function onMouseup(e) {
        if (creatingShape) {
            // we have been creating a shape and now the mouse is released
            creatingShape = false; // stop the editing of the shape in mouseMove
            var shape = canvas.getActiveObject(); // temporarily store the object we have just been editing
            shape.setCoords();
            canvas.deactivateAllWithDispatch(); // flush the eents and stop editing this object
            canvas.setActiveObject(shape); // set this shape to editing
            shapeToDraw = 'select';
            DisplayMode();
        }
        canvas.renderAll();
    }

    /** other observers I am playing with */

    function onObjectSelected(e) {
        var test = e.target;
    }

    function onSelectionCleared(e) { /* todo */
    }

    /** utility and helpers below here */

    function pad(str, length) {
        while (str.length < length)
        str = '0' + str;
        return str;
    };

    function getRandomColor() {
        return (pad(getRandomInt(0, 255).toString(16), 2) + pad(getRandomInt(0, 255).toString(16), 2) + pad(getRandomInt(0, 255).toString(16), 2));
    }

    function getRandomNum(min, max) {
        return Math.random() * (max - min) + min;
    }

    function DisplayMode() {
        var s = document.getElementById('status');
        s.innerHTML = 'MODE ' + shapeToDraw;
    }

})(this);
