import factory from '@/framework/api-arg';

const Arg = factory<{}>().parameterAsArg()

class MyApi {

    doSth(

        @Arg()
        arg1: string,

        @Arg()
        arg2: Date,
    ) {}
}

let instance = new MyApi()
console.log(Arg.getRegistry(instance, 'doSth').get());
console.log(Arg.getRegistry(instance, '').properties.trace());
