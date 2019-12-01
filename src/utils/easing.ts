/**
 * Common easing functions.
 * https://gist.github.com/gre/1650294
 */
export const easingFunctions = {
    linear(t) {
        return t
    },
    easeInQuad(t) {
        return t * t
    },
    easeOutQuad(t) {
        return t * (2 - t)
    },
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    },
    easeInCubic(t) {
        return t * t * t
    },
    easeOutCubic(t) {
        return --t * t * t + 1
    },
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
    },
    easeInQuart(t) {
        return t * t * t * t
    },
    easeOutQuart(t) {
        return 1 - --t * t * t * t
    },
    easeInOutQuart(t) {
        return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t
    },
    easeInQuint(t) {
        return t * t * t * t * t
    },
    easeOutQuint(t) {
        return 1 + --t * t * t * t * t
    },
    easeInOutQuint(t) {
        return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t
    },
    // elastic bounce effect at the beginning
    easeInElastic: function(t) {
        return (0.04 - 0.04 / t) * Math.sin(25 * t) + 1
    },
    // elastic bounce effect at the end
    easeOutElastic: function(t) {
        return ((0.04 * t) / --t) * Math.sin(25 * t)
    },
    // elastic bounce effect at the beginning and end
    easeInOutElastic: function(t) {
        return (t -= 0.5) < 0 ? (0.02 + 0.01 / t) * Math.sin(50 * t) : (0.02 - 0.01 / t) * Math.sin(50 * t) + 1
    },
}

/**
 * @function ease – Apply an easing function to a progress value [0 - 1].
 * @param { string } method – Selected easing function.
 * @param { integer } smoothing – Smoothing factor. Increase value to reduce the effect of the easing function.
 */
export default function ease(t, method = 'easeOutQuart') {
    if (!easingFunctions[method]) throw new Error(`Unknown easing function "${method}"`)
    const progress = Math.min(Math.max(0, t), 1)
    return easingFunctions[method](progress)
}

export const getRandomEasingFunc = () => {
    const keys = Object.keys(easingFunctions).filter(f => (f.indexOf('Elastic') === -1 ? true : false))
    const id = Math.floor(Math.random() * keys.length)
    return keys[id]
}
