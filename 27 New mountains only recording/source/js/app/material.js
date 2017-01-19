define( ["three", "shader!atmosphere.vert", "shader!atmosphere.frag", "texture"],
function ( THREE, atmosphereVert, atmosphereFrag, texture ) {
  return {

    atmosphere: new THREE.ShaderMaterial( {
      uniforms: {
          iGlobalTime: { type: "f",  value: 1.0 },
          iResolution: { type: "v3", value: new THREE.Vector3(1024, 1024, 1024) },
          iChannel0: { type: "t", value: texture.sun },
      },
      vertexShader: atmosphereVert.value,
      fragmentShader: atmosphereFrag.value,
      side: THREE.BackSide
    } ),
    sky: new THREE.MeshBasicMaterial( {
      map: texture.sky,
      side: THREE.BackSide
    } ),
  };
} );
