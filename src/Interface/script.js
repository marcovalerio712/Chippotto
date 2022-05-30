import Chippotto from "../Emulator/Chippotto.js";
import KeyBoard from "../Emulator/Keyboard.js";

const keyBoard = new KeyBoard(document.querySelectorAll('.keyboardButton'))

const Emulator = new Chippotto(
    document.querySelector("#Screen"), 
    keyBoard, 
    document.querySelector('#LoadRomBTN'),
    document.querySelector('#nextOp'))

