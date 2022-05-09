import Memory from "./Memory.js";
import Screen from "./Screen.js";
import Processor from "./CPU.js";

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

export default Chippotto
