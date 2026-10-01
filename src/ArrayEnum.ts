

const chaiFlavour: string[] = ["Masala", "Adrak"]
const chaiPrice: number[]=[10, 20]

const rating: Array<number>=[4.5, 5.0]

type Chai = {
    name:string;
    price: number
}

const menu:Chai[] =[
    {name: "masala", price:12},
    {name:"Adrak", price:23}
]
menu.push({name:"Ginger", price:20})

const cities: readonly string[]= ["Dhanbad", "BBSR"]
// cities.push() //not available here

//nested array
const table: number[] []=[
    [1,2,3],
    [4.5,6]
]


// tuples
let chaiTuple: [string, number];
chaiTuple = ["Masala", 20]

let userInfo: [string, number, boolean?]
userInfo=["Abhirup", 100]
userInfo=["Abhirup", 100,true] //boolean is made optional by using ?

//readOnly Tuples
const location: readonly[number, number]=[23,32]

const chaiItems: [name:String, price:number]= ["Masala", 25]



//ENUMS
enum CupSize{
    SMALL, MEDIUM, LARGE
}

const size = CupSize.LARGE

enum Status{
    PENDING = 100,
    SERVED, //101 AUTOMATICALLY
    CANCELLED //102
}

enum ChaiType{
    MASALA = "masala",
    GINGER = "ginger",
}

function makeChai (type:ChaiType){
    console.log(`Making: ${type}`);
}
makeChai(ChaiType.MASALA)


enum RandomEnum{
    ID=1,
    NAME="Chai"

}

const enum Sugar {
    LOW = 1,
    MEDIUM = 2,
    HIGH = 3
}

let t : [string, number]=["chai",10]
// this showes sometimes unexpected behaviour
t.push("extra")