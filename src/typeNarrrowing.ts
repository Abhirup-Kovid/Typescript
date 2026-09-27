function getOrders(kind: string | number){
    if(typeof kind === 'string'){
        return `Order in Process ${kind}`
    }
    return `Order ${kind}`
}

function serveOrder(msg ? : string){
    if(msg){
        return `Serving ${msg}`
    }
    return `Serving Default`
}

function orderCake(size: "small"| "medium" | "Large" ){
    if(size==="medium"){
        return `Serving ${size}`
    }
    if(size==="small"){
        return `Serving ${size}`
    }
    return `Serving ${size}`
}

class Restaurant1{
    serve(){
        return `Serving The Order1`
    }

}
class Restaurant2{
    serve(){
        return `Serving The Order2`
    }

}

function serve(Order: Restaurant1 | Restaurant2){
    if(Order instanceof Restaurant1){
        return Order.serve();
    }
}

type OrderServe = {
    type: string
    sugar: number
}

function isOrderServed(obj:any) :obj is OrderServe{
    return (
        typeof obj === "object" && obj !==null && 
        typeof obj.type === "string"&&
        typeof obj.sugar=== "number"

    )
}

function servedOrder(item: Restaurant1 | string){
    if(isOrderServed(item)){
        return `Serving the Order ${item.type}`
    }
    return `Serving custom order`
}

type MasalaChai = {type: "masala"; spicelevel: number};
type GingerChai = {type: "ginger"; amount: number};
type elaichiChai = {type: "elaichi"; aroma: number};


type chai=MasalaChai | GingerChai | elaichiChai

function makeChai(order: chai){

    switch (order.type) {
        case "masala":
            return `Masala Chai`
            break;
        case "elaichi":
            return `Elaichi Chai`
            break;
        case "ginger":
            return `Ginger Chai`
            break;
    
        default:
            break;
}
}

function brew(order: MasalaChai | GingerChai){
    if("spicelevel" in order){
        return "Spiced Chai"
    }
}

// jab value aa rhi h tb unknown h but jb bahar ja rhi h tb string hi hogi
// function isStringArray(arr: unknown): arr is string[]{
//     return `Watch`
// }