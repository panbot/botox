import factory from '@/framework/api-arg';

const Arg = factory<{}>().propertyAsArg()

class MyApi {

    @Arg()
    arg1!: string;
}

let instance = new MyApi()
console.log(Arg.getRegistry(instance, 'arg1').get());
console.log(Arg.getRegistry(instance, '').properties.trace());
