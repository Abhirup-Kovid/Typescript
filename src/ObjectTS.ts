// const chai = {
//     name:"Masala Chai",
//     price:"20",
//     isHot: true
// }


// {
//     name: string;
//     price: number;
//     isHot: boolean;
// }

let tea: {
    name:string;
    price: number;
    isHot:boolean
}

tea={
    name:"Ginger Tea",
    price:2,
    isHot:false
}

type Tea = {
    name: string;
    price: number;
    ingredients: string[];
}

const adrakChai: Tea={
    name: "AdrakChai",
    price:25,
    ingredients:["Ginger", "Tea Leaves"]
}

// Duck typing 
type Cup = {size: string};

let smallCup:Cup={size:"200ml"}

let bigCup = {size:"500ml", material:"Glass"}

smallCup=bigCup

type Brew = {brewTime : number}
const coffee = {brewTime: 5, beans: "Arabic"}
const chaiBrew : Brew = coffee 

type User = {
    username : string;
    password: string
}

const u: User = {
    username : "Abhi",
    password: "123"
}

//splitting out the data types
type Item = {name: string; quantity:number}
type Address = {street: string; pin:number}

type Order = {
    id: string;
    items:Item[];
    address: Address
}

type chai = {
    name: string;
    price: number;
    isHot:boolean
}


//In the partial method the objects can be passed as empty which might give errors
const updateChai = (updates: Partial<chai>) => {
    console.log("updating chai with ", updates);
    
}
updateChai({price: 25})
updateChai({})

type ChaiOrder = {
    name?: string;
    quantity? : number
}
// In the Required method the objects can not be passed as empty we need all the fields to filled up
const placeOrder =(order: Required<ChaiOrder>) => {
    console.log(order);
    
}
placeOrder({
    name: "Masala Chai",
    quantity: 2
})


//pick method
type Chai = {
    name: string;
    price: number;
    quantity: number;
    ingridients: string[];
    isHot: boolean
}
//pick method gives the option to select only those attributes which are required or on which we will be working on
type BasicChaiInfo = Pick<Chai, "name" | "price" >;

const chaiInfo : BasicChaiInfo={
    name: "Masala Chai",
    price: 30
}

// Omit Method

type ChaiNew = {
    name: string;
    price: number;
    quantity: number;
    secretIngridients: string[];
    isHot: boolean
}
//Omit Method allow us to ignore the thing we dont wna to revel or show and skip it which shows no error
type publicChai = Omit<Chai, "secretIngridients">