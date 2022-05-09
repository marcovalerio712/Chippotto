class Screen {

    constructor(scr) {
        this.canvas = scr
        this.canvasCtx = this.canvas.getContext("2d")
        this.pixelWidthSize = this.canvas.width / 64
        this.pixelHeightSize = this.canvas.height / 32
        this.initializeScreen()
    }
    initializeScreen() {
        this.canvasCtx.fillStyle = "yellow"
        this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }
    cls() {
        this.canvasCtx.fillStyle = "black"
        this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }
    error() {
        this.canvasCtx.fillStyle = "red"
        this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }
    writeByte(x, y, byte) {
        console.log("Write pixel ("+x+","+y+") value: "+byte)
        for(let offs = 7; offs >= 0; offs--){
            this.writePixel(x + offs, y, byte%2!=0)
            byte = byte >> 1
        }
    }
    writePixel(x, y, v) {
        console.log("Write pixel ("+x+","+y+") type: "+v)
        this.canvasCtx.fillStyle = v ? "white" : "black"
        this.canvasCtx.fillRect(x * this.pixelWidthSize, y * this.pixelHeightSize, this.pixelWidthSize, this.pixelHeightSize)
    }
}

export default Screen;