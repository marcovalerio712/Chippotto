class KeyBoard{

    constructor(btnList){
        this.buffer = new Array(16).fill(false)
        this.lastPressedButton = null
        console.log(btnList)

        btnList.forEach(element => {
            let elementValue = parseInt(element.innerHTML, 16)
            element.onpointerdown = () => {
                this.lastPressedButton = elementValue
                this.buffer[elementValue] = true
                console.log(element.innerHTML + " down")
            }
            element.onpointerup = ()=> {
                this.buffer[elementValue] = false
                console.log(element.innerHTML + " up")
            }
            
        });
        
    }  

}

export default KeyBoard;