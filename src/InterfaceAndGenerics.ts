interface Chai{
    flavour: string
    price: number
    milk?: boolean
}
interface Shop{
    readonly id:number
    readonly name: string
}



const masala: Chai={
    flavour: "Masala",
    price: 30
}

const s: Shop = {
    id:1,
    name:"HardCodedCoffee"
}

interface DiscountCalculator{
    (price:number): number
}
const apply50: DiscountCalculator=(p)=>p*0.5

interface TeaMachine{
    start(): void;
    stop(): void
}

const machine: TeaMachine={
    start(){
        console.log("Start");
    },
    stop(){
        console.log("Stop");
    }
}


interface ChaiRatings{
    [flavour: string]: number
}

const ratings: ChaiRatings={
    masala: 4.5,
    ginger:4
}

interface User {
    name: string
}

interface User{
    age:number
}

const u: User={
    name:"Abhi",
    age:20
}

interface A{a:string}
interface B{b:string}
interface C extends A,B {}


