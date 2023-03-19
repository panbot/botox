import di from 'lib/dependency-injection';
const Container = di();

class Service {}

class MyClass {
    @Container.Inject()
    static service: Service;
}

console.log(MyClass.service instanceof Service);
