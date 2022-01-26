import React, { useRef, useEffect } from "react";
import * as Three from "three";
import { MapControls } from "three/examples/jsm/controls/OrbitControls";
import "./app.scss";

const App = () => {
  const mapDom = useRef(null);
  const sceneObj = useRef(null);
  const groupObj = useRef(null);
  const cameraObj = useRef(null);
  const rendererObj = useRef(null);
  const controlsObj = useRef(null);

  /**
   * 调用渲染
   */
  const animate = () => {
    const _animate = () => {
      const renderer = rendererObj.current;
      const scene = sceneObj.current;
      const camera = cameraObj.current;
      renderer.render(scene, camera);
    };
    requestAnimationFrame(_animate);
  };

  /**
   * 初始化场景
   */
  const initRenderer = () => {
    const target = mapDom.current;
    const scene = new Three.Scene();
    const group = new Three.Group();
    scene.add(group);

    // 初始化相机
    const camera = new Three.PerspectiveCamera(
      100,
      target.clientWidth / target.clientHeight,
      1,
      200
    );
    camera.position.set(0, 0, 200);
    camera.lookAt(0, 0, 0);

    // 初始化渲染器
    const renderer = new Three.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(target.clientWidth, target.clientHeight);
    renderer.render(scene, camera);
    target.appendChild(renderer.domElement);

    // 初始化控制器
    const controls = new MapControls(camera, renderer.domElement);
    controls.enableRotate = false;
    controls.minDistance = 10;
    controls.maxDistance = 200;
    controls.screenSpacePanning = true;
    controls.addEventListener("change", animate);

    sceneObj.current = scene;
    groupObj.current = group;
    cameraObj.current = camera;
    rendererObj.current = renderer;
    controlsObj.current = controls;
  };

  useEffect(() => {
    initRenderer();
  }, []);

  return (
    <div
      className="page"
      ref={(item) => {
        mapDom.current = item;
      }}
    ></div>
  );
};

export default App;
