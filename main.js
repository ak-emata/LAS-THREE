import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";

// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { BufferGeometryLoader, PerspectiveCamera, Vector3 } from "three";

let scene, camera, renderer, controls;
let objects = [];

const geoLoader = new BufferGeometryLoader();
let filesLoaded = 1;
var maxWorkers = navigator.hardwareConcurrency || 4;

// const workers = [
//   new Worker("loadFile.js", { type: "module" }),
//   new Worker("loadFile.js", { type: "module" }),
//   new Worker("loadFile.js", { type: "module" }),
//   new Worker("loadFile.js", { type: "module" }),
//   new Worker("loadFile.js", { type: "module" }),
// ];

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

function loadModel(folderName) {
  if (filesLoaded <= 6) {
    let worker = new Worker("loadFile.js", { type: "module" });
    worker.onmessage = onWorkerDone;
    worker.postMessage({
      name: folderName + "/" + folderName + "_" + filesLoaded++ + ".las",
    });
  }
}

function onWorkerDone(message) {
  let object;

  const mergedGeometry = geoLoader.parse(message.data);

  for (const obj of objects) {
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

  let chunk = new THREE.Mesh(
    mergedGeometry,
    new THREE.MeshBasicMaterial({ color: "#ffffff" })
  );

  object.add(chunk);
  object.updateMatrix();

  let boundingBox = new THREE.Box3().setFromObject(object);
  const vec = new Vector3();
  boundingBox.getCenter(vec);

  camera.position.x = vec.x;
  camera.position.y = vec.y;
  camera.position.z = vec.z + 50;

  this.terminate();
}

loadModel("puntos");
