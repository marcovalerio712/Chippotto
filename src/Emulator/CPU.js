import Memory from "./Memory.js";
import Screen from "./Screen.js";

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
export default Processor