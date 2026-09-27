// The `this` parameter: a declaration that `this` has a type. It is erased,
// so it costs nothing at runtime.

interface Repo {
  name: string
  commit(message: string): void
}

function describeRepo(this: Repo): string {
  // `this` is `Repo` here, so this.name and this.commit are checked.
  return `${this.name} can commit`
}

const repo: Repo = {
  name: "Typescript",
  commit(message: string) {
    console.log(this.name, message)
  },
}

// describeRepo()          //  TS2684: 'this' context of type 'void' is not
//                           //  assignable to method's 'this' of type 'Repo'.
// describeRepo.call(repo)  // ok
// const detached = describeRepo; detached()  //  TS2684 again. This is the
//                                             //  point: it catches the
//                                             //  "lost receiver" bug.

// Why bother, given `this` is `any` by default?
//  1. It documents the contract. A reader knows what receiver is required
//     without reading the body.
//  2. It turns "silently wrong" into a compile error. Without it, a detached
//     method usually throws `Cannot read properties of undefined` at runtime,
//     or worse, works by accident because of closure capture.
//  3. It composes with interface methods, where the receiver type is already
//     known and repeating it is free.

repo.commit("initial")
console.log(describeRepo.call(repo))

// ---------------------------------------------------------------------------
// How it relates to the interface method
// ---------------------------------------------------------------------------
// `commit(message: string): void` on the interface has an *implicit* `this`
// parameter of type `Repo`. Writing it out is identical and never changes the
// type:
//
//   commit(this: Repo, message: string): void
//
// The explicit form only earns its place on a standalone function, or where
// you want a narrower receiver than the interface declares - for example a
// function that only needs one field off the receiver.
function repoName(this: { name: string }): string {
  return this.name
}
console.log(repoName.call({ name: "Typescript" }))

// ---------------------------------------------------------------------------
// With arrow functions, `this` is lexical and the parameter is meaningless
// ---------------------------------------------------------------------------
const arrowDescribe = (): string => `no this: ${typeof globalThis}`
// There is no `this` to type, and you cannot write one. Arrow functions do not
// get their own `this`, so the parameter would have no effect.

// ---------------------------------------------------------------------------
// `noImplicitThis`
// ---------------------------------------------------------------------------
// Part of `strict`. With it off, `this` in a plain function declaration is
// `any`, which is how you get a function that appears to work in one call site
// and throws in another. With it on, an untyped `this` is an error, and the
// `this` parameter is the fix.
//
// Compare:
//   function loose() { return this.name }        // this: any, no error
//   function strict(this: Repo) { return this.name }  // this: Repo, checked
//
// The looseness is not free at runtime either - it is `any` because the
// compiler genuinely cannot know who will call it.

console.log(arrowDescribe(), repoName.call(repo))
export { describeRepo, repoName, arrowDescribe }
export type { Repo }
