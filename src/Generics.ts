// Generics make the code reusable

function  wrapInArray<T> (item:T):T[] {
    return [item]
}

wrapInArray("Hii generic passes the string")
wrapInArray(450)
wrapInArray({flavour:"Ginger"})

function pair<A,B>(a:A, b:B): [A,B]{
    return [a,b]
}

pair("Masala", "Chai")
pair("Masala Chai:",1)
pair("Chai",{flavour:"Ginger"})

interface Box<T>{
    content: T
}

const numberBox1:Box<String> ={content:"10"}
const numberBox2:Box<number> ={content:10}


// generics do support partial pick omit


interface ApiPromise<T> {
    status: number,
    data: T
}

const res: ApiPromise<{flavour:String}> ={
    status:200,
    data: {flavour:"masala"}
}