function triggerStart() {
  app.animate();    
}

var slii = {};
slii.inputs = {
    start: { type: "toggle", label: "0. Start", value: 0, onChange: triggerStart },
    light1: { type: "number", label: "1. Light 1", value: 0.5, maxValue: 2.0, minValue: 0.0 },
    light2: { type: "number", label: "2. Light 2", value: 0.5, maxValue: 2.0, minValue: 0.0 },
    light3: { type: "number", label: "3. Light 3", value: 0.5, maxValue: 2.0, minValue: 0.0 },
    eyes: { type: "number", label: "4. Eyes", value: 0.0, maxValue: 1.0, minValue: 0.0 },
    selectMidi: { type: "dropdown", label: "Select midi input", options: valuesForMidiInput, onChange: changeMidiInput },
};

var midiDisabled = false;

define( ["three", "camera", "container", "controls", "geometry", "material", "noise", "renderer", "scene", "terrain"],
function ( THREE, camera, container, controls, geometry, material, noise, renderer, scene, Terrain ) {
   app = {
    clock: new THREE.Clock(),
    mouse: { x: 0, y: 0 },
    smoothMouse: { x: 0, y: 0 },
    smoothRotation: {x: 0, y: 0, z: 0},
    savedData: {},
    camData: {},
    mask: {},
    head: {},
    outputData: [],
    mode: 'PLAYBACK',
    currentFrame: 0,
    dirLightAbove: {},
    dirLightLeft: {},
    dirLightLeft: {},
    eyeMat: {},
    vezerFPS: 30,
    initFileStream: function (fileName) {
        return fs.createWriteStream(app.getScriptLocationPath() + fileName);
    },
    getScriptLocationPath: function () {
      var mypath = window.location.pathname
        .replace(/%20/g, " ");
      var path = mypath.split("/");
      path.pop();
      return path.join("/") + "/";            
    },
    init: function () {

      /////////
      // TIMELINE 
      // (animation of lights but not of camera or lip sync)
      
      tracks = vezerUtil.parse('js/data/midifromvezer.xml');
      sliiderTimeline.init(tracks);

      sliiderTimeline.autoBind( slii.inputs );

      slii.inputs.selectMidi.value = 1;
      changeMidiInput();

      //SAVE CAM

      var outputFile;
      var nwWindow;
      var recording;
      var mode = 'RECORD'; //RECORD, PLAYBACK

      // Get the current window
      nwWindow = nwgui.Window.get();

      //Close file stream
      nwWindow.on('close', function() {
        this.close(true);
                if (app.mode == 'RECORD') {
                    outputFile = app.initFileStream('myFile' + Math.random() + '.txt' );
                    outputFile.write(JSON.stringify(app.outputData));
          outputFile.end();
        }
      });

      //LOAD CAM DATA

      if (app.mode == 'PLAYBACK') {
          var fileName = "camData.txt";
          var path = app.getScriptLocationPath() + fileName;
          console.log("path", path);
          var fileContents = fs.readFileSync(path,'utf8'); 
          app.camData = JSON.parse(fileContents); 
      }

      //

      //Load saved face tracking data. Note 'data' dir defined in config.js
      require( ["text!data/newCaptureData.txt"], function ( contents ) {
        app.savedData = JSON.parse(contents);
      });

      // Terrain( heightdata, worldWidth, levels of detail, tile resolution )
      app.terrain = new Terrain( noise, 1024, 4, 64 );
      scene.add( app.terrain );

      // Add sky
      app.sky = new THREE.Mesh( geometry.sky2, material.sky );
      app.sky.position.z = -500;
      app.sky.visible = true;
      scene.add( app.sky );
      
      // LIGHTS

      app.dirLightAbove = new THREE.DirectionalLight( 0x1f85ee, slii.inputs.light1.value );
      app.dirLightAbove.position.set(0, -0.3, 1);
      scene.add(app.dirLightAbove);

      dirLightBelow = new THREE.DirectionalLight( 0xa4a6a0, 2);
      dirLightBelow.position.set(0, -0.8, -1);
      scene.add(dirLightBelow);

      app.dirLightLeft = new THREE.DirectionalLight( 0x93c8fe, slii.inputs.light2.value);
      //Red color
      app.dirLightLeft.color.setRGB(0.9,0.2,0);
      app.dirLightLeft.position.set(1, -1.2, 0);
      scene.add(app.dirLightLeft);

      app.dirLightRight = new THREE.DirectionalLight( 0x93c8fe, slii.inputs.light3.value);
      app.dirLightRight.position.set(-1, -1.2, 0);
      scene.add(app.dirLightRight);

      //GROUP (for mask)

      app.head = new THREE.Object3D();
      scene.add(app.head);
      app.head.default = {};
      app.head.default.rotation = new THREE.Vector3( Math.PI / 2, Math.PI, 0 );
      app.head.default.position = new THREE.Vector3(app.center.x, app.center.y, 200);
      
      //MESH

      var loader = new THREE.JSONLoader();
      loader.load("obj/maskmorph.json.js", function( geometry ) {

          var maskMat = new THREE.MeshPhongMaterial( { 
            morphTargets: true, 
            color: 0x445555, 
            ambient: 0x000000, 
            specular: 0xffaa55, 
            shininess: 80, 
            side: THREE.DoubleSide, 
            shading: THREE.SmoothShading });

          app.mask = new THREE.Mesh(geometry, maskMat);
          app.mask.scale.set(800,800,800);
          app.head.add( app.mask );

          var geoBox = new THREE.CubeGeometry( 80, 80, 200, 2, 2, 2 );
          app.box = new THREE.Mesh( geoBox, new THREE.MeshPhongMaterial( { color: 0x222222, specular: 0x009999, shininess: 100, shading: THREE.SmoothShading } ) );
          app.box.position = app.center;
          app.box.position.z = -40;

          scene.add(app.box);
          app.animate();
      },"js");

      // EYES

      var eyeGeo = new THREE.SphereGeometry( 10, 10, 10);
      app.eyeMat = new THREE.MeshBasicMaterial( { color: "white", opacity: 0.0, transparent: true } );
      var leftEye = new THREE.Mesh( eyeGeo, app.eyeMat );
      leftEye.scale.set(1,0.5,0.1);
      leftEye.rotation.set(0,-0.6,-0.7)
      leftEye.position.set(-13,-7, 23);
      var rightEye = new THREE.Mesh( eyeGeo, app.eyeMat );
      rightEye.scale.set(1,0.5,0.1);
      rightEye.rotation.set(0,0.6,0.7)
      rightEye.position.set(13,-7, 23);
      app.head.add(leftEye);
      app.head.add(rightEye);

      /// Add sky2

      app.sky2 = new THREE.Mesh( geometry.sky2, material.sky );
      app.sky2.position.z = -1000;
      scene.add( app.sky2 );


      //Set the dark sky from the start

      app.sky.visible = true;
      app.sky2.visible = false;
      app.terrain.cycleShader();
      app.terrain.cycleShader();

      // Mouse input
      container.addEventListener( 'mousemove', function( e ) {
        app.mouse = {
          x: e.clientX - container.offsetWidth / 2,
          // Square to give more sensitivity at bottom of screen
          y: Math.pow( container.offsetHeight - e.clientY, 2 ) / container.offsetHeight
        };
      } );

      container.addEventListener( 'click', function() {
        // Switch between different frag shaders
        var s = app.terrain.cycleShader();
        if ( s === 0 ) {
          app.sky.visible = true;
          app.sky2.visible = false;
        } else {
          app.sky.visible = false;
          app.sky2.visible = true;
          // if ( s === 1 ) {
          //   material.atmosphere.uniforms.uHorizonColor.value = new THREE.Color( 0xfff1d8 );
          //   material.atmosphere.uniforms.uSkyColor.value = new THREE.Color( 0xf9f9ff );
          // } else {
          //   material.atmosphere.uniforms.uHorizonColor.value = new THREE.Color( 0xffffff );
          //   material.atmosphere.uniforms.uSkyColor.value = new THREE.Color( 0x55b9ff );
          // }
        }
      } );
    },

    center: new THREE.Vector3( 205, 135, 0 ),
    animate: function () {
      window.requestAnimationFrame( app.animate );

      if (app.mode != 'PLAYBACK') {
          // Smooth mouse position
          var smooth = 0.02;
          app.smoothMouse.x += smooth * ( app.mouse.x - app.smoothMouse.x );
          app.smoothMouse.y += smooth * ( app.mouse.y - app.smoothMouse.y );

          var time = 0.5 * app.clock.getElapsedTime();
          //camera.position.x = 450 * Math.cos( time / 3 ) + app.center.x;
          //camera.position.y = 250 * Math.sin( time / 4 ) + app.center.y + 500;

          camera.position.x = 650 * Math.cos( time / 3 ) + app.center.x;
          camera.position.y = 650 * Math.sin( time / 4 ) + app.center.y + 500;

          camera.position.z = Math.min( app.smoothMouse.y / 2 + 5, 500 );
          //camera.position.z = 30 + 260 * Math.pow( Math.sin( time ), 4 );
          camera.up = new THREE.Vector3( 0, 0, 1 );
          //camera.lookAt( app.center );

          //Sun shader
          material.atmosphere.uniforms.iGlobalTime.value = time;

          // Look left right
          var look = app.center.clone();
          look.sub( camera.position );
          look.normalize();
          look.multiplyScalar( 50 );
          var across = new THREE.Vector3().crossVectors( look, camera.up );
          across.multiplyScalar( app.smoothMouse.x / 333 );
          camera.position.add( across );
          //camera.up = new THREE.Vector3( 1, 0, 1 );
          camera.up.add( across.multiplyScalar( -0.005 ) );
      }

      camera.lookAt( new THREE.Vector3( app.center.x, app.center.y, 200 ) );

      //app.terrain.offset.x = camera.position.x;
      //app.terrain.offset.y = camera.position.y;

      app.head.position = app.head.default.position;

      // GET SAVED TRACKER DATA
      
      if (app.savedData.length > 0 && app.savedData[0].time < app.clock.getElapsedTime()) {
        var trackerData = app.savedData[0];
        app.savedData.shift();
      }

      // APPLY DATA TO MASK

      if (trackerData) {
        
        var smoothr = 0.2;
        var savedRotx = app.head.default.rotation.x + trackerData.rotx;
        var savedRoty = app.head.default.rotation.y + trackerData.roty;
        app.smoothRotation.x += smoothr * ( savedRotx - app.smoothRotation.x );
        app.smoothRotation.y += smoothr * ( savedRoty - app.smoothRotation.y );

        app.head.rotation.x = app.smoothRotation.x;
        app.head.rotation.y = app.smoothRotation.y;
        app.mask.morphTargetInfluences[1] = trackerData.morph01;
        app.mask.morphTargetInfluences[2] = trackerData.morph02;
      }

      // SAVE CAM

      if (app.mode == 'RECORD') {
        app.outputData.push(
        {
          cam: {
            pos: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
            rot: { x: camera.rotation.x, y: camera.rotation.y, z: camera.rotation.z }
        } 
        });
      } else if (app.mode == 'PLAYBACK') {
          if (app.camData[app.currentFrame]) {
              camera.position.set(app.camData[app.currentFrame].cam.pos.x, app.camData[app.currentFrame].cam.pos.y, app.camData[app.currentFrame].cam.pos.z);
              camera.rotation.set(app.camData[app.currentFrame].cam.rot.x, app.camData[app.currentFrame].cam.rot.y, app.camData[app.currentFrame].cam.rot.z);
          }
      }

      //////////
      // TIMELINE
      var vezerFrame = Math.floor(app.currentFrame * 1/(60 / app.vezerFPS));
      sliiderTimeline.setValues(vezerFrame);

      // LIGHTS

      app.dirLightAbove.intensity = slii.inputs.light1.value;
      app.dirLightLeft.intensity = slii.inputs.light2.value;
      app.dirLightRight.intensity = slii.inputs.light3.value;

      //EYES

      app.eyeMat.opacity = slii.inputs.eyes.value;

      // UNIFORMS

      var tiles = scene.children[0].children;
      for (var i = 0; i < tiles.length; i++) { 
        tiles[i].material.uniforms.ambientLight.value = slii.inputs.light1.value;
        tiles[i].material.uniforms.lightLeft.value = slii.inputs.light2.value;
        tiles[i].material.uniforms.lightRight.value = slii.inputs.light3.value;
      }

      renderer.render( scene, camera );
      app.currentFrame++;
    }
  };
  return app;
} );
