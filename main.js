import * as THREE from "three";
import { LASLoader } from "@loaders.gl/las";
import { load } from "@loaders.gl/core";

// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { BufferGeometry, PerspectiveCamera, Vector3 } from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";

let scene, camera, renderer, controls;
let objects = [];

const element = document.getElementById("canvas");

scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Create a camera
const fov = 45; // AKA Field of View
const aspect = element.clientWidth / element.clientHeight;
const near = 0.01; // the near clipping plane
const far = 1000; // the far clipping plane
camera = new PerspectiveCamera(fov, aspect, near, far);
// camera.position.z = 5;

// controls = new OrbitControls(camera, element);
// controls.enableDamping = true;

renderer = new THREE.WebGLRenderer({ canvas: element });
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(element.clientWidth, element.clientHeight);

window.addEventListener("resize", render);

// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

// render();

function render() {
  // controls.update();

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

function loadModel(folderName, i) {
  console.log("start Load Model");
  if (i <= 50) {
    console.log(i);
    load("puntos/" + folderName + "_" + i + ".las", LASLoader).then((data) => {
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
        geometry.translate(x, y, z);
        geos.push(geometry);
      }
      // const a = new THREE.BufferGeometry();
      // console.log(geos[0], a);

      const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(
        geos,
        false
      );

      const chunk = new THREE.Mesh(
        mergedGeometry,
        new THREE.MeshBasicMaterial({ color: "#ffffff" })
      );
      chunk.geometry.computeBoundingBox();

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
      camera.position.z = vec.z + 50;

      console.log("end Load Model");
      // camera.position.x = 0;
      // camera.position.y = 0;
      // camera.position.z = 50;
      requestAnimationFrame(render);
      loadModel(folderName, i + 1);
    });
  }
}

loadModel("puntos", 1);
