import { historyTimelineData } from "./data/historyData.js";
import { imageItems, IMAGE_COUNT } from "./data/imageItems.js";
import { SceneSetup } from "./webgl/SceneSetup.js";
import { CylinderSpiral } from "./webgl/CylinderSpiral.js";
import { ScrollEngine } from "./webgl/ScrollEngine.js";
import { ImageFilter } from "./ui/ImageFilter.js";
import { DetailView } from "./ui/DetailView.js";

const CYLINDER_RADIUS = 680;
const CYLINDER_HEIGHT_STEP = 145;
const CYLINDER_ANGLE_STEP = Math.PI * 0.28;

const webglContainer = document.querySelector("#webgl-container");
const css3dContainer = document.querySelector("#css3d-container");

const sceneSetup = new SceneSetup({
  webglContainer,
  css3dContainer
});

// Adjust camera to center on the 20-item spiral
const imageCenterOffset = ((IMAGE_COUNT - 1) * CYLINDER_HEIGHT_STEP) / 2;
sceneSetup.camera.position.set(0, -imageCenterOffset, 1540);
sceneSetup.camera.lookAt(0, -imageCenterOffset, 0);

// CylinderSpiral with 20 individual image items
const cylinderSpiral = new CylinderSpiral({
  data: historyTimelineData,
  imageItems,
  cssScene: sceneSetup.cssScene,
  webglScene: sceneSetup.webglScene,
  spiralRadius: CYLINDER_RADIUS,
  spiralHeightStep: CYLINDER_HEIGHT_STEP,
  spiralAngleStep: CYLINDER_ANGLE_STEP
});

cylinderSpiral.updateActiveState(0);

const { cssGroup, webglGroup } = cylinderSpiral.getGroups();
const scrollEngine = new ScrollEngine({
  cssGroup,
  webglGroup,
  totalItems: IMAGE_COUNT,
  heightStep: CYLINDER_HEIGHT_STEP,
  angleStep: CYLINDER_ANGLE_STEP,
  onActiveChange: cylinderSpiral.updateActiveState.bind(cylinderSpiral)
});

// Detail overlay
const detailView = new DetailView();
cylinderSpiral.setOnImageClick((itemData, sourceImg) => {
  detailView.open(itemData, sourceImg);
});

// Era filter tags with auto-center scroll
const gsapLib = window.gsap;
const imageFilter = new ImageFilter({
  onFilterChange: (eraId) => {
    cylinderSpiral.setFilter(eraId);

    // Auto-scroll to center on filtered images
    const centerProgress = cylinderSpiral.getFilterCenterProgress(eraId);
    if (centerProgress !== null && gsapLib) {
      const proxy = { progress: scrollEngine.targetProgress };
      gsapLib.to(proxy, {
        progress: centerProgress,
        duration: 0.9,
        ease: "power2.inOut",
        overwrite: true,
        onUpdate: () => {
          scrollEngine.setTarget(proxy.progress);
        }
      });
    }
  }
});

function animate() {
  requestAnimationFrame(animate);
  const elapsedTime = sceneSetup.clock.getElapsedTime();
  scrollEngine.update();
  cylinderSpiral.update(elapsedTime);
  // Make every image face the camera each frame
  cylinderSpiral.updateImageFacing(sceneSetup.camera);
  sceneSetup.render();
}

animate();
