import * as THREE from 'three'
import { newtonsMethod } from './newtons-method'
import { Line } from './line'
import * as U from './utils'
import * as C from './constants'

// Parametric equation of an ellipse:
// x = a * cos(t)
// y = b * sin(t)

// Parametric equation of a travelling wave:
// x = t
// y = a * sin(k * t - wt)

// Parametric equation of a travelling wave rotated ccw by theta:
// x = t * cos(theta) - a * sin(k * t - wt) * sin(theta)
// y = t * sin(theta) + a * sin(k * t - wt) * cos(theta)
// (see https://math.stackexchange.com/questions/245859/rotating-parametric-curve)

const parametricEllipseX = rx =>
  t => rx * Math.cos(t)

const parametricEllipseY = ry =>
  t => ry * Math.sin(t)

const parametricTravellingWaveX = (a, k, wt, theta) =>
  t => t * Math.cos(theta) - a * Math.sin(k * t - wt) * Math.sin(theta)

const parametricTravellingWaveY = (a, k, wt, theta) =>
  t => t * Math.sin(theta) + a * Math.sin(k * t - wt) * Math.cos(theta)

// The following online tool was very useful for finding the derivatives:
// https://www.symbolab.com/solver/derivative-calculator

const parametricEllipseXDerivative = rx =>
  t => -rx * Math.sin(t)

const parametricEllipseYDerivative = ry =>
  t => ry * Math.cos(t)

const parametricTravellingWaveXDerivative = (a, k, wt, theta) =>
  t => Math.cos(theta) - a * Math.sin(theta) * Math.cos(k * t - wt) * k

const parametricTravellingWaveYDerivative = (a, k, wt, theta) =>
  t => Math.sin(theta) + a * Math.cos(theta) * Math.cos(k * t - wt) * k

const easeInOutQuint = x =>
  x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2

const MAX_TICKS = 10000
const ELLIPSE_POINT_COUNT = 100
const TRAVELLING_WAVE_POINT_COUNT = 50
const F = 25
const OMEGA = C.TWO_PI * F

export class LeavingForm {

  constructor(rx, ry, initiallyGrowing) {
    this.rx = rx
    this.ry = ry
    const waveLength = Math.min(this.rx, this.ry)
    this.k = C.TWO_PI / waveLength
    this.growing = initiallyGrowing
    this.tick = 0
    this.multiplier = 1
  }

  // 0.00 => 0.25: 0.00 => 1.00
  // 0.25 => 0.75: 1.00
  // 0.75 => 1.00: 1.00 => 0.00
  travellingWaveRadiusRatio(tickRatio) {
    if (tickRatio <= 0.25) {
      const t = tickRatio * 4
      return t
    }
    if (tickRatio >= 0.75) {
      const t = (1 - tickRatio) * 4
      return t
    }
    return 1
  }

  // 0.00 => 0.25: -PI/4 => 0
  // 0.25 => 0.75: 0
  // 0.75 => 1.00: 0 => PI/4
  travellingWaveAdditionalRotation(tickRatio) {
    if (tickRatio <= 0.25) {
      const t = 1 - (tickRatio * 4)
      return -(t * C.QUARTER_PI)
    }
    if (tickRatio >= 0.75) {
      const t = (tickRatio - 0.75) * 4
      return t * C.QUARTER_PI
    }
    return 0
  }

  // 0.00 => 0.25: 0 => max
  // 0.25 => 0.50: max => 0
  // 0.50 => 0.75: 0 => max
  // 0.75 => 1.00: max => 0
  travellingWaveAmplitude(tickRatio) {
    const maxAmplitude = 0.15
    if (tickRatio < 0.25) {
      const t = tickRatio * 4
      return maxAmplitude * easeInOutQuint(t)
    }
    if (tickRatio < 0.5) {
      const t = (0.5 - tickRatio) * 4
      return maxAmplitude * t
    }
    if (tickRatio < 0.75) {
      const t = (tickRatio - 0.5) * 4
      return maxAmplitude * t
    }
    const t = (1 - tickRatio) * 4
    return maxAmplitude * easeInOutQuint(t)
  }

