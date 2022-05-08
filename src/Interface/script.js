//import Chippotto from "../Emulator/Chippotto.js";

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

class FrameBuffer{
    constructor(){
        
    }
}

class Memory {
    constructor() {
        this.memory = new Uint8Array(4096)
        this.initializeSpritesInMemory()
    }

    initializeSpritesInMemory() {
        // Array of hex values for each sprite. Each sprite is 5 bytes.
        // The technical reference provides us with each one of these values.
        const sprites = [
            0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
            0x20, 0x60, 0x20, 0x20, 0x70, // 1
            0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
            0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
            0x90, 0x90, 0xF0, 0x10, 0x10, // 4
            0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
            0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
            0xF0, 0x10, 0x20, 0x40, 0x40, // 7
            0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
            0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
            0xF0, 0x90, 0xF0, 0x90, 0x90, // A
            0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
            0xF0, 0x80, 0x80, 0x80, 0xF0, // C
            0xE0, 0x90, 0x90, 0x90, 0xE0, // D
            0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
            0xF0, 0x80, 0xF0, 0x80, 0x80  // F
        ];

        // According to the technical reference, sprites are stored in the interpreter section of memory starting at hex 0x000
        for (let i = 0; i < sprites.length; i++) {
            this.memory[i] = sprites[i];
        }
    }
    loadRom(code) {
        for (let offs = 0; offs < code.length; offs++) {
            this.memory[0x200 + offs] = code[offs]
        }
    }
    memoryDump() {
        console.log(this.memory)
    }
    getAt(addr) {
        return this.memory[addr]
    }
}

class Processor {
    constructor(Memory, Screen) {
        this.Memory = Memory
        this.Screen = Screen
        this.v = new Uint8Array(16)
        this.i = 0
        this.pc = 0x200
    }

    run() {
        while (this.pc < 4096) {
            let instruction = this.fetchInstruction()
            this.decode(instruction)
            this.pc += 2
        }
    }

    fetchInstruction() {
        let upperInstruction = this.Memory.getAt(this.pc)
        let lowerInstruction = this.Memory.getAt(this.pc + 1)

        let fullInstruction = upperInstruction << 8 | lowerInstruction
        // console.log(fullInstruction.toString(2))
        // console.log(upperInstruction.toString(2) + " | " + lowerInstruction.toString(2))
        return fullInstruction
    }

    getSubValue(instruction, hexDigit, dimension = 1){
        let bitShift = ((3 - hexDigit - dimension + 1) << 2) 
        let mask = 0x0
        for(let i = 0; i < dimension; i++){
            mask = mask << 4
            mask = mask | 0xF
        }
        mask = mask << bitShift
        let subInstruction = instruction & mask
        return subInstruction >> bitShift
    }

    decode(instr) {
        console.log("PC:" + this.pc)
        console.log("OPCode:" + instr.toString(16))
        console.log("V:" + this.v)
        console.log("I: "+ this.i)

        console.log(instr.toString(16))
        switch (this.getSubValue(instr, 0)) {
            case 0x0:
                switch (instr) {
                    case 0x00e0:
                        this.Screen.cls()
                        break;

                    default:
                        //this.Screen.error()
                        break;
                }
                break
            case 0x1:
                if(this.getSubValue(instr, 1, 3) == this.pc){
                    this.stop()
                }
                else{
                this.pc = this.getSubValue(instr, 1, 3)
                }
                break
            case 0x6:
                this.v[this.getSubValue(instr, 1)] = this.getSubValue(instr, 2, 2)
                break
            case 0x7:
                this.v[this.getSubValue(instr, 1)] += this.getSubValue(instr, 2, 2)
                break
            case 0xA:
                this.i = this.getSubValue(instr, 1, 3);
                //console.log(this.i)
                break
            case 0xD:
                let x = this.v[this.getSubValue(instr, 1)]
                let y = this.v[this.getSubValue(instr, 2)]
                let n = this.getSubValue(instr, 3)
                for (let offs = 0; offs < n; offs += 1) {
                    let byteToWrite = this.Memory.getAt(this.i + offs)
                    this.Screen.writeByte(x, y + offs, byteToWrite)
                }
                break
            default:
                //this.Screen.error()
                break;
        }
    }
    stop(){
        this.pc=4097
    }
}



class Chippotto {
    constructor(screen, LoadRom) {

        this.Memory = new Memory()
        this.Screen = new Screen(screen)
        this.Processor = new Processor(this.Memory, this.Screen)

        this.Rom = LoadRom
        this.initializeEmulator()
    }




    initializeEmulator() {
        this.Rom.addEventListener("click", () => {
            fetch('./../../IgnoreForTest/chip8-roms-master/chip8-roms-master/programs/IBM Logo.ch8')
                .then((data) => data.blob())
                .then((c) => c.arrayBuffer())
                .then((aB) => {
                    let code = new Uint8Array(aB)
                    this.Memory.loadRom(code)
                    this.Processor.run()
                })
        })
    }
}




const Emulator = new Chippotto(document.querySelector("#Screen"), document.querySelector('#LoadRomBTN'))

