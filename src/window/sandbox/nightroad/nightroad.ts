import { ThreeScene } from '../../visualizer/scene/base'
import { Road } from './road'
import { CarLights } from './carlights'
import { Uniform, Vector2 } from 'three'
import ease, { getRandomEasingFunc } from 'utils/easing'

const options = {
    length: 400,
    width: 20,
    roadWidth: 9,
    islandWidth: 2,
    nPairs: 15,
    roadSections: 3,
    distortion: { uDistortionX: new Uniform(new Vector2(1, 1)), uDistortionY: new Uniform(new Vector2(1, 1)) },
    camera: {
        z: -5,
        y: 7,
        x: 0,
        speed: 1.5,
    },
}

export class SandboxScene extends ThreeScene {
    road: Road
    leftLights: CarLights
    rightLights: CarLights
    startDistortion: typeof options.distortion = JSON.parse(JSON.stringify(options.distortion))
    nextDistortion: typeof options.distortion = JSON.parse(JSON.stringify(options.distortion))
    startTime: number
    nextTime: number
    duration: number = 1
    easing: string = 'easeOutQuart'

    build() {
        this.road = new Road(this.scene, options)
        this.leftLights = new CarLights(this.scene, options, 0xfafafa, -180)
        this.rightLights = new CarLights(this.scene, options, 0xff102a, 60)

        this.road.init()
        this.leftLights.init()
        this.leftLights.mesh.position.setX(-options.roadWidth / 2 - options.islandWidth / 2)

        this.rightLights.init()
        this.rightLights.mesh.position.setX(options.roadWidth / 2 + options.islandWidth / 2)
    }

    onEnter() {
        this.camera.position.z = options.camera.z
        this.camera.position.y = options.camera.y
        this.camera.position.x = options.camera.x

        this.camera.fov = 60
        this.camera.updateProjectionMatrix()

        this.startTime = this.clock.elapsedTime
        this.nextTime = this.clock.elapsedTime
        this.duration = 2

        this.clock.start()

        setTimeout(() => {
            this.setNewDistortion()
        }, 1000)
    }

    setNewDistortion() {
        const tmp = JSON.parse(JSON.stringify(this.nextDistortion))
        this.nextDistortion.uDistortionY.value = new Vector2(80 * Math.random() - 40, 4 * Math.random())
        this.nextDistortion.uDistortionX.value = new Vector2(80 * Math.random() - 40, 4 * Math.random())
        this.duration = 1 + Math.random() * 2
        this.startTime = this.clock.getElapsedTime()
        this.nextTime = this.startTime + this.duration
        this.startDistortion = tmp
        this.easing = getRandomEasingFunc()
        setTimeout(() => {
            this.setNewDistortion()
        }, this.duration * 1000) // + 3000 + Math.random() * 4000)
    }

    update(now: number) {
        let t = now / 1000
        this.rightLights.update(t)
        this.leftLights.update(t)
        this.road.update(t)

        t = t * options.camera.speed

        const progress = (this.clock.getElapsedTime() - this.startTime) / this.duration

        options.distortion.uDistortionX.value = easeVector(
            this.startDistortion.uDistortionX.value,
            this.nextDistortion.uDistortionX.value,
            progress,
            this.easing
        )
        options.distortion.uDistortionY.value = easeVector(
            this.startDistortion.uDistortionY.value,
            this.nextDistortion.uDistortionY.value,
            progress,
            this.easing
        )

        let shiftY = 1 - Math.abs(options.camera.z * 2) / options.length

        const Y = options.distortion.uDistortionY.value.x * nsin(t - (shiftY * Math.PI) / 2)
        const X = options.distortion.uDistortionX.value.x * nsin(t - Math.PI / 2)

        const nextY = options.distortion.uDistortionY.value.x * nsin(t - (shiftY * Math.PI) / 2 + 0.1)
        const nextX = options.distortion.uDistortionX.value.x * nsin(t - Math.PI / 2 + 0.1)

        // this.camera.position.setY(options.camera.y + Y)
        // this.camera.position.setX(options.camera.x + X)

        // this.camera.rotation.x = (nextY - Y) / 5
        // this.camera.rotation.y = (-1 * (nextX - X)) / 7

        this.camera.updateProjectionMatrix()
    }
}

export const nsin = val => Math.sin(val) * 0.5 + 0.5

export const easeVector = (start: Vector2, next: Vector2, alpha: number, efunc = undefined) => {
    const direction = new Vector2(next.x, next.y).sub(start)
    const res = new Vector2(start.x, start.y).add(direction.multiplyScalar(ease(alpha, efunc)))
    return res
}
