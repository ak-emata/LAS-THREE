import * as THREE from "three";
import { LASLoader } from "@loaders.gl/las";
import { load } from "@loaders.gl/core";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { BufferGeometry, PerspectiveCamera, Vector3 } from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";

let scene, camera, renderer, controls;
let objects = [];

const element = document.getElementById("canvas");
init();

function createScene() {
  console.log("start Create Scene");

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  camera = new PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.01,
    1000
  );
  camera.position.z = 100;

  console.log("end Create Scene");
}

function createRenderer() {
  console.log("start Create Renderer");

  renderer = new THREE.WebGLRenderer({ canvas: element });
  renderer.setPixelRatio(devicePixelRatio);
  renderer.setSize(element.clientWidth, element.clientHeight);

  console.log("end Create Renderer");
}

function createControls() {
  console.log("start Create Controls");

  controls = new OrbitControls(camera, renderer.domElement);
  // controls.addEventListener("change", render);
  controls.enableDamping = true;

  console.log("end Create Controls");
}

function loadModel(folderName) {
  console.log("start Load Model");

  load("puntos/" + folderName + "_1.las", LASLoader).then((data) => {
    let object;

    for (const obj of objects) {
      if (obj.name === folderName) {
        object = obj;
      }
    }

    console.log(data);

    if (object === undefined) {
      object = new THREE.Object3D();
      objects.push(object);
      object.name = folderName;
      scene.add(object);
    }
    // object.position.x = data.attributes.POSITION.value[0] * -1;
    // object.position.y = data.attributes.POSITION.value[1] * -1;
    // object.position.z = data.attributes.POSITION.value[2] * -1;

    // const geometry = new THREE.BufferGeometry();

    // geometry.setAttribute(
    //   "position",
    //   new THREE.BufferAttribute(
    //     data.attributes.POSITION.value,
    //     data.attributes.POSITION.size
    //   )
    // );

    // // geometry.setAttribute(
    // //   "color",
    // //   new THREE.BufferAttribute(
    // //     data.attributes.COLOR_0.value,
    // //     data.attributes.COLOR_0.size
    // //   )
    // // );

    // const material = new THREE.MeshBasicMaterial({
    //   transparent: false,
    //   color: 0xffffff,
    // });

    // const mesh = new THREE.Mesh(geometry, material);
    // object.add(mesh);
    let geos = [];

    for (
      let i = 0;
      i < data.attributes.POSITION.value.length;
      i += data.attributes.POSITION.size
    ) {
      const x = data.attributes.POSITION.value[0 + i],
        y = data.attributes.POSITION.value[1 + i],
        z = data.attributes.POSITION.value[2 + i];

      const geometry = new THREE.SphereBufferGeometry(1, 8, 8);
      geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(x, y, z));

      let buffGeo = new THREE.BufferGeometry();
      buffGeo.attributes = geometry.attributes;
      buffGeo.index = geometry.index;

      geos.push(geometry);
    }
    const a = new THREE.BufferGeometry();
    console.log(geos[0], a);

    const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(
      geos,
      true
    );

    // console.log(mergedGeometry);

    const chunk = new THREE.Mesh(
      mergedGeometry,
      new THREE.MeshNormalMaterial()
    );
    chunk.geometry.computeBoundingBox();

    chunk.material = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(
      (value, i) =>
        new THREE.MeshPhongMaterial({
          emissive: new THREE.Color(`hsl(${value * i}, 100%, 50%)`),
          side: THREE.DoubleSide,
          polygonOffset: true,
          polygonOffsetFactor: 1,
          polygonOffsetUnits: 1,
          transparent: false,
          depthWrite: false,
        })
      // new THREE.MeshBasicMaterial({ color: "#FFFFFF" })
    );

    chunk.geometry.groups = chunk.geometry.groups.map((group) => ({
      ...group,
      materialIndex: 0,
    })); // assign the first material to all the groups

    object.add(chunk);
    object.updateMatrix();
    object.position.x = 0;
    object.position.y = 0;
    object.position.z = 0;

    let boundingBox = new THREE.Box3().setFromObject(object);
    const vec = new Vector3();
    boundingBox.getCenter(vec);

    console.log("Bounding Box y Vec de boundingBox", boundingBox, vec);

    camera.position.x = vec.x;
    camera.position.y = vec.y;
    camera.position.z = vec.z + 100;

    console.log("end Load Model");
    // camera.position.x = 0;
    // camera.position.y = 0;
    // camera.position.z = 50;
    requestAnimationFrame(render);
  });
}

function debugObject() {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  console.log(cube.position);
  scene.add(cube);
}

function render() {
  controls.update();

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

function moveCameraToObject() {
  console.log(objects[0].position);
  console.log(camera.position);
}

function onDocumentKeyDown(event) {
  // let keyCode = event.which;

  // if (keyCode == 87) {
  //   camera.translateY(1);
  // } else if (keyCode == 83) {
  //   camera.translateY(-1);
  // } else if (keyCode == 65) {
  //   camera.translateX(-1);
  // } else if (keyCode == 68) {
  //   camera.translateX(1);
  // }

  moveCameraToObject();
  render();
}

function init() {
  document.addEventListener("keydown", onDocumentKeyDown, false);

  createScene();
  createRenderer();
  createControls();
  // debugObject();
  loadModel("puntos");
  window.addEventListener("resize", render);
}
