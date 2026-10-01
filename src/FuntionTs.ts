function makeChai(type: string, cups: number){
    console.log(`Making ${cups} Chai`);
    
}
makeChai("Masala", 2)

function getchaiPrice():number{
    return 25;
}

function makeOrder(order:string) 
{
    if(!order) return null;
    return order;
}

// Logger function no return 
function logChai(): void {
    console.log("Chai is ready");
}

function orderChai(type? : string){

}

//default function
function orderChai2(type: string="Masala"){

}

function createChai(order: {
    type: string;
    sugar: number;
    size: "small" | "large"
}) : number{
    return 4
}