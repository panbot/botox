import di from 'lib/dependency-injection';

const Container = di();
const {
    Inject,
    createInject,
} = Container;

type AppParameters = {
    env: string,
}
let token = Container.token<AppParameters>('app parameters');
Container.set(
    token,
    {
        env: 'dev',
    }
)

const InjectParam = (
    retrieve: (p: AppParameters) => any,
) => createInject(
    get => retrieve(get(token))
);

class Service {

    @InjectParam(p => p.env)
    env!: string;

    doSth(t: string) {
        console.log(this.env, 'doing something', t);
    }
}

class MyClass {
    @Inject()
    service!: Service;

    constructor(
        @Inject()
        public anotherService: Service,
    ) { }

    @Inject()
    static staticService: Service;
}

let myObj = Container.instantiate(MyClass);
myObj.service.doSth('1');
myObj.anotherService.doSth('2');
MyClass.staticService.doSth('static stuff');

let myObj2 = Container.instantiate(MyClass);
console.assert(myObj !== myObj2, 'myObj !== myObj2');

let myObj3 = Container.get(MyClass);
console.assert(myObj3 !== myObj, 'myObj3 !== myObj');

let myObj4 = Container.get(MyClass);
console.assert(myObj4 === myObj3, 'myObj3 === myObj3');

class FailedInjection {
    constructor(
        @Inject()
        str: Function,
    ) { }
}

try {
    Container.instantiate(FailedInjection);
} catch (e) {
    console.error(e);
}