  findPointOfIntersection(tickRatio, a, wt) {

    const clockFaceAngle = C.TWO_PI * tickRatio
    const actualAngle = -C.HALF_PI - clockFaceAngle
    const theta = actualAngle - C.PI

    const t1e = actualAngle
    const t2e = this.rx * Math.cos(actualAngle)

    const { t1, t2, } = newtonsMethod(
      parametricEllipseX(this.rx),
      parametricEllipseY(this.ry),
      parametricTravellingWaveX(a, this.k, wt, theta),
      parametricTravellingWaveY(a, this.k, wt, theta),
      parametricEllipseXDerivative(this.rx),
      parametricEllipseYDerivative(this.ry),
      parametricTravellingWaveXDerivative(a, this.k, wt, theta),
      parametricTravellingWaveYDerivative(a, this.k, wt, theta),
      t1e,
      t2e)

    const p = new THREE.Vector2(
      parametricEllipseX(this.rx)(t1),
      parametricEllipseY(this.ry)(t1))

    const radius = p.length()

    return { theta, t1, t2, p, radius }
  }

  getTravellingWavePoints(t2, a, wt, radius, theta) {
    const deltaRadius = radius / TRAVELLING_WAVE_POINT_COUNT
    return U.range(TRAVELLING_WAVE_POINT_COUNT + 1).map(n => {
      const t = t2 + n * deltaRadius
      const x = parametricTravellingWaveX(a, this.k, wt, theta)(t)
      const y = parametricTravellingWaveY(a, this.k, wt, theta)(t)
      return new THREE.Vector2(x, y)
    })
  }

  getEllipsePoints(t1) {
    const [startAngle, endAngle] = this.growing
      ? [-C.HALF_PI, t1]
      : [t1, -C.HALF_PI - C.TWO_PI]
    const deltaAngle = (endAngle - startAngle) / ELLIPSE_POINT_COUNT
    return U.range(ELLIPSE_POINT_COUNT + 1).map(n => {
      let t = startAngle + n * deltaAngle
      let x = parametricEllipseX(this.rx)(t)
      let y = parametricEllipseY(this.ry)(t)
      return new THREE.Vector2(x, y)
    })
  }

  combinePoints(ellipsePoints, travellingWavePoints) {
    const p1 = travellingWavePoints[0]
    const p2 = travellingWavePoints.slice(-1)[0]
    if (p1.distanceTo(p2) < 0.001) {
      return ellipsePoints
    }
    const travellingWavePointsTail = travellingWavePoints.slice(1)
    return this.growing
      ? ellipsePoints.concat(travellingWavePointsTail)
      : travellingWavePointsTail.reverse().concat(ellipsePoints)
  }

  getEllipseRadius(theta, multiplier = 1) {
    const x = multiplier * this.rx * Math.cos(theta)
    const y = multiplier * this.ry * Math.sin(theta)
    return new THREE.Vector2(x, y).length()
  }

  stage0(tickRatio) {
    const t = -C.HALF_PI - tickRatio * C.TWO_PI
    const x = parametricEllipseX(this.rx)(t)
    const y = parametricEllipseY(this.ry)(t)
    const line = new Line([new THREE.Vector2(x, y), new THREE.Vector2()])
    return {
      line,
      showEllipseOutline: true
    }
  }

  stage1(tickRatio) {
    const theta = -C.HALF_PI
    const radius = this.getEllipseRadius(theta, 1.1)
    const a = 0.15
    const wt = OMEGA * tickRatio
    const travellingWavePoints = this.getTravellingWavePoints(0, a, wt, radius, theta)
    const line = new Line(travellingWavePoints)
    return {
      line,
      showEllipseOutline: true
    }
  }

  stage2(tickRatio) {
    const theta = -C.HALF_PI - tickRatio * C.TWO_PI
    const radius = this.getEllipseRadius(theta, 1.1)
    const a = 0.15
    const wt = OMEGA * tickRatio
    const travellingWavePoints = this.getTravellingWavePoints(0, a, wt, radius, theta)
    const line = new Line(travellingWavePoints)
    return {
      line,
      showEllipseOutline: true
    }
  }

