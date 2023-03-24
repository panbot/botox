import decorator from "@/lib/decorator";
import expandify from "@/lib/expandify";

type Position = {
    target: Object,
    index: number,
    ctor: any,
};
const Param = expandify(decorator.create_parameter_decorator(
    (target, property, index) => ({
        target,
        index,
        ctor: Reflect.getMetadata('design:paramtypes', target, property)[index],
    } as Position)
))[expandify.expand](d => ({

    get(target: any, property: any) {
        return d.get_registry(target, property).get();
    }
}))

class MyClass {
    constructor(
        @Param()
        public a: string,
    ) {

    }

    method1(
        @Param()
        a: number,
    ) {

    }
}

console.log(Param.get(MyClass, undefined));
console.log(Param.get(MyClass, 'method1'));

let instance = new MyClass('a');
console.log(Param.get(instance, undefined));
console.log(Param.get(instance, 'method1'));

