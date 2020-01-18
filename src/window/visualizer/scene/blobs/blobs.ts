import { ThreeScene } from '../base'
import * as THREE from 'three'
import { TrackSync } from 'utils/track'
import { getRandomColor } from 'utils/index'
import { Vector2, Material, DoubleSide, Clock, ShaderMaterial } from 'three'

export class BlobsScene extends ThreeScene {
    cube: THREE.Mesh
    volume: number
    track: TrackSync
    material: ShaderMaterial
    clock: Clock
    mesh: THREE.Mesh

    build() {
        this.camera.fov = 60
        this.camera.position.z = 400
        this.camera.position.y = 0
        this.camera.rotation.x = 0

        if (!this.material) {
            const resolution = new Vector2(640, 480)
            let uniforms = {
                u_time: { type: 'f', value: 0.0 },
                rad: { type: 'f', value: 0.25 },
                u_resolution: { type: 'vec2', value: resolution },
                u_circles: { type: 'i', value: 10 },
                u_size: { type: 'f', value: 0.05 },
                u_volume: { type: 'f', value: 0.0 },
            }

            const geometry = new THREE.PlaneGeometry(resolution.x, resolution.y, 1, 1)
            this.material = new THREE.ShaderMaterial({
                uniforms: uniforms,
                fragmentShader: require('./blobs.fs.glsl'),
                side: DoubleSide,
                vertexShader: require('./blobs.vs.glsl'),
            })

            this.mesh = new THREE.Mesh(geometry, this.material)
        }

        this.scene.add(this.mesh)
        // this.setDefaultLights()
    }

    onEnter() {
        // this.camera.position.setZ(6)
    }

    onBeat(beat: any) {
        // ;(this.cube.material as any).color.setRGB(...getRandomColor())
    }

    update(now: number, track: TrackSync) {
        const volume = track && track.volume ? track.volume : 0
        this.material.uniforms.u_time.value = now / 1000

        this.material.uniforms.u_circles.value = 4 + Math.ceil(volume * 5)
        // this.material.uniforms.u_size.value = 0.5 / this.material.uniforms.u_circles.value
        this.material.uniforms.u_volume.value = volume
        this.track = track
    }
}
