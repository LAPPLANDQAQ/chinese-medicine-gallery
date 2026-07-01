import * as THREE from "three";
import { CSS3DRenderer } from "three/addons/renderers/CSS3DRenderer.js";

export class SceneSetup {
  constructor({ webglContainer, css3dContainer }) {
    if (!webglContainer || !css3dContainer) {
      throw new Error("SceneSetup requires webglContainer and css3dContainer.");
    }

    this.webglContainer = webglContainer;
    this.css3dContainer = css3dContainer;

    this.webglScene = new THREE.Scene();
    this.cssScene = new THREE.Scene();
    this.clock = new THREE.Clock();

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      5000
    );
    this.camera.position.set(0, -690, 1540);
    this.camera.lookAt(0, -690, 0);

    this.webglScene.background = new THREE.Color("#0b0f19");
    this.webglScene.fog = new THREE.FogExp2("#0b0f19", 0.00065);

    // WebGL and CSS3D share one camera so particles and HTML cards stay aligned.
    this.webglRenderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.webglRenderer.setSize(window.innerWidth, window.innerHeight);

    this.cssRenderer = new CSS3DRenderer();
    this.cssRenderer.setSize(window.innerWidth, window.innerHeight);

    this.webglContainer.appendChild(this.webglRenderer.domElement);
    this.css3dContainer.appendChild(this.cssRenderer.domElement);

    this.handleResize = this.handleResize.bind(this);
    window.addEventListener("resize", this.handleResize);
  }

  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.webglRenderer.setSize(width, height);
    this.cssRenderer.setSize(width, height);
  }

  render() {
    this.webglRenderer.render(this.webglScene, this.camera);
    this.cssRenderer.render(this.cssScene, this.camera);
  }

  destroy() {
    window.removeEventListener("resize", this.handleResize);
    this.webglRenderer.dispose();
    this.webglRenderer.domElement.remove();
    this.cssRenderer.domElement.remove();
  }
}
