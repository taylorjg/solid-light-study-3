import * as THREE from 'three'

export const range = n =>
  Array.from(Array(n).keys())

export const repeat = (n, x) =>
  range(n).map(() => x)

export const vectorsAsArrays = vectors =>
  vectors.map(vector => vector.toArray())

export const loadTexture = url =>
  new Promise((resolve, reject) => {
    const textureLoader = new THREE.TextureLoader()
    textureLoader.load(url, resolve, reject)
  })
