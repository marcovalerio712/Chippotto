var canvas = document.querySelector("#Screen")
var ctx = canvas.getContext("2d")
ctx.fillStyle = "#000"
ctx.fillRect(0, 0, canvas.width, canvas.height)


const loadRom = () => {
    fetch('./IgnoreForTest/chip8-roms-master/chip8-roms-master/programs/IBM Logo.ch8')
        .then((data) =>data.blob())
        .then((c) => c.arrayBuffer())
        .then((aB) => {
            code = new Uint8Array (aB)
            code.forEach(element => {
                console.log(Number(element).toString(16).padStart(2,"0"))
            });
        })
} 

document.querySelector('#LoadRomBTN').addEventListener('click',loadRom)