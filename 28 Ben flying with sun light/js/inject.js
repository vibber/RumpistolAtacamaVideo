//To-do: Make it work even when no arguments are passed by doing: if (!arguments[1]) arguments[1] = {};
//How to make it work on animations that don't use requestANIMATIONFRAME    

var countPngs = 0;

overrideGetContext = function(win) {
    var base = win.HTMLCanvasElement.prototype.getContext;
    win.HTMLCanvasElement.prototype.getContext = function() {
        if (arguments[1]) {
            arguments[1]["preserveDrawingBuffer"] = true;
        }
        console.log("overriding getContext");
        return base.apply(this, arguments);
    };
}

overrideRequestAnimationFrame = function(win) {
    console.log("in override requestAnimationFrame", win);
    var winDom = win.document;    
    console.log("overriding requestAnimationFrame");
    win.requestAnimationFrame = (function() {
        var sys_requestAnimationFrame = win.requestAnimationFrame;

        return function(reqAnimCallback) {
            takeSnapshotNew(nwWindow, reqAnimCallback, sys_requestAnimationFrame);
            console.log("countPngs", countPngs);
            //sys_requestAnimationFrame(callback);
        }

    })();
}

// //save canvas contents as a png
// saveCanvas = function(dom) {
//     var canvas = dom.getElementsByTagName("canvas")[0];
//     console.log("in saveCanvas", canvas);
//     var src = canvas.toDataURL();
//     var path = "frames/out" + countPngs + ".png";
//     var data = src.replace(/^data:image\/\w+;base64,/, "");
//     var buf = new Buffer(data, 'base64');
//     fs.writeFileSync(path, buf);
//     countPngs++;
// };



// function takeSnapshot(nwWindow, reqAnimCallback, sys_requestAnimationFrame) {
//     console.log("take snapshot");
//     nwWindow.capturePage(function(img) {
//       console.log("capturePage");
//       var base64Data = img.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
//       fs.writeFileSync("frames/out" + countPngs + ".png", base64Data, 'base64', function(err) {
//         console.log(err);
//       });
//       countPngs++;
//       sys_requestAnimationFrame(reqAnimCallback);
//     }, 'png');
// }

function takeSnapshotNew(nwWindow, reqAnimCallback, sys_requestAnimationFrame) {
    nwWindow.capturePage(function(buffer){
      //console.log("buffer", buffer);
      var path = "frames/out" + countPngs + ".jpg";
      fs.writeFileSync(path, buffer);
      countPngs++;
      sys_requestAnimationFrame(reqAnimCallback);
    }, { format : 'jpeg', datatype : 'buffer'} );
}

document.addEventListener( "DOMContentLoaded", function() {
    console.log("DOMContentLoaded");
    overrideRequestAnimationFrame(window);
}, false );

overrideGetContext(window);