class Chai{
    flavour: string;
    price:number

//     constructor(flavour: string, price: number){
//         this.flavour=flavour
//         this.price=price
//     }

    constructor(flavour: string){
        this.flavour=flavour
        console.log(this);
        
    }
}

const masalaChai = new Chai("Adrak", 20)
masalaChai.flavour="masala"

class Chai {
    public flavour : string="Masala"

    private secretIngredients="Cardamon"

    revel(){
        return this.secretIngredients
    }

    protected shopName="ChaiStore"
}

class Wallet{
    //other way to denote the private using hash#
    #balance=100

    getBalance(){
        return this.#balance
    }
}

const w = new Wallet()
w.getBalance

class Cup{
    readonly capacity: number= 200

    constructor(capacity: number){
        this.capacity=capacity
    }
}

class ModernChai{
    private _sugar=2

    get sugar(){
        return this._sugar
    }
    set sugar(value:number){
        if(value>5) throw new Error("Too Sweet")
            this._sugar=value
    }
}

const c = new ModernChai()
c.sugar=3

class EkChai{
    static shopName = "Chaicode caffe"
    constructor(public flavour:string){

    }

}
console.log(EkChai.shopName);


abstract class Drink{
    abstract make(): void
}
class MyChai extends Drink{
    make(){
        console.log("Brewing chai");
    } 
}

//composition
class Heater{
    heat(){}
}

class ChaiMaker{
    constructor(private heater: Heater){}

    make(){
        this.heater.heat
    }
}