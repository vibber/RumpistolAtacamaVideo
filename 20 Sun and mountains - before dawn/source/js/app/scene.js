define( ["three"], function ( THREE ) {
 var scene = new THREE.Scene();
 //scene.fog = new THREE.Fog( 0x000000, 200, 1000 );
 scene.fog = new THREE.Fog( 0xff0300, 200, 1000 );
 return scene;
} );
