//comigo não funcionou essa abordagem
// import { prepareRunChecker } from "../../../../lib/shared/util"
// const { shouldRun: scrollShouldRun } = prepareRunChecker({ timerDelay: 200 })

export default class HandGestureController {
    #view
    #service
    #camera
    #continues = false
    #continues2 = false
    #lastDirection = {
        direction: '',
        y: 0
    }
    constructor({ view, service, camera }) {
        this.#view = view
        this.#service = service
        this.#camera = camera
    }
    async init() {
        return this.#loop()
    }
    #scrollPage(direction) {
        const pixelsPerScroll = 100
        if (this.#lastDirection.direction === direction) {
            this.#lastDirection.y = (
                direction === 'scroll-down' ?
                    this.#lastDirection.y + pixelsPerScroll
                    :
                    this.#lastDirection.y - pixelsPerScroll
            )
        }
        else {
            this.#lastDirection.direction = direction
        }

        this.#view.scrollPage(this.#lastDirection.y)

    }
    async #estimateHands() {
        try {
            const hands = await this.#service.estimateHands(this.#camera.video)
            this.#view.clearCanvas()
            if (hands?.length) this.#view.drawResults(hands)
            for await (const { event, x, y } of this.#service.detectGestures(hands)) {
                if (event === 'click') {
                    setTimeout(() => {
                        this.#continues2 = true
                    }, 200)
                    if (!this.#continues2) continue;
                    this.#view.clickOnElement(x, y)
                    this.#continues2 = false
                    continue;
                }
                if (event.includes('scroll')) {
                    setTimeout(() => {
                        this.#continues = true
                    }, 200)
                    if (!this.#continues) continue;
                    this.#scrollPage(event)
                    this.#continues = false
                }
            }
        } catch (error) {
            console.error('deu ruim', error)

        }
    }

    async #loop() {
        await this.#service.initializeDetector()
        await this.#estimateHands()
        this.#view.loop(this.#loop.bind(this))
    }
    static async initialize(deps) {
        const controller = new HandGestureController(deps)
        return controller.init()
    }
}