  stage3(tickRatio) {
    const a = 0.15
    const wt = OMEGA * tickRatio
    const { theta, t2, p, radius } = this.findPointOfIntersection(tickRatio, a, wt)
    const travellingWavePoints = this.getTravellingWavePoints(t2, a, wt, radius, theta)
    const line = new Line(travellingWavePoints)
    return {
      line,
      p,
      showEllipseOutline: true
    }
  }

  stage4(tickRatio) {
    const a = 0.15
    const wt = OMEGA * tickRatio
    const { theta, t1, t2, radius } = this.findPointOfIntersection(tickRatio, a, wt)
    const ellipsePoints = this.getEllipsePoints(t1)
    const travellingWavePoints = this.getTravellingWavePoints(t2, a, wt, radius, theta)
    let combinedPoints = this.combinePoints(ellipsePoints, travellingWavePoints)
    const line = new Line(combinedPoints)
    return {
      line
    }
  }

  stage5(tickRatio) {
    const a = 0.15
    const wt = OMEGA * tickRatio
    const { theta, t1, t2, radius } = this.findPointOfIntersection(tickRatio, a, wt)
    const ellipsePoints = this.getEllipsePoints(t1)
    const radiusRatio = this.travellingWaveRadiusRatio(tickRatio)
    const travellingWavePoints = this.getTravellingWavePoints(t2, a, wt, radius * radiusRatio, theta)
    let combinedPoints = this.combinePoints(ellipsePoints, travellingWavePoints)
    const line = new Line(combinedPoints)
    return {
      line
    }
  }

  stage6(tickRatio) {
    const a = this.travellingWaveAmplitude(tickRatio)
    const wt = OMEGA * tickRatio
    const { theta, t1, t2, radius } = this.findPointOfIntersection(tickRatio, a, wt)
    const ellipsePoints = this.getEllipsePoints(t1)
    const radiusRatio = this.travellingWaveRadiusRatio(tickRatio)
    const travellingWavePoints = this.getTravellingWavePoints(t2, a, wt, radius * radiusRatio, theta)
    let combinedPoints = this.combinePoints(ellipsePoints, travellingWavePoints)
    const line = new Line(combinedPoints)
    return {
      line
    }
  }

  stage7(tickRatio) {
    const a = this.travellingWaveAmplitude(tickRatio)
    const wt = OMEGA * tickRatio
    const { theta, t1, t2, p, radius } = this.findPointOfIntersection(tickRatio, a, wt)
    const ellipsePoints = this.getEllipsePoints(t1)
    const radiusRatio = this.travellingWaveRadiusRatio(tickRatio)
    const additionalRotation = this.travellingWaveAdditionalRotation(tickRatio)
    const travellingWavePoints = this.getTravellingWavePoints(t2, a, wt, radius * radiusRatio, theta)
      .map(travellingWavePoint => additionalRotation
        ? travellingWavePoint.rotateAround(p, additionalRotation)
        : travellingWavePoint)
    let combinedPoints = this.combinePoints(ellipsePoints, travellingWavePoints)
    const line = new Line(combinedPoints)
    return {
      line
    }
  }

  doStage(stage, tickRatio) {
    switch (stage) {
      case 0: return this.stage0(tickRatio)
      case 1: return this.stage1(tickRatio)
      case 2: return this.stage2(tickRatio)
      case 3: return this.stage3(tickRatio)
      case 4: return this.stage4(tickRatio)
      case 5: return this.stage5(tickRatio)
      case 6: return this.stage6(tickRatio)
      case 7: default: return this.stage7(tickRatio)
    }
  }

  getShapes(stage) {
    const tickRatio = this.tick / MAX_TICKS
    const shapes = this.doStage(stage, tickRatio)
    this.tick += this.multiplier
    if (this.tick > MAX_TICKS) {
      this.toggleGrowing()
    }
    return shapes
  }

  toggleGrowing() {
    this.growing = !this.growing
    this.tick = 0
  }

  reset() {
    this.tick = 0
  }

  setSpeed(multiplier) {
    this.multiplier = multiplier
    if (multiplier > 1) {
      this.tick += (multiplier - this.tick % multiplier) % multiplier
    }
  }
}
