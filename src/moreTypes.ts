let response : any = '42'

let numericaLength:number= (response as string).length

type Book = {
    name:string,

}

let BookString='{"name:"Art of Laziness}'

let bookObject=JSON.parse(BookString) as Book // writing as Book means forcefully telling that the type is Book only 

console.log(bookObject);


const inputElements = document.getElementById("username") as HTMLInputElement


let value :any
value = "Abhi"
value=21
value=2.5
value.toUpperCase()

let newValue: unknown

newValue="Abhi"
newValue=[1,2,3]
newValue=2.3
// newValue.toUpperCase
//this gives error so add a guardrail
if(typeof newValue === "string"){
    newValue.toUpperCase
}

try {
    
} catch (error:any) {
    if(error instanceof Error){
        console.log(error.message);
    }
    console.log("Error ", error);
}

const data:unknown = "Chai aur code"

const strData: string=data as string
type Role  = 'admin' | 'user' | 'superadmin'

function redirectBasedOnRole(role: Role):void{
    if(role === 'admin'){
        console.log("Redirecting to admin dashboard")
        return;
    }
    if(role === 'user'){
        console.log("Redirecting to user dashboard")
        return;
    }

    ///this will give type never as we have no more guardrails to check and also when we have one more role then it gives the unchecked role
    role;
}


// functions that never stops runs infinity times
function neverReturn():never{
    while(true){

    }
}