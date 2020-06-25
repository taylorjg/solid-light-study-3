import * as THREE from 'three'
import Line2DInit from 'three-line-2d'
import Line2DBasicShaderInit from 'three-line-2d/shaders/basic'
import { LeavingForm } from './leaving'
import * as U from './utils'
import * as C from './constants'
import './styles.css'

const Line2D = Line2DInit(THREE)
const Line2DBasicShader = Line2DBasicShaderInit(THREE)

const LINE_THICKNESS = 0.05

class FormRenderer {

  constructor(form, applyTransforms, scene) {
    this.form = form
    this.applyTransforms = applyTransforms

    const points = U.repeat(151, new THREE.Vector2())
    const path = U.vectorsAsArrays(points)
    const lineGeometry = new Line2D(path)
    const lineMaterial = new THREE.ShaderMaterial(
      Line2DBasicShader({
        side: THREE.DoubleSide,
        diffuse: 0xffffff,
        thickness: LINE_THICKNESS
      }))
    this.lineMesh = new THREE.Mesh(lineGeometry, lineMaterial)
    applyTransforms(this.lineMesh)
    this.lineMesh.renderOrder = 0
    scene.add(this.lineMesh)

    const pointGeometry = new THREE.CircleBufferGeometry(LINE_THICKNESS, 32)
    const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 })
    this.pointMesh = new THREE.Mesh(pointGeometry, pointMaterial)
    this.pointMesh.visible = false
    this.pointMesh.renderOrder = 1
    scene.add(this.pointMesh)

    const deltaAngle = C.TWO_PI / 100
    const ellipsePoints = U.range(101).map(n => new THREE.Vector2(
      2 * Math.cos(n * deltaAngle),
      1.6 * Math.sin(n * deltaAngle)))
    const ellipsePath = U.vectorsAsArrays(ellipsePoints)
    const ellipseGeometry = new Line2D(ellipsePath)
    const ellipseMaterial = new THREE.ShaderMaterial(
      Line2DBasicShader({
        side: THREE.DoubleSide,
        diffuse: 0x808080,
        thickness: 0.01
      }))
    this.ellipseMesh = new THREE.Mesh(ellipseGeometry, ellipseMaterial)
    applyTransforms(this.ellipseMesh)
    this.ellipseMesh.renderOrder = -1
    scene.add(this.ellipseMesh)
  }

  update(stage) {
    const { line, point, showEllipseOutline } = this.form.getShapes(stage)
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
    this.ellipseMesh.visible = Boolean(showEllipseOutline)
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

  const camera = new THREE.PerspectiveCamera(65, w / h, 0.1, 50)
  camera.position.set(0, 0, 5)
  scene.add(camera)

  const leftForm = new LeavingForm(2, 1.6, true)
  const rightForm = new LeavingForm(2, 1.6, false)

  const leftFormRenderer = new FormRenderer(leftForm, mesh => mesh.translateX(-2.2), scene)
  const rightFormRenderer = new FormRenderer(rightForm, mesh => mesh.translateX(2.2), scene)

  window.addEventListener('resize', () => {
    renderer.setSize(container.offsetWidth, container.offsetHeight)
    camera.aspect = container.offsetWidth / container.offsetHeight
    camera.updateProjectionMatrix()
  })

  document.addEventListener('keydown', e => {
    switch (e.key) {
      case '0': return onStageButtonClick(0)
      case '1': return onStageButtonClick(1)
      case '2': return onStageButtonClick(2)
      case '3': return onStageButtonClick(3)
      case '4': return onStageButtonClick(4)
      case '5': return onStageButtonClick(5)
      case '6': return onStageButtonClick(6)
      case '7': return onStageButtonClick(7)
      case '8': return onStageButtonClick(8)
      case '9': return onStageButtonClick(9)
    }
  })

  let currentStage

  const STAGE_DESCRIPTIONS = [
    'Rotating radius',
    'Travelling wave along static radius',
    'Travelling wave along rotating radius',
    'Travelling wave clipped to ellipse with point of intersection highlighted',
    'As previous plus elliptical arcs',
    'As previous plus varying radius length',
    'As previous plus varying travelling wave amplitude',
    'As previous plus additional rotation of travelling wave'
  ]

  const render = () => {
    leftFormRenderer.update(currentStage)
    rightFormRenderer.update(currentStage)
    renderer.render(scene, camera)
    requestAnimationFrame(render)
  }

  const updateActiveStageButton = stage => {
    currentStage = stage
    const stageButtonElements = Array.from(document.querySelectorAll('.stage-button'))
    stageButtonElements.forEach((stageButtonElement, index) => {
      if (index == stage) {
        stageButtonElement.setAttribute('class', 'stage-button stage-button--active')
        stageButtonElement.focus()
      } else {
        stageButtonElement.setAttribute('class', 'stage-button')
      }
    })
  }

  const onStageButtonClick = stage => {
    const stageDescription = STAGE_DESCRIPTIONS[stage]
    if (stageDescription) {
      updateActiveStageButton(stage)
      const stageDescriptionElement = document.getElementById('stage-description')
      stageDescriptionElement.innerText = stageDescription
      leftForm.reset()
      rightForm.reset()
    }
  }

  const createStageButton = stage => {
    const parentElement = document.getElementById('stage-buttons')
    const stageButtonElement = document.createElement('button')
    stageButtonElement.setAttribute('class', 'stage-button')
    stageButtonElement.innerText = stage
    stageButtonElement.addEventListener('click', () => onStageButtonClick(stage))
    parentElement.appendChild(stageButtonElement)
  }

  STAGE_DESCRIPTIONS.forEach((_, index) => createStageButton(index))

  onStageButtonClick(0)
  renderer.render(scene, camera)
  render()
}

main()
