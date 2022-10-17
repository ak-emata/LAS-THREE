import * as THREE from "three";

// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { BufferGeometryLoader, PerspectiveCamera, Vector3 } from "three";

import {
  range,
  asapScheduler,
  Observable,
  interval,
  tap,
  share,
  asyncScheduler,
  combineLatest,
  animationFrameScheduler,
  forkJoin,
  zip,
} from "rxjs";

import {
  filter,
  observeOn,
  retry,
  take,
  buffer,
  skipWhile,
  skip,
  takeWhile,
  combineLatestWith,
  bufferTime,
  map,
} from "rxjs/operators";

let scene, camera, renderer, controls;
let objects = [];

const geoLoader = new BufferGeometryLoader();
let filesLoaded = 0;
let maxFiles = 0;
await fetch("http://localhost:3000/puntos")
  .then((response) => response.json())
  .then((data) => {
    maxFiles = data.length;
  });

const element = document.getElementById("canvas");

scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Create a camera
const fov = 45; // AKA Field of View
const aspect = element.clientWidth / element.clientHeight;
const near = 0.01; // the near clipping plane
const far = 1000; // the far clipping plane
camera = new PerspectiveCamera(fov, aspect, near, far);

renderer = new THREE.WebGLRenderer({ canvas: element });
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(element.clientWidth, element.clientHeight);

window.addEventListener("resize", render);

render();

function render() {
  // controls.update();

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

async function getData(fileNumber) {
  await fetch("http://localhost:3000/puntos/" + fileNumber, {
    method: "GET",
    headers: [
      ["Content-Type", "application/json"],
      ["Accept", "application/json"],
      ["Origin", "http://localhost:3000"],
    ],
  })
    .then((response) => response.json())
    .then((response) => {
      let mergedGeometry = geoLoader.parse(response);

      let mat = new THREE.PointsMaterial({
        size: 0.7,
        vertexColors: true,
        transparent: true,
      });

      let chunk = new THREE.Points(mergedGeometry, mat);

      // GeometryCompressionUtils.compressPositions(chunk);
      // GeometryCompressionUtils.compressNormals(chunk, "ANGLES");
      // GeometryCompressionUtils.compressUvs(chunk);
      addToObject(chunk);
    });
}

function addToObject(chunk) {
  let object;

  for (let obj of objects) {
    if (obj.name === "puntos") {
      object = obj;
    }
  }

  if (object === undefined) {
    object = new THREE.Object3D();
    objects.push(object);
    object.name = "puntos";
    scene.add(object);
  }

  object.add(chunk);
  object.updateMatrix();

  let boundingBox = new THREE.Box3().setFromObject(object);
  const vec = new Vector3();
  boundingBox.getCenter(vec);

  camera.position.x = vec.x;
  camera.position.y = vec.y;
  camera.position.z = vec.z + 350;
}
let zipped;
function generateObservables(amountOfObservables) {
  let amountPerObservable = maxFiles / amountOfObservables;

  let rangeObs = (start, end, i) =>
    interval(0).pipe(
      skip(start),
      takeWhile((x) => x <= end && x < maxFiles),
      observeOn(asyncScheduler)
      // tap((x) => console.log(i + " is processing: " + x))
    );

  let subs = {
    next: (v) => v.forEach((chunk) => getData(chunk)),
    error: (e) => console.error(e),
    complete: () => zipped.unsubscribe(),
  };

  let obs = [];

  for (let i = 0; i < amountOfObservables; i++) {
    obs.push(rangeObs(filesLoaded, filesLoaded + amountPerObservable, i));

    filesLoaded += amountPerObservable;
  }

  zipped = zip(obs)
    .pipe(
      // map((observables) => [ob1, ob2, ob3, ob4]),
      observeOn(animationFrameScheduler)
    )
    .subscribe(subs);
}

generateObservables(4);
