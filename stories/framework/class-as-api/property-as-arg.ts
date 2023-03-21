import factory from '@/framework/api-arg';

const Arg = factory<{}>().propertyAsArg()

class MyApi {

    @Arg()
        .doc('some arg')
        .default('abcd')
        .optional(true)
        .priority(100)
        .validator((v: string) => v.length < 100 ? undefined : 'too long')
    arg1!: string;
}

let instance = new MyApi()
console.log(Arg.getRegistry(instance, 'arg1').get());
console.log(Arg.getRegistry(instance, '').properties.trace());
