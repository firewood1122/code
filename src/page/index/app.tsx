import React, { useRef, useEffect } from "react";
import * as Three from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import ThreeMeshUI from "three-mesh-ui";
import FontFamily from "three-mesh-ui/examples/assets/Roboto-msdf.json";
import FontTexture from "three-mesh-ui/examples/assets/Roboto-msdf.png";
import TWEEN, { Tween } from "@tweenjs/tween.js";
import WoodPng from "./imgs/wood.jpg";
import BookPng from "./imgs/book.jpg";
import BookSidePng from "./imgs/book-side.jpg";
import BookList from "./data.json";
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
  const bookListObj = useRef([]);
  const currentBook = useRef(null);
  const tweenAnimate = useRef(false);
  const centerPoint = useRef(null);

  /**
   * 调用渲染
   */
  const animate = () => {
    const _animate = () => {
      ThreeMeshUI.update();
      const renderer = rendererObj.current;
      const scene = sceneObj.current;
      const camera = cameraObj.current;
      renderer.render(scene, camera);

      // 渲染动画
      if (tweenAnimate.current) {
        TWEEN.update();
        animate();
      }
    };
    requestAnimationFrame(_animate);
  };

  /**
   * 处理动画渲染
   */
  const handleTween = (
    tween: Tween<{ [key: string]: string | number }>,
    onComplete: () => void = null
  ) => {
    tween.onComplete(() => {
      tweenAnimate.current = false;
      onComplete && onComplete();
    });
    tweenAnimate.current = true;
    animate();
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
    camera.position.set(0, 0, 50);
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
    const controls = new OrbitControls(camera, renderer.domElement);
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
    const width = 30;
    const height = 60;
    const thickness = 2;
    const depth = 10;

    new Three.TextureLoader().load(WoodPng, (texture) => {
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
          BookList[i - 1].forEach((bookItem: BookItemType, index: number) => {
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

      // 获取中心点
      const box = new Three.Box3();
      box.expandByObject(bookCase);
      const center = new Three.Vector3();
      box.getCenter(center);
      centerPoint.current = center;
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
      loadTexture(BookPng),
      loadTexture(BookSidePng),
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

    // 构建书本对象
    const bookObj = new Three.Object3D();
    sceneObj.current.add(bookObj);
    bookMesh.userData = { ...item, uuid: bookObj.uuid };
    bookObj.add(bookMesh);
    bookListObj.current.push(bookMesh);

    // 渲染书本名称
    const container: any = new ThreeMeshUI.Block({
      width,
      height,
      padding: 1,
      backgroundOpacity: 0,
      contentDirection: "column",
      alignContent: "center",
      justifyContent: "center",
      fontFamily: FontFamily as any,
      fontTexture: FontTexture,
    });
    const pos = bookMesh.position;
    container.position.set(pos.x, pos.y, pos.z + 4);
    bookObj.add(container);
    const text = new ThreeMeshUI.Text({
      content: "HTML base",
      fontSize: 1,
    });
    container.add(text);
    setTimeout(() => {
      animate();
    }, 200);
  };

  /**
   * 打开书本
   */
  const openBook = (book: Three.Mesh) => {
    // 移出
    const { x, y } = centerPoint.current;
    const bookMesh = book.children.find((item) => item.type === "Mesh");
    const tweenA = new Tween(bookMesh.position)
      .to({ x, y, z: "+8" }, 300)
      .onStart(() => {
        handleTween(tweenA);
      })
      .onUpdate((obj) => {
        book.children.forEach((item) => {
          if (item.type === "Mesh") {
            item.position.z = obj.z;
          } else {
            item.position.x = obj.x;
            item.position.y = obj.y;
            item.position.z = obj.z + 4;
          }
        });
      });
    tweenA.start().update();

    // 翻转
    const tweenB = new Tween({ y: 0 })
      .to({ y: -Math.PI / 2 }, 400)
      .onStart(() => {
        handleTween(tweenB, () => {
          // 跳转对应页面
          // setTimeout(() => {
          // }, 500);
        });
      })
      .onUpdate((obj) => {
        book.children.forEach((item) => {
          if (item.type === "Mesh") {
            item.rotation.y = obj.y;
          } else {
            book.remove(item);
          }
        });
      });
    tweenA.chain(tweenB);
  };

  /**
   * 选择书本
   */
  const selectBook = (e) => {
    if (currentBook.current) return; // 每次只能打开一本书

    const map = mapDom.current;
    const camera = cameraObj.current;
    const bookList = bookListObj.current;

    const x = (e.clientX / map.clientWidth) * 2 - 1;
    const y = -(e.clientY / map.clientHeight) * 2 + 1;
    const vector = new Three.Vector3(x, y, 0).unproject(camera);
    const raycasterObj = new Three.Raycaster(
      camera.position,
      vector.sub(camera.position).normalize()
    );
    raycasterObj.camera = camera;

    const intersects = raycasterObj.intersectObjects(bookList);
    if (intersects.length > 0) {
      const bookMesh = intersects[0].object;
      const { userData } = bookMesh;
      if (
        userData &&
        currentBook.current &&
        userData.title === currentBook.current.title
      ) {
        // do nothing
      } else {
        currentBook.current = bookMesh.userData;
        const parent = sceneObj.current.getObjectByProperty(
          "uuid",
          userData.uuid
        );
        openBook(parent);
      }
    }
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
      onClick={selectBook}
    ></div>
  );
};

export default App;
