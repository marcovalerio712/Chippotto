import Memory from "./Memory.js";

class Chippotto{
    constructor(Screen, LoadRom){

        this.Screen = Screen
       
        this.Rom = LoadRom  
        this.Rom.addEventListener("click", startRom())
        
        
        this.Memory = Memory()

    }
    startRom(){
        fetch('./IgnoreForTest/chip8-roms-master/chip8-roms-master/programs/IBM Logo.ch8')
        .then((data) =>data.blob())
        .then((c) => c.arrayBuffer())
        .then((aB) => {
            code = new Uint8Array (aB)
            console.log(code)
        })
    }
}

export default Chippotto
