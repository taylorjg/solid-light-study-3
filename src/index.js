import * as THREE from 'three'
import Line2DInit from 'three-line-2d'
import Line2DBasicShaderInit from 'three-line-2d/shaders/basic'
import { LeavingForm } from './leaving'
import * as U from './utils'

const Line2D = Line2DInit(THREE)
const Line2DBasicShader = Line2DBasicShaderInit(THREE)

const LINE_THICKNESS = 0.04

// https://en.wikipedia.org/wiki/Z-fighting
const MITIGATE_Z_FIGHTING = 0.001

class FormRenderer {

  constructor(form, applyTransforms, scene) {
    this.form = form
    this.applyTransforms = applyTransforms

    const lineGeometry = new Line2D()
    const lineMaterial = new THREE.ShaderMaterial(
      Line2DBasicShader({
        side: THREE.DoubleSide,
        diffuse: 0xffffff,
        thickness: LINE_THICKNESS
      }))
    this.lineMesh = new THREE.Mesh(lineGeometry, lineMaterial)
    applyTransforms(this.lineMesh)
    scene.add(this.lineMesh)

    const pointGeometry = new THREE.CircleBufferGeometry(LINE_THICKNESS, 32)
    const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 })
    this.pointMesh = new THREE.Mesh(pointGeometry, pointMaterial)
    this.pointMesh.position.z = MITIGATE_Z_FIGHTING
    this.pointMesh.visible = false
    scene.add(this.pointMesh)
  }

  update() {
    const { line, point } = this.form.getShapes()
    const path = U.vectorsAsArrays(line.points)
    this.lineMesh.geometry.update(path)
    if (point) {
      this.pointMesh.visible = true
      this.pointMesh.position.x = point.point.x
      this.pointMesh.position.y = point.point.y
      this.applyTransforms(this.pointMesh)
    } else {
      this.pointMesh.visible = false
    }
  }
}

const main = async () => {
  const container = document.getElementById('container')
  const w = container.offsetWidth
  const h = container.offsetHeight
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(w, h)
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()

  const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 50)
  camera.position.set(1, 1, 8)
  camera.lookAt(new THREE.Vector3(0, 0, 0))
  scene.add(camera)

  const leftForm = new LeavingForm(2, 1.6, true)
  const rightForm = new LeavingForm(2, 1.6, false)

  const leftFormRenderer = new FormRenderer(leftForm, mesh => mesh.translateX(-2.2).translateY(0.5), scene)
  const rightFormRenderer = new FormRenderer(rightForm, mesh => mesh.translateX(2.2).translateY(0.5), scene)

  window.addEventListener('resize', () => {
    renderer.setSize(container.offsetWidth, container.offsetHeight)
    camera.aspect = container.offsetWidth / container.offsetHeight
    camera.updateProjectionMatrix()
  })

  document.addEventListener('keydown', e => {
    switch (e.key) {
      case '0': return
      case '1': return
      case '2': return
      case '3': return
      case '4': return
      case '5': return
      case '6': return
      case '7': return
      case '8': return
      case '9': return
    }
  })

  const render = () => {
    leftFormRenderer.update()
    rightFormRenderer.update()
    renderer.render(scene, camera)
    requestAnimationFrame(render)
  }

  render()
}

main()
