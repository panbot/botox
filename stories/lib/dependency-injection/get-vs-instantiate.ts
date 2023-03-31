import di from '@/lib/dependency-injection';

const container = di();

class Service {
}


let s1 = container.instantiate(Service);
let s2 = container.instantiate(Service);
console.assert(s2 !== s1, 's2 !== s1');

let s3 = container.get(Service);
console.assert(s3 !== s1, 's3 !== s1');
console.assert(s3 !== s2, 's3 !== s2');

let s4 = container.get(Service);
console.assert(s4 === s3, 's4 === s3');
