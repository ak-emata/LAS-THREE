import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { LASLoader } from "@loaders.gl/las";
import { load } from "@loaders.gl/core";

onmessage = async function (message) {
  // File data
  const data = await load(message.data.name, LASLoader);

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

  const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(geos, false);
  // debugger;

  this.postMessage(mergedGeometry.toJSON());
};
