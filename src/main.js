import { historyTimelineData } from "./data/historyData.js";
import { SceneSetup } from "./webgl/SceneSetup.js";
import { CylinderSpiral } from "./webgl/CylinderSpiral.js";
import { ScrollEngine } from "./webgl/ScrollEngine.js";

const CYLINDER_HEIGHT_STEP = 460;
const CYLINDER_ANGLE_STEP = Math.PI * 0.62;

const webglContainer = document.querySelector("#webgl-container");
const css3dContainer = document.querySelector("#css3d-container");

const sceneSetup = new SceneSetup({
  webglContainer,
  css3dContainer
});

const cylinderSpiral = new CylinderSpiral({
  data: historyTimelineData,
  cssScene: sceneSetup.cssScene,
  webglScene: sceneSetup.webglScene
});

cylinderSpiral.updateActiveState(0);

const { cssGroup, webglGroup } = cylinderSpiral.getGroups();
const scrollEngine = new ScrollEngine({
  cssGroup,
  webglGroup,
  totalItems: historyTimelineData.length,
  heightStep: CYLINDER_HEIGHT_STEP,
  angleStep: CYLINDER_ANGLE_STEP,
  onActiveChange: cylinderSpiral.updateActiveState.bind(cylinderSpiral)
});

function animate() {
  requestAnimationFrame(animate);
  const elapsedTime = sceneSetup.clock.getElapsedTime();
  scrollEngine.update();
  cylinderSpiral.update(elapsedTime);
  sceneSetup.render();
}

animate();
