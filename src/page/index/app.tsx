import React, { useRef, useEffect } from "react";
import * as Three from "three";
import { MapControls } from "three/examples/jsm/controls/OrbitControls";
import woodPng from "./imgs/wood.jpg";
import bookPng from "./imgs/book.jpg";
import bookSidePng from "./imgs/book-side.jpg";
import bookList from "./data.json";
import "./app.scss";

interface BookItemType {
  title: string;
  url: string;
}

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
      1000
    );
    camera.position.set(0, 0, 60);
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
    controls.minDistance = 10;
    controls.maxDistance = 200;
    controls.addEventListener("change", animate);

    sceneObj.current = scene;
    groupObj.current = group;
    cameraObj.current = camera;
    rendererObj.current = renderer;
    controlsObj.current = controls;
  };

  /**
   * 加载纹理
   */
  const loadTexture = (img: string) => {
    return new Promise((resolve) => {
      new Three.TextureLoader().load(img, (texture) => {
        resolve(texture);
      });
    });
  };

  /**
   * 渲染书架
   */
  const renderBookCase = () => {
    const width = 40;
    const height = 60;
    const thickness = 2;
    const depth = 10;

    new Three.TextureLoader().load(woodPng, (texture) => {
      const material = new Three.MeshBasicMaterial({ map: texture });

      // 书架背面
      const backGeo = new Three.BoxGeometry(width, height, thickness);
      const back = new Three.Mesh(backGeo, material);

      // 书架左侧
      const leftGeo = new Three.BoxGeometry(thickness, height, depth);
      const left = new Three.Mesh(leftGeo, material);
      left.position.x = -(width + thickness) / 2;
      left.position.z = (depth - thickness) / 2;

      // 书架右侧
      const rightGeo = new Three.BoxGeometry(thickness, height, depth);
      const right = new Three.Mesh(rightGeo, material);
      right.position.x = (width + thickness) / 2;
      right.position.z = (depth - thickness) / 2;

      // 书架层板
      const bookCase = new Three.Object3D();
      const num = 4;
      const distance = (height - thickness * num) / (num - 1);
      for (let i = 0; i < num; i++) {
        const itemGeo = new Three.BoxGeometry(
          width,
          thickness,
          depth - thickness
        );
        const item = new Three.Mesh(itemGeo, material);
        item.position.y = (height - thickness) / 2 - (distance + thickness) * i;
        item.position.z = depth / 2;
        bookCase.add(item);

        // 渲染书本
        if (i > 0) {
          const bookHeight = distance - 4;
          const bookDepth = depth - thickness;
          bookList[i - 1].forEach((bookItem: BookItemType, index: number) => {
            renderBook(
              width / 2,
              item.position.y + thickness / 2,
              item.position.z,
              bookHeight,
              bookDepth,
              index,
              bookItem
            );
          });
        }
      }

      bookCase.add(back);
      bookCase.add(left);
      bookCase.add(right);
      sceneObj.current.add(bookCase);
      animate();
    });
  };

  /**
   * 渲染书本
   */
  const renderBook = async (
    x: number,
    y: number,
    z: number,
    height: number,
    depth: number,
    index: number,
    item: BookItemType
  ) => {
    const [book, bookSide] = await Promise.all([
      loadTexture(bookPng),
      loadTexture(bookSidePng),
    ]);

    // 书本材质
    const width = 3;
    const bookMate = new Three.MeshBasicMaterial({ map: book });
    const bookSideMate = new Three.MeshBasicMaterial({ map: bookSide });

    const backGeo = new Three.BoxGeometry(width, height, depth);
    const bookMesh = new Three.Mesh(backGeo, [
      bookSideMate,
      bookSideMate,
      bookSideMate,
      bookSideMate,
      bookMate,
      bookSideMate,
    ]);
    bookMesh.translateX(-x + 2 + index * (width + 0.5));
    bookMesh.translateZ(z);
    bookMesh.translateY(y + height / 2);
    sceneObj.current.add(bookMesh);
    animate();
  };

  useEffect(() => {
    initRenderer();
    renderBookCase();
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
