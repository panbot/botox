import factory from '@/framework/api-arg';

const Arg = factory<{}>().propertyAsArg(() => undefined)

class MyApi {

    @Arg()
        .doc('some arg')
        .default('abcd')
        .optional(true)
        .priority(100)
    arg1!: string;
}

let instance = new MyApi()
console.log(Arg.getRegistry(instance, 'arg1').get());
console.log(Arg.getRegistry(instance, 'arg2').get());
console.log(Arg.getRegistry(instance, '').properties.trace().flat());
Arg.getRegistry(instance, '').forEachProperty(
    (p, get) => console.log(p, get())
)
