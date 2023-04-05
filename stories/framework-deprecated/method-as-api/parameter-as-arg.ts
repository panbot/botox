import apiarg from '@/framework/api-arg';
import api from '@/framework/api'

export class ApiOptions {
    constructor(
        public name: string,
    ) { }
}

const Api = api<{}>().methodAsApi(ctor => new ApiOptions(ctor.constructor.name))

const Arg = apiarg<{}>().parameterAsArg(() => undefined)

class MyApi {

    @Api().name('api1')
    doSth(

        @Arg()
        arg1: string,

        @Arg()
        arg2: Date,
    ) {}
}

let instance = new MyApi();
console.log(Api.getRegistry(instance, 'doSth').get());
console.log(Arg.getRegistry(instance, 'doSth').get());
console.log(Arg.getRegistry(instance, '').properties.trace());
