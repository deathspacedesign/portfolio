import * as THREE from "three"

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass"
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass"

import { useEffect, useRef } from "react"
import styled from "styled-components"
import {
  motion,
  useMotionValue,
  useSpring,
  useVelocity,
  useTransform,
} from "framer-motion"

const VanillaHover = ({ animatedX }) => {
  const canvasEl = useRef(null)

  let camera, scene, renderer, composer, renderPass, customPass, canvasNode
  let material,
    mesh,
    uMouse = new THREE.Vector2(0, 0)

  const snapArr = []

  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()
  const moveByFactor = 10.5

  let imagesArr = Array.from({ length: 3 }, (_, i) => i + 1)
  let meshArr

  // const ease = [0.6, 0.05, -0.01, 0.99]
  // const easeVal = [0.65, 0, 0.35, 1]
  let animatedXVelocity = useVelocity(animatedX)

  let initialX = 0,
    currX = 0,
    panPressed,
    movingX,
    calcX

  const ogFunc = () => {
    canvasNode = canvasEl.current
    const init = () => {
      camera = new THREE.PerspectiveCamera(
        75,
        canvasNode.offsetWidth / canvasNode.offsetHeight,
        0.01,
        10
      )
      // camera.fov =
      //   2 *
      //   Math.atan(canvasNode.offsetWidth / camera.aspect / (2 * 5)) *
      //   (180 / Math.PI) // in degrees

      camera.position.z = 5

      scene = new THREE.Scene()

      meshArr = imagesArr.map((i) => {
        var obj = {
          id: i - 1,
          material,
          geometry: new THREE.PlaneGeometry(8, 4.5),
          texture: new THREE.TextureLoader().load(`image${i}.png`),
          mesh,
        }

        obj.material = new THREE.MeshBasicMaterial({
          map: obj.texture,
        })
        obj.mesh = new THREE.Mesh(obj.geometry, obj.material)

        return obj
      })

      meshArr.forEach((el) => {
        scene.add(el.mesh)
        el.mesh.position.set(el.id * moveByFactor, 0)
      })

      for (let i = 0; i < meshArr.length; i++) {
        i == 0
          ? snapArr.push({ id: i, val: 0 })
          : snapArr.push({
              id: i,
              val: -(moveByFactor * (i - 1) + moveByFactor / 2),
            })
      }

      // const bgColor = new THREE.Color(0x0e0c10)
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      // renderer.setClearColor(0xffffff, 0)
      scene.background = new THREE.Color(0x0e0c10)
      // scene.background = bgColor
      renderer.setSize(canvasNode.offsetWidth, canvasNode.offsetHeight)
      // renderer.outputEncoding = THREE.sRGBEncoding
      canvasNode.appendChild(renderer.domElement)

      //postprocessing

      composer = new EffectComposer(renderer)
      renderPass = new RenderPass(scene, camera)
      composer.addPass(renderPass)

      const myEffect = {
        uniforms: {
          tDiffuse: { value: null },
          resolution: {
            value: new THREE.Vector2(1, window.innerHeight / window.innerWidth),
          },
          uMouse: { value: new THREE.Vector2(-10, -10) },
          uVelo: { value: 0 },
        },
        vertexShader: `varying vec2 vUv;void main() {vUv = uv;gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0 );}`,
        fragmentShader: `uniform float time;
          uniform sampler2D tDiffuse;
          uniform vec2 resolution;
          varying vec2 vUv;
          uniform vec2 uMouse;
          float circle(vec2 uv, vec2 disc_center, float disc_radius, float border_size) {
            uv -= disc_center;
            uv*=resolution;
            float dist = sqrt(dot(uv, uv));
            return smoothstep(disc_radius+border_size, disc_radius-border_size, dist);
          }
          void main()  {
              vec2 newUV = vUv;
              float c = circle(vUv, uMouse, 0.0, 0.2);
              float r = texture2D(tDiffuse, newUV.xy += c * (0.1 * .5)).x;
              float g = texture2D(tDiffuse, newUV.xy += c * (0.1 * .525)).y;
              float b = texture2D(tDiffuse, newUV.xy += c * (0.1 * .55)).z;
              vec4 color = vec4(r, g, b, 1.);
              gl_FragColor = color;
          }`,
      }

      customPass = new ShaderPass(myEffect)
      customPass.renderToScreen = true
      composer.addPass(customPass)
    }

    var animate = function () {
      // console.log(animatedX.get())

      // let calcX = animatedX.get() + (currX - initialX) * 10
      // if (calcX <= 0 && panPressed) animatedX.set(calcX)

      // console.log("currX" + currX + "initialX" + initialX)

      // console.log(movingX)

      camera.position.x = -animatedX.get()

      // meshArr.forEach((el) => {
      //   scene.add(el.mesh)
      //   el.mesh.position.x = animatedX.get() + el.id * 10.5
      // })

      // mesh.position.x = animatedX.get()
      // mesh2.position.x = animatedX.get() + moveByFactor

      customPass.uniforms.uMouse.value = uMouse

      // renderer.render( scene, camera );
      composer.render()

      requestAnimationFrame(animate)

      // 165 fps limiter

      // setTimeout(function () {
      //   customPass.uniforms.uMouse.value = uMouse
      //   camera.position.x = -animatedX.get()

      //   requestAnimationFrame(animate)
      // }, 1000 / 165)
    }

    window.addEventListener("resize", () => {
      // console.log("updated!")
      // console.log(2 * Math.atan(8 / camera.aspect / (2 * 5)) * (180 / Math.PI)) // in degrees
      // camera.fov = 2 * Math.atan(12 / camera.aspect / (2 * 5)) * (180 / Math.PI)

      canvasNode = canvasEl.current

      if (canvasNode) {
        panPressed = false
        camera.aspect = canvasNode.offsetWidth / canvasNode.offsetHeight
        camera.updateProjectionMatrix()
        renderer.setSize(canvasNode.offsetWidth, canvasNode.offsetHeight)
        composer.setSize(canvasNode.offsetWidth, canvasNode.offsetHeight)
      }
    })

    canvasEl.current.addEventListener("mousemove", (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1

      // mousemove / touchmove
      uMouse.x = e.clientX / canvasNode.offsetWidth
      uMouse.y = 1 - e.clientY / canvasNode.offsetHeight

      // Original code
      // uMouse.x = e.clientX / window.innerWidth
      // uMouse.y = 1 - e.clientY / window.innerHeight

      // console.log(uMouse.x, uMouse.y)

      // console
      //   .log
      //   // "e.clientX " +
      //     e.clientX +
      //   " mouseX: " + uMouse.x + " mouseY: " + uMouse.y
      //   ()
    })

    canvasNode.addEventListener("click", onMouseClick, false)

    init()
    animate()
  }

  useEffect(() => {
    ogFunc()
    animatedX.onChange(() => {
      // console.log(animatedX.get())
      if (!panPressed) {
        snapFunc()
      }
    })

    return () => {
      var myNode = canvasEl.current
      if (myNode) {
        while (myNode.firstChild) {
          myNode.removeChild(myNode.lastChild)
        }
      }
    }
  }, [])

  // const nearestOddNumber = i => {
  //   if (i%2 == 0) return i
  //   else {
  //     while (i%2 != 0) {
  //       i++
  //     }
  //     return i
  //   }
  // }
  const snapFunc = () => {
    // OG DRY implementation
    // const snapArr = [-13, -5, 0]
    // if (animatedX.get() <= snapArr[0]) animatedX.set(-18)
    // else if (animatedX.get() <= snapArr[1]) animatedX.set(-9)
    // else if (animatedX.get() <= snapArr[2]) animatedX.set(0)

    // const snapArr = meshArr.forEach((el) => {
    //   return {
    //     id: el.id,
    //     val: el.id * (moveByFactor / 2),
    //   }
    // })

    // console.log(snapArr)
    // const snapArr = [
    //   { id: 0, val: 0 },
    //   { id: 1, val: -5.25 },
    //   { id: 2, val: -15.75 },
    // ]

    // [
    //   { id: 0, val: 0 },
    //   { id: 1, val: -5.25 },
    //   { id: 2, val: -15.75 },
    // ]

    // console.log(animatedX.get())

    snapArr.forEach((el) => {
      if (animatedX.get() <= el.val) {
        animatedX.set(-(el.id * moveByFactor))
      }
    })
  }

  function onPan(event, info) {
    canvasNode = canvasEl.current

    // const relativeX = info.point.x / canvasNode.offsetWidth - 0.5

    // let calcX = animatedX.get() + relativeX * 0.02
    // animatedX.set(calcX)
    // console.log(relativeX)

    // let panX = info.point.x / canvasNode.offsetWidth
    // if (panX - currX == 0)

    setTimeout(() => {
      initialX = info.point.x / canvasNode.offsetWidth
    }, 250)
    currX = info.point.x / canvasNode.offsetWidth

    movingX = currX - initialX

    // Move the images by manipulating animatedX
    calcX = animatedX.get() + movingX * 10.5
    if (calcX <= 0 && panPressed) animatedX.set(calcX)

    // console.log("currX" + currX)

    // console.log("animatedX: " + animatedX.get())
  }

  function onPanStart(event, info) {
    canvasNode = canvasEl.current

    panPressed = true
    canvasNode = canvasEl.current
    initialX = info.point.x / canvasNode.offsetWidth

    // console.log("initialX" + initialX)
  }

  function onPanEnd(event, info) {
    canvasNode = canvasEl.current
    // currX = info.point.x / canvasNode.offsetWidth

    panPressed = false
    snapFunc()
  }

  function onMouseClick(event) {
    movingX = currX - initialX
    var bounds = canvasNode.getBoundingClientRect()
    mouse.x = ((event.clientX - bounds.left) / canvasNode.clientWidth) * 2 - 1
    mouse.y = -((event.clientY - bounds.top) / canvasNode.clientHeight) * 2 + 1
    raycaster.setFromCamera(mouse, camera)

    var intersects = raycaster.intersectObjects(scene.children, true)
    if (intersects.length > 0) {
      // Check if still

      // console.log(animatedX.get())

      // Do stuff

      intersects.forEach((element) => {
        let positiveAnimatedX = Math.abs(animatedX.get())

        // animatedX.get() < 0
        //   ? (positiveAnimatedX = animatedX.get() * -1)
        //   : (positiveAnimatedX = animatedX.get())

        // console.log(animatedX.get(), positiveAnimatedX)

        // console.log(movingX)

        if (
          positiveAnimatedX < element.object.position.x + 0.1 &&
          positiveAnimatedX > element.object.position.x - 0.1 &&
          movingX < 0.01 &&
          movingX > -0.01
        ) {
          // Open artwork page / portfolio piece
          console.log("success!")
          // console.log(animatedXVelocity.get())
          meshArr.forEach((el) => {
            if (element.object.position === el.mesh.position) {
              // console.log(el.id)
            }
          })
        } else {
          // Do nothing
          console.log("lol")
        }
      })

      // console.log(intersects)
    }
  }

  return (
    <CanvasElement
      onPanStart={onPanStart}
      onPanEnd={onPanEnd}
      onPan={onPan}
      ref={canvasEl}
      className="threejsCover"
    ></CanvasElement>
  )
}

const CanvasElement = styled(motion.div)`
  cursor: grab;
  width: 100%;
  height: 100%;
`

export default VanillaHover
