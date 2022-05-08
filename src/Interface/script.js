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
        let string = byte.toString(2)
        if (string.length < 8) {
            let nString = ""
            for(let i = 0; i< 8-string.length; i++){
               nString +="0" 
            }
            string =  nString + string 
        }
        for(let offs = 0; offs < string.length; offs++){
            this.writePixel(x+offs, y, string[offs])
        }
    }
    writePixel(x, y, v) {
        console.log("Write pixel ("+x+","+y+") type: "+v)
        this.canvasCtx.fillStyle = (v==='0') ? "black" : "white"
        this.canvasCtx.fillRect(x * this.pixelWidthSize, y * this.pixelHeightSize, this.pixelWidthSize, this.pixelHeightSize)
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

        let fullInstruction = Number(upperInstruction).toString(16).padStart(2, "0") + Number(lowerInstruction).toString(16).padStart(2, "0")
        return fullInstruction
    }

    decode(instr) {
        console.log("PC:" + this.pc)
        console.log("OPCode:" + instr)
        console.log("V:" + this.v)
        console.log("I: "+ this.i)

        switch (instr[0]) {
            case '0':
                switch (instr) {
                    case '00e0':
                        this.Screen.cls()
                        break;

                    default:
                        //this.Screen.error()
                        break;
                }
                break
            case '1':
                if(parseInt(instr.slice(1), 16) == this.pc){
                    this.stop()
                }
                else{
                this.pc = parseInt(instr.slice(1), 16)
                }
                break
            case '6':
                this.v[parseInt(instr[1], 16)] = parseInt(instr.slice(2), 16)
                break
            case '7':
                this.v[parseInt(instr[1], 16)] += parseInt(instr.slice(2), 16)
                break
            case 'a':
                this.i = parseInt(instr.slice(1), 16)
                //console.log(this.i)
                break
            case 'd':
                let x = this.v[parseInt(instr[1], 16)]
                let y = this.v[parseInt(instr[2], 16)]
                let n = parseInt(instr[3], 16)
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

                    //                    console.log(code)
                    this.Memory.loadRom(code)
                    this.Processor.run()
                })
        })
    }
}




const Emulator = new Chippotto(document.querySelector("#Screen"), document.querySelector('#LoadRomBTN'))

