import Memory from "./Memory.js";
import Screen from "./Screen.js";

class Processor {
    constructor(Memory, Screen, keyBoard) {
        this.Memory = Memory
        this.Screen = Screen
        this.keyBoard = keyBoard
        this.Stack = new Uint16Array(32)
        
        this.v = new Uint8Array(16)
        this.i = 0
        this.pc = 0x200
        this.sp = 0

        this.dt = 0
        this.st = 0

        this.setupInstructionSet()
    }

    pushToStack(val){
        this.Stack[this.sp] = val
        this.sp++;
    }

    popFromStack(){
        this.sp--;
        return this.Stack[this.sp]
    }

    //This method initializes the structure that maps the opcodes to the class methods that implement them
    setupInstructionSet(){
        this.instructionSet = new Map();
        
        //These cases map 1 on 1 on instructions of the processor, implemented by dedicated methods
        this.instructionSet.set(0x00E0, (opCode) => this.cls(opCode));
        this.instructionSet.set(0x00EE, (opCode) => this.ret(opCode));
        this.instructionSet.set(0x1000, (opCode) => this.jump(opCode));
        this.instructionSet.set(0x2000, (opCode) => this.call(opCode));
        this.instructionSet.set(0x3000, (opCode) => this.skipIfEqualConst(opCode));
        this.instructionSet.set(0x4000, (opCode) => this.skipIfNotEqualConst(opCode));
        this.instructionSet.set(0x5000, (opCode) => this.skipIfEqual(opCode));
        this.instructionSet.set(0x6000, (opCode) => this.setRegisterV(opCode));
        this.instructionSet.set(0x7000, (opCode) => this.addToRegisterV(opCode));
        this.instructionSet.set(0x8001, (opCode) => this.setRegisterV(opCode));
        this.instructionSet.set(0x8002, (opCode) => this.orRegisters(opCode));
        this.instructionSet.set(0x8003, (opCode) => this.andRegisterV(opCode));
        this.instructionSet.set(0x8004, (opCode) => this.xorRegisterV(opCode));
        this.instructionSet.set(0x8005, (opCode) => this.addRegisters(opCode));
        this.instructionSet.set(0x8006, (opCode) => this.diffRegisters(opCode));
        this.instructionSet.set(0x8007, (opCode) => this.shiftRight(opCode));
        this.instructionSet.set(0x8008, (opCode) => this.diffRegisters2(opCode));
        this.instructionSet.set(0x800F, (opCode) => this.shiftLeft(opCode));
        this.instructionSet.set(0x9000, (opCode) => this.skipIfNotEqual(opCode));
        this.instructionSet.set(0xA000, (opCode) => this.setI(opCode));
        this.instructionSet.set(0xB000, (opCode) => this.jumpPlusRegister(opCode));
        this.instructionSet.set(0xC000, (opCode) => this.random(opCode));
        this.instructionSet.set(0xD000, (opCode) => this.drawSprite(opCode));

        //TODO Input Instructions
        this.instructionSet.set(0XE09E, (opCode) => this.skipIfPressed(opCode));
        this.instructionSet.set(0XE0A1, (opCode) => this.skipIfNotPressed(opCode));

        this.instructionSet.set(0XF007, (opCode) => this.setRegisterToDelay(opCode));
        this.instructionSet.set(0XF00A, (opCode) => this.waitForButton(opCode));
        this.instructionSet.set(0XF015, (opCode) => this.setDelayToRegister(opCode));
        this.instructionSet.set(0XF018, (opCode) => this.setSoundToRegister(opCode));

        this.instructionSet.set(0xF01E, (opCode) => this.addRegisterToI(opCode));
        this.instructionSet.set(0xF029, (opCode) => this.setIToFontLocation(opCode));
        this.instructionSet.set(0xF033, (opCode) => this.bcdOfRegister(opCode));
        this.instructionSet.set(0xF055, (opCode) => this.storeRegisters(opCode));
        this.instructionSet.set(0xF065, (opCode) => this.loadRegisters(opCode));

        //Put the ambiguous cases here
        this.instructionSet.set(0x0000, (opCode) => this.executeInstruction(opCode, 0xF0FF));
        this.instructionSet.set(0x8000, (opCode) => this.executeInstruction(opCode + 1, 0xF00F));
        this.instructionSet.set(0xE000, (opCode) => this.executeInstruction(opCode, 0XF0FF))
        this.instructionSet.set(0xF000, (opCode) => this.executeInstruction(opCode, 0xF0FF));
    }

    run() {
        setInterval(decreaseTimers, 1000/60);
        while (this.pc < 4096) {
            this.runStep()
        }
    }

