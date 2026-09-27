let subs: number|string = "1M"

// only three types can be used here pending success or error
let apiRequestStatus : "pending" | "success" | "error" =  "pending"

let airlineSeat : "aisle" | "window" | "middle" = "aisle"

airlineSeat="middle"

const orders = ["12", "13", "20", "50"]

let currentOrder : string|undefined

for (let order of orders){
    if(order === "28"){
        currentOrder = order
        break
    }
    currentOrder="11"
}
currentOrder="ane"

console.log(currentOrder);
