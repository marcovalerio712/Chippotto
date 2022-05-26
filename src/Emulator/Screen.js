

class Screen {

    constructor(scr) {
        this.canvas = scr
        this.canvasCtx = this.canvas.getContext("2d")
        this.pixelWidthSize = this.canvas.width / 64
        this.pixelHeightSize = this.canvas.height / 32
        this.screenBuffer =  new Array(32 * 64).fill(0)
        this.initializeScreen()
    }
    initializeScreen() {
        this.canvasCtx.fillStyle = "yellow"
        this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height)
        setTimeout(()=>startScreenRefresh(this), 0)
        console.log(this.screenBuffer)
    }
    cls() {
        this.screenBuffer =  new Array(32 * 64).fill(0)
    }
    error() {
        this.canvasCtx.fillStyle = "red"
        this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }
    writeByte(x, y, byte) {
        let collision = false
        for(let offs = 7; offs >= 0; offs--){
            collision = this.writePixel(x + offs, y, byte & 0x1) || collision
            byte = byte >> 1
        }   
        return collision
    }
    writePixel(x, y, v) {
        let newValue = v
        this.setBufferElementAt(x, y, newValue)
        return newValue != v
    }

    getBufferElementAt(x, y){
        return this.screenBuffer[x * 64 + y]
    }

    setBufferElementAt(x, y, value){
        this.screenBuffer[x * 64 + y] = value
    }
}

function startScreenRefresh(screen){
    function refreshScreen(){
        screen.canvasCtx.fillStyle = "black"
        screen.canvasCtx.fillRect(0, 0, screen.canvas.width, screen.canvas.height)
        screen.canvasCtx.fillStyle = "white"
        for(let y = 0; y < 32; y++){
            for(let x = 0; x < 64; x++){
                if(screen.getBufferElementAt(x, y)){
                    let xS = screen.pixelWidthSize
                    let yS = screen.pixelHeightSize
                    screen.canvasCtx.fillRect(x * xS, y * yS, xS, yS)
                }
            }
        }

        setTimeout(()=> {
            requestAnimationFrame(refreshScreen)
            
        }, 100/6)
    }
    refreshScreen()
}

export default Screen;