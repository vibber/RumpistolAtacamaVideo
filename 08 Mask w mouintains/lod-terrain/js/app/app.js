define( ["three", "camera", "container", "controls", "geometry", "material", "noise", "renderer", "scene", "terrain"],
function ( THREE, camera, container, controls, geometry, material, noise, renderer, scene, Terrain ) {
  var app = {
    clock: new THREE.Clock(),
    mouse: { x: 0, y: 0 },
    smoothMouse: { x: 0, y: 0 },
    init: function () {
      // Terrain( heightdata, worldWidth, levels of detail, tile resolution )
      app.terrain = new Terrain( noise, 1024, 4, 64 );
      scene.add( app.terrain );

      // Add sky
      app.sky = new THREE.Mesh( geometry.sky2, material.sky );
      app.sky.position.z = -500;
      app.sky.visible = true;
      scene.add( app.sky );
      
      // Add mask

        dirLightAbove = new THREE.DirectionalLight( 0x1f85ee, 2 );
        dirLightAbove.position.set(0, -0.3, 1);
        scene.add(dirLightAbove);

        dirLightBelow = new THREE.DirectionalLight( 0xa4a6a0, 2);
        dirLightBelow.position.set(0, -0.8, -1);
        scene.add(dirLightBelow);


        dirLightRight = new THREE.DirectionalLight( 0x93c8fe, 2);
        dirLightRight.position.set(-1, -1.2, 0);
        scene.add(dirLightRight);

        dirLightLeft = new THREE.DirectionalLight( 0x93c8fe, 2);

        //Red color
        dirLightLeft.color.setRGB(0.9,0.2,0);

        dirLightLeft.position.set(1, -1.2, 0);
        scene.add(dirLightLeft);


      var loader = new THREE.JSONLoader();
      loader.load("obj/params_mask.json.js", function( geometry ) {

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
          app.mask.rotation.x = Math.PI / 2;
          app.mask.rotation.y = Math.PI;
          app.mask.position.set(0,500,200);
          scene.add( app.mask );

          var geoBox = new THREE.CubeGeometry( 80, 80, 200, 2, 2, 2 );
          app.box = new THREE.Mesh( geoBox, new THREE.MeshPhongMaterial( { color: 0x222222, specular: 0x009999, shininess: 100, shading: THREE.SmoothShading } ) );
          app.box.position.z = -40;
          app.box.position.y = 500;

          scene.add(app.box);
      },"js");



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
          if ( s === 1 ) {
            material.atmosphere.uniforms.uHorizonColor.value = new THREE.Color( 0xfff1d8 );
            material.atmosphere.uniforms.uSkyColor.value = new THREE.Color( 0xf9f9ff );
          } else {
            material.atmosphere.uniforms.uHorizonColor.value = new THREE.Color( 0xffffff );
            material.atmosphere.uniforms.uSkyColor.value = new THREE.Color( 0x55b9ff );
          }
        }
      } );
    },
 //   height: function() {
 //     var i = Math.floor( camera.position.x % 1024 );
 //     var j = 1023 - Math.floor( camera.position.y % 1024 );
 //     //var h = 1024 * noise.image.data[ 13 ];
 //     var h = 1024 * noise.image.data[i + 1024 * j] / 255;
 //     return h * h / 2000 + 20;
 //   },
    center: new THREE.Vector3( 205, 135, 0 ),
    animate: function () {
      window.requestAnimationFrame( app.animate );

      // Smooth mouse position
      var smooth = 0.02;
      app.smoothMouse.x += smooth * ( app.mouse.x - app.smoothMouse.x );
      app.smoothMouse.y += smooth * ( app.mouse.y - app.smoothMouse.y );

      var time = 0.5 * app.clock.getElapsedTime();
      camera.position.x = 450 * Math.cos( time / 3 ) + app.center.x;
      camera.position.y = 250 * Math.sin( time / 4 ) + app.center.y + 500;

      camera.position.z = Math.min( app.smoothMouse.y / 2 + 5, 500 );
      //camera.position.z = 30 + 260 * Math.pow( Math.sin( time ), 4 );
      camera.up = new THREE.Vector3( 0, 0, 1 );
      camera.lookAt( app.center );

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

      //camera.lookAt( app.center );
      camera.lookAt( new THREE.Vector3( 0, 500, 200 ) );

      app.terrain.offset.x = camera.position.x;
      app.terrain.offset.y = camera.position.y;
      renderer.render( scene, camera );
    }
  };
  return app;
} );
