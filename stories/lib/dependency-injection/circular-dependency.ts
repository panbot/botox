import di from '@/lib/dependency-injection';

const container = di();

@container.service()
class A {
    @container.inject(() => B)
    b: TYPEOF_B;
}

@container.service()
class B {
    @container.inject()
    a: A;
}

@container.service(get => {
    console.log('C factory');

    let c = container.instantiate(C);
    return c;
})
class C {
    @container.inject(() => D)
    d: TYPEOF_D;
}

@container.service(get => {
    console.log('D factory');

    let d = container.instantiate(D);
    d.c = get(C);
    return d;
})
class D {
    c: C;
}

type TYPEOF_B = B;
type TYPEOF_D = D;

let a = container.get(A);
let b = container.get(B);

console.log(a, b);

// console.log(container.instantiate(C));
console.log(container.get(C));
