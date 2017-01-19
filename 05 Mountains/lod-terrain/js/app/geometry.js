define( ["three"], function ( THREE ) {
  return {
    cube: new THREE.CubeGeometry( 200, 200, 200 ),
    sky: new THREE.PlaneGeometry( 16000, 16000 ),
    sky2: new THREE.SphereGeometry( 3000, 64, 64 ),
    skypano: function() {
    	            var segments = 20;
                	var phiStart = 0;
                	var phiLength = Math.PI;
		            var points = [];
		            var fac = 6;
		            points.push(new THREE.Vector3( 16000*fac, 0, -40000 *fac ));
		            points.push(new THREE.Vector3( 16000 * fac, 0, 0 ));

		            // use the same points to create a convexgeometry
		            return new THREE.LatheGeometry(points, segments, phiStart, phiLength);

    }()
  };
} );
