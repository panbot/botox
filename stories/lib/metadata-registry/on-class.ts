import metadataRegistry from "@/lib/metadata-registry";

class Data {
    constructor(
        public value: any,
    ) { }
}

let getRegistry = metadataRegistry<Data>()('class');

class Base {}
class Sub extends Base {}

getRegistry(Base).set(new Data('base'));
console.log(getRegistry(Base).get());
console.log(getRegistry(Base).getOwn());
console.log(getRegistry(Sub).get());
console.log(getRegistry(Sub).getOwn());

let base = new Base();
console.log(getRegistry(base).get());
console.log(getRegistry(base).getOwn());

let sub = new Sub();
console.log(getRegistry(sub).get());
console.log(getRegistry(sub).getOwn());
