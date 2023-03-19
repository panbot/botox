import di from 'lib/dependency-injection';

const Container = di();

class Service {
}


let s1 = Container.instantiate(Service);
let s2 = Container.instantiate(Service);
console.assert(s2 !== s1, 's2 !== s1');

let s3 = Container.get(Service);
console.assert(s3 !== s1, 's3 !== s1');
console.assert(s3 !== s2, 's3 !== s2');

let s4 = Container.get(Service);
console.assert(s4 === s3, 's4 === s3');
