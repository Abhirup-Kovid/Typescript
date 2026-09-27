type chaiOrder ={
    type: string;
    sugar: number;
    strong: boolean;
};



function makeChai(order: chaiOrder)
{
    console.log(order);
    
}

function serverChai(order: chaiOrder )
{
    console.log(order);
    
}

type TeaRecipe = {
    water: number;
    milk: number;
}

class MasalaChai implements TeaRecipe{
    water = 50;
    milk = 100;
}


interface Cupsize {
     size : "small" | "large"
    }
class Chai implements Cupsize{
    size: "small" | "large" ="large";   
}

// type Response ={ok:true} | {ok:false}

// class myRes implements Response{
//     ok:boolean=true
// }

type TeaType = "masala" | "ginger" | "lemon"

function orderChai(t: TeaType){
    console.log(t);
}


type BaseChai = {teaLeaves : number}
type Extra = {masala: number}

type Masala = BaseChai & Extra
const cup: Masala={
    teaLeaves :2,
    masala: 1
    
}

type User = {
    username: string;
    bio?:string

}

const u1:User={username:"Abhirup"}
const u2:User={username:"Abhirup",bio:"Abhirup.com"}

type Config =  {
    readonly appName: string;
    version:number 
}

const cfg: Config = {
    appName:"Master",
    version: 1
}

//cant be changed due to readonly
// cfg.appName="heroboy"