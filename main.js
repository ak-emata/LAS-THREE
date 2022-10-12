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

// let observer = new Observable(function subscribe(subscriber) {
//   while (filesLoaded < maxFiles) {
//     subscriber.next(filesLoaded++);
//   }
//   subscriber.complete();
// });

async function getData(fileNumber) {
  let headers = new Headers();

  headers.append("Content-Type", "application/json");
  headers.append("Accept", "application/json");
  headers.append("Origin", "http://localhost:3000");

  const response = await fetch("http://localhost:3000/puntos/" + fileNumber, {
    method: "GET",
    headers: headers,
  })
    .then((response) => response.json())
    .then((response) => {
      let object;
      let mergedGeometry = geoLoader.parse(response);

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

      let mat = new THREE.PointsMaterial({
        size: 0.7,
        vertexColors: true,
        transparent: true,
      });

      let chunk = new THREE.Points(mergedGeometry, mat);

      // GeometryCompressionUtils.compressPositions(chunk);
      // GeometryCompressionUtils.compressNormals(chunk, "ANGLES");
      // GeometryCompressionUtils.compressUvs(chunk);

      object.add(chunk);
      object.updateMatrix();

      let boundingBox = new THREE.Box3().setFromObject(object);
      const vec = new Vector3();
      boundingBox.getCenter(vec);

      camera.position.x = vec.x;
      camera.position.y = vec.y;
      camera.position.z = vec.z + 300;
    });
}

function generateObservables(amountOfObservables) {
  let amountPerObservable = maxFiles / amountOfObservables;

  for (let i = 0; i < amountOfObservables; i++) {
    let observer = interval(0.01).pipe(
      tap((x) => console.log(i + " is processing: " + x)),

      skip(filesLoaded),
      takeWhile(
        (val) => val < filesLoaded + amountPerObservable && val < maxFiles,
        false
      ),
      observeOn(asyncScheduler)
    );

    // let observer = range(filesLoaded, filesLoaded + amountPerObservable).pipe(
    //   observeOn(asyncScheduler)
    // );
    filesLoaded += amountPerObservable;
    observer.subscribe({
      next: (v) => getData(v),
      error: (e) => console.error(e),
      complete: () => console.info(i + " finished"),
    });
  }
}
generateObservables(4);
