class KeyBoard{

    constructor(btnList){
        this.buffer = []
        console.log(btnList)

        btnList.forEach(element => {
            element.addEventListener('click', ()=>{
                console.log(element.innerHTML)
            })
        });
    }

}

export default KeyBoard;