import di from '@/dependency-injection';
const container = di();

class Service {}

class MyClass {
    // @container.inject()
    static service: Service;
}

console.log(MyClass.service instanceof Service);