    runStep(){
        let instruction = this.fetchInstruction()
        console.log("----------------------")
            console.log("opcode: " + instruction.toString(16).padStart(2, '0'))
            console.log("I: " + this.i)
            console.log("pc: " + this.pc)
            console.log("registers: ", this.v)
            console.log("sp: " + this.sp)
            console.log("stack: " + this.Stack)
        this.executeInstruction(instruction)
        this.pc += 2
    }

    //This method reads the next 2 byte to PC and combine them into a single 16 bit word representing the opcode
    fetchInstruction() {
        let upperInstruction = this.Memory.getAt(this.pc)
        let lowerInstruction = this.Memory.getAt(this.pc + 1)
        let fullInstruction = upperInstruction << 8 | lowerInstruction
        return fullInstruction
    }

    //This method retrieves the correct function from the hash-map given the opcode, and executes it
    executeInstruction(opCode, mask = 0xF000){
        const operation = this.instructionSet.get(opCode & mask)
        console.log(operation)
        operation(opCode);
    }

    decreaseTimers(){
        if(this.st > 0)
            this.st--;
        if(this.dt > 0)
            this.dt--;
    }
   
    //Not an official instruction, used to stop the execution loop
    stop(){
        this.pc=4097
    }

    //Listed below there are all the instructions implemented by the chip-8 processor

    //  00E0 - Clears the screen
    cls(instr){
        this.Screen.cls()
    }

    ret(instr){
        this.pc = this.popFromStack() - 2;
    }

    
    //  1NNN - Jump to Adress NNN
    jump(instr){
        if(this.getSubValue(instr, 1, 3) == this.pc) this.stop();
        else this.pc = this.getSubValue(instr, 1, 3);
        this.pc = this.pc - 2;
    }
    //  2NNN - Call Subroutine
    call(instr){
        let address = this.getSubValue(instr, 1, 3);
        this.pushToStack(this.pc)
        this.pc = address - 2;
    }
    //  3XKK - Skip Next Instruction if Vx = KK
    skipIfEqualConst(instr){
        if(this.v[this.getSubValue(instr, 1)] == this.getSubValue(instr, 2, 2)){
            this.pc = this.pc + 2;
        }
    }
    //  4XKK - Skip Next Instruction if Vx != KK
    skipIfNotEqualConst(instr){
        if(this.v[this.getSubValue(instr, 1)] != this.getSubValue(instr, 2, 2)){
            this.pc = this.pc + 2;
        }
    }
    //  5XY0 - Skip Next Instruction if Vx = Vy
    skipIfEqual(instr){
        if(this.v[this.getSubValue(instr, 1)] == this.v[this.getSubValue(instr, 2)]){
            this.pc = this.pc + 2;
        }
    }
    //  6XYY - Set Register Vx to YY Value
    setRegisterV(instr){
        this.v[this.getSubValue(instr, 1)] = this.getSubValue(instr, 2, 2);
    }
    //  7XYY - Add to Register Vx YY Value
    addToRegisterV(instr){
        this.v[this.getSubValue(instr, 1)] += this.getSubValue(instr, 2, 2);
    }

    //  8XY0 - Vx = Vy
    assignRegister(instr){
        this.v[this.getSubValue(instr, 1)] = this.v[this.getSubValue(instr, 2)];
    }

    //  8XY1 - Vx = Vx | Vy
    orRegisters(instr){
        let orValue = this.v[this.getSubValue(instr, 1)] | this.v[this.getSubValue(instr, 2)]
        this.v[this.getSubValue(instr, 1)] = orValue
    }

    //  8XY2 - Vx = Vx & Vy
    andRegisters(instr){
        let andValue = this.v[this.getSubValue(instr, 1)] & this.v[this.getSubValue(instr, 2)]
        this.v[this.getSubValue(instr, 1)] = andValue
    }

    //  8XY3 - Vx = Vx ^ Vy
    xorRegisters(instr){
        let xorValue = this.v[this.getSubValue(instr, 1)] ^ this.v[this.getSubValue(instr, 2)]
        this.v[this.getSubValue(instr, 1)] = xorValue
    }

    //  8XY4 - Vx = Vx + Vy
    addRegisters(instr){
        let sumValue = this.v[this.getSubValue(instr, 1)] + this.v[this.getSubValue(instr, 2)]
        this.v[this.getSubValue(instr, 1)] = sumValue
        this.v[0xF] = sumValue > 255 ? 1 : 0
    }

    //  8XY5 - Vx = Vx - Vy
    diffRegisters(instr){
        let diffValue = this.v[this.getSubValue(instr, 1)] - this.v[this.getSubValue(instr, 2)]
        this.v[this.getSubValue(instr, 1)] = diffValue
        this.v[0xF] = diffValue > 0 ? 1 : 0
    }

    //  8XY6 - Vx = Vy = Vy >> 1
    shiftRight(instr){
        this.v[0xF] = this.v[this.getSubValue(instr, 2)] & 1
        this.v[this.getSubValue(instr, 2)] = this.v[this.getSubValue(instr, 2)] >> 1
        this.v[this.getSubValue(instr, 1)] = this.v[this.getSubValue(instr, 2)]
    }

