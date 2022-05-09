import Memory from "./Memory.js";
import Screen from "./Screen.js";

class Processor {
    constructor(Memory, Screen) {
        this.Memory = Memory
        this.Screen = Screen
        
        this.v = new Uint8Array(16)
        this.i = 0
        this.pc = 0x200

        this.setupInstructionSet()
    }

    setupInstructionSet(){
        this.instructionSet = new Map();
        
        //These cases map 1 on 1 on instructions of the processor, implemented dedicated  by methods
        this.instructionSet.set(0x00E0, (opCode) => this.cls(opCode));
        this.instructionSet.set(0x00EE, (opCode) => null);
        this.instructionSet.set(0x1000, (opCode) => this.jump(opCode));
        this.instructionSet.set(0x6000, (opCode) => this.setRegisterV(opCode));
        this.instructionSet.set(0x7000, (opCode) => this.addToRegisterV(opCode));
        this.instructionSet.set(0xA000, (opCode) => this.setI(opCode));
        this.instructionSet.set(0xD000, (opCode) => this.drawSprite(opCode));    

        //Put the ambiguous cases here
        this.instructionSet.set(0x0000, (opCode) => this.executeInstruction(opCode, 0xF0FF));
    }

    run() {
        while (this.pc < 4096) {
            let instruction = this.fetchInstruction()
            this.executeInstruction(instruction)
            this.pc += 2
        }
    }

    fetchInstruction() {
        let upperInstruction = this.Memory.getAt(this.pc)
        let lowerInstruction = this.Memory.getAt(this.pc + 1)
        let fullInstruction = upperInstruction << 8 | lowerInstruction
        return fullInstruction
    }

    executeInstruction(opCode, mask = 0xF000){
        const operation = this.instructionSet.get(opCode & mask)
        operation(opCode);
    }
   
    //Not an official instruction, used to stop the execution loop
    stop(){
        this.pc=4097
    }
    //  00E0
    cls(instr){
        this.Screen.cls()
    }
    //  1NNN - Jump to Adress NNN
    jump(instr){
        if(this.getSubValue(instr, 1, 3) == this.pc) this.stop();
        else this.pc = this.getSubValue(instr, 1, 3);
    }
    //  6XYY - Set Register Vx to YY Value
    setRegisterV(instr){
        this.v[this.getSubValue(instr, 1)] = this.getSubValue(instr, 2, 2);
    }
    //  7XYY - Add to Register Vx YY Value
    addToRegisterV(instr){
        this.v[this.getSubValue(instr, 1)] += this.getSubValue(instr, 2, 2);
    }
    //  ANNN - Set The I register value to NNN
    setI(instr){
        this.i = this.getSubValue(instr, 1, 3);
    }
    //  DXYN - Write on Screen(X, Y) N byte in sprite form (8xN pixel matrix) starting to read at I index
    drawSprite(instr){
        let x = this.v[this.getSubValue(instr, 1)]
                let y = this.v[this.getSubValue(instr, 2)]
                let n = this.getSubValue(instr, 3)
                for (let offs = 0; offs < n; offs += 1) {
                    let byteToWrite = this.Memory.getAt(this.i + offs)
                    this.Screen.writeByte(x, y + offs, byteToWrite)
                }
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
}

export default Processor