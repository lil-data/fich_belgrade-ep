var audio = new Audio();
audio.src = 'snd/mix.mp3';
audio.autoplay = true;
audio.loop = true;
document.body.appendChild(audio);

var mixLength = 1003.0;

var audioCtx = new(window.AudioContext || window.webkitAudioContext)();
var analyser = audioCtx.createAnalyser();
var source = audioCtx.createMediaElementSource(audio);
source.connect(analyser);
analyser.connect(audioCtx.destination);

analyser.fftSize = 2048;
var bufferLength = analyser.frequencyBinCount;
var timeDataArray = new Uint8Array(bufferLength);
var freqDataArray = new Uint8Array(bufferLength);
analyser.getByteTimeDomainData(timeDataArray);
analyser.getByteFrequencyData(freqDataArray);

var scene, camera, controls, renderer, container;
var light, light1, light2;
var colors = [0x8BE2DC, 0xECA615, 0xEC5386, 0x3AE2BB, 0xAC2BFF, 0x3F394A, 0xA03577, 0x2565AE];
var plane, geometry, material, size = 500, segments = 128;
var clock = new THREE.Clock();

var sX = 200, sY = 100, tY = 250, sZ = 200;
var b1,b2;
var sphereSize = 40;
var sphereIntensity = 15;
var vertices, current = 0, prev = 0;

init();
animate();

function init() {
	camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
	camera.position.set(20, 120, 150);
	
	controls = new THREE.FirstPersonControls(camera);
	controls.movementSpeed = 150;
	controls.lookSpeed = 0.1;
	controls.lon = 270; // http://stackoverflow.com/questions/20905101/three-js-firstperson-control-start-orientation
	
	scene = new THREE.Scene();

	var d = 50;
	var sphere = new THREE.SphereGeometry( 0.25, 32, 32 );
	var intensity = 25, distance = 150, decay = 5;

	scene.fog = new THREE.FogExp2(colors[5], 0.003);
	
	light = new THREE.PointLight( colors[6], 2 );
	var sphereMesh = new THREE.Mesh( sphere, new THREE.MeshLambertMaterial( { color: colors[6] }));
	sphereMesh.castShadow = true;
	sphereMesh.receiveShadow = true;
	light.add(sphereMesh);
	light.position.set( 0, 300, -200 );
	scene.add( light );

	light1 = new THREE.PointLight( colors[0], intensity, distance, decay );
	light1.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: colors[0] } ) ) );
	scene.add( light1 );
	light1.castShadow = true;
	light1.shadowMapWidth = 2048;
	light1.shadowMapHeight = 2048;
	light1.shadowCameraLeft = -d;
	light1.shadowCameraRight = d;
	light1.shadowCameraTop = d;
	light1.shadowCameraBottom = -d;
	light1.shadowCameraFar = 3500;
	light1.shadowBias = -0.0001;

	light2 = new THREE.PointLight( colors[1], intensity, distance, decay );
	light2.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: colors[1] } ) ) );
	scene.add( light2 );
	light2.castShadow = true;
	light2.shadowMapWidth = 2048;
	light2.shadowMapHeight = 2048;
	light2.shadowCameraLeft = -d;
	light2.shadowCameraRight = d;
	light2.shadowCameraTop = d;
	light2.shadowCameraBottom = -d;
	light2.shadowCameraFar = 3500;
	light2.shadowBias = -0.0001;

	geometry = new THREE.PlaneGeometry(size, size, segments, segments);
	geometry.rotateX(-Math.PI / 2);
	var material = new THREE.MeshLambertMaterial({
		vertexColors: THREE.VertexColors
	});
	var plane = new THREE.Mesh(geometry, material);
	plane.castShadow = true;
	plane.receiveShadow = true;
	var wmaterial = new THREE.MeshBasicMaterial({
		color: 0xCCCCCC,
		wireframe: true,
		wireframeLinewidth: 0.1
	});
	var plane2 = new THREE.Mesh(geometry, wmaterial);
	scene.add(plane);
	scene.add(plane2);


	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setClearColor( colors[5] );
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMap.enabled = true;
	container = document.getElementById('container');
	container.appendChild(renderer.domElement);
	window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
	requestAnimationFrame(animate);
	analyser.getByteFrequencyData(freqDataArray);
	vertices = geometry.vertices;
	for (var r = segments; r >= 0; r--) {
		var segpos = r * segments;
		for (var c = 0; c < segments; c++) {
			prev = (segpos - segments) + c;
			current = segpos + c;
			if (r === 0){
				var bIndex = bufferLength * (c / segments);
				vertices[c].y = freqDataArray[Math.min(bufferLength, bIndex + 12)];
			} else if (r < segments - 1) {
				vertices[current + 1].y = vertices[prev].y;
			}
		}
	}
	geometry.verticesNeedUpdate = true;
	controls.update(clock.getDelta());

	var time = Date.now() * 0.0005;

	b1 = 0.01 + freqDataArray[Math.min(bufferLength, 300)];
	light1.children[0].scale.x = b1 / sphereSize;
	light1.children[0].scale.y = b1 / sphereSize;
	light1.children[0].scale.z = b1 / sphereSize;
	light1.intensity = sphereIntensity * b1;
	light1.position.x = Math.sin( time * 0.7 ) * sX;
	light1.position.y = Math.cos( time * 0.5 ) * sY + tY;
	light1.position.z = Math.cos( time * 0.3 ) * sZ;

	b2 = 0.01 + freqDataArray[Math.min(bufferLength, 600)];
	light2.children[0].scale.x = b2 / sphereSize;
	light2.children[0].scale.y = b2 / sphereSize;
	light2.children[0].scale.z = b2 / sphereSize;
	light2.intensity = sphereIntensity * b2;
	light2.position.x = Math.cos( time * 0.3 ) * sX;
	light2.position.y = Math.sin( time * 0.5 ) * sY + tY;
	light2.position.z = Math.sin( time * 0.7 ) * sZ;

	var lerpAmount = audio.currentTime / mixLength / 1000.0 / 2.0;
	light.color.lerp(new THREE.Color(colors[7]), lerpAmount);
	light1.color.lerp(new THREE.Color(colors[2]), lerpAmount);
	light1.children[0].material.color.lerp(new THREE.Color(colors[2]), lerpAmount);
	light2.color.lerp(new THREE.Color(colors[4]), lerpAmount);
	light2.children[0].material.color.lerp(new THREE.Color(colors[4]), lerpAmount);
	renderer.render(scene, camera);
}