    //  8XY7 - Vx = Vy - Vx
    diffRegisters2(instr){
        let diffValue = this.v[this.getSubValue(instr, 2)] - this.v[this.getSubValue(instr, 1)]
        this.v[this.getSubValue(instr, 1)] = diffValue
        this.v[0xF] = diffValue > 0 ? 1 : 0
    }

    //  8XYE - Vx = Vy = Vy << 1
    shiftLeft(instr){
        this.v[0xF] = (this.v[this.getSubValue(instr, 2)] & 0x80) >> 7
        this.v[this.getSubValue(instr, 2)] = this.v[this.getSubValue(instr, 2)] << 1
        this.v[this.getSubValue(instr, 1)] = this.v[this.getSubValue(instr, 2)]
    }

    //  9XY0 - Skip Next Instruction if Vx = Vy
    skipIfNotEqual(instr){
        if(this.v[this.getSubValue(instr, 1)] != this.v[this.getSubValue(instr, 2)]){
            this.pc = this.pc + 2
        }
    }

    //  ANNN - Set The I register value to NNN
    setI(instr){
        this.i = this.getSubValue(instr, 1, 3);
    }

    //  BNNN - Jump to NNN + V0
    jumpPlusRegister(instr){
        let address = this.getSubValue(instr, 1, 3) + this.v[0]
        if(address == this.pc) this.stop();
        else this.pc = address
        this.pc = this.pc - 2;
    }

    //  CXKK - Vx = (Random Byte) & KK
    random(instr){
        let random = Math.floor(Math.random() * 256)
        this.v[this.getSubValue(instr, 1)] = random & this.getSubValue(instr, 2, 2)
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

    //  EX9E - Skip next instruction if Key VX is Pressed
    skipIfPressed(instr){
        if(this.keyBoard.buffer[this.v[this.getSubValue(instr, 1, 1)]])
            pc = pc + 2
    }

    //  EXA1 - Skip next instruction if Key VX is not Pressed
    skipIfNotPressed(instr){
        if(!this.keyBoard.buffer[this.v[this.getSubValue(instr, 1, 1)]])
            pc = pc + 2
    }

    //  FX07 - Put value of DT in VX
    setRegisterToDelay(instr){
        this.v[this.getSubValue(instr, 1, 1)] = this.dt
    }

    //  FX0A - Wait for input K and put in X
    waitForButton(instr)
    {
        while(true){
            this.keyBoard.buffer.forEach(element => {
                if(element){
                    this.v[this.getSubValue(instr, 1, 1)] = this.keyBoard.lastPressedButton
                    return;
                }
            });
        }
    } 

    //  FX15 - Put value of VX in DT
    setDelayToRegister(instr){
        this.dt = this.v[this.getSubValue(instr, 1, 1)]
    }

    //  FX18 - Put value of VX in ST
    setSoundToRegister(instr){
        this.st = this.v[this.getSubValue(instr, 1, 1)]
    }

    //  FX1E - I = I + Vx
    addRegisterToI(instr){
        this.i += this.getSubValue(instr, 1, 1);
    }

    //  FX29 - I = Vx * 5 (Set I Location To Default System Sprite)
    setIToFontLocation(instr){
        this.i = this.getSubValue(instr, 1, 1) * 5;
    }

    //  FX33 - Stores The BCD representation of Vx in I, I+1, I+2
    bcdOfRegister(instr){
        let value = this.getSubValue(instr, 1, 1);
        let hundreds = Math.floor(value / 100)
        value -= hundreds * 100
        let tens = Math.floor(value / 10)
        value -= tens * 10
        this.Memory.setAt(this.i, hundreds)
        this.Memory.setAt(this.i+1, tens)
        this.Memory.setAt(this.i+2, value)
    }

    //  FX55 - Store V0 : Vx registers in Memory starting at address I, then I = I + X + 1
    storeRegisters(instr){
        let lastRegister = this.getSubValue(instr, 1)
        for(let offs = 0; offs <= lastRegister; offs++){
            this.Memory.setAt(this.i + offs, this.v[offs])
        }
        this.i += lastRegister + 1
    }

    //  FX65 - read from memory starting at I and load in V0 : VX, then I = I + X + 1
    loadRegisters(instr){
        let lastRegister = this.getSubValue(instr, 1)
        for(let offs = 0; offs <= lastRegister; offs++){
            this.v[offs] = this.Memory.getAt(this.i + offs)
        }
        this.i += lastRegister + 1
    }

    //END OF Instruction Set ---------

    //This method returns a numeric value of (4 * dimension) bits representing 
    //a subset of sequential bits of the given instruction.
    //The subset starts at the (hexDigit * 4) bit 
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