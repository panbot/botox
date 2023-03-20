import { MethodAsApiManager } from '@/framework/api/method-as-api';
import { ParameterAsApiArgs } from '@/framework/api-arg/parameter-as-api-arg';
import { ApiArgOptions } from '@/framework/api-arg/types';
import { Constructor } from '@/lib/types';

class ApiOptions {
    constructor(
        public name: string,
    ) { }
}

const api = new MethodAsApiManager<{}, ApiOptions>(
    (target, property) => new ApiOptions(`${target.name}::${property.toString()}`),
);

const arg = new ParameterAsApiArgs<{}>();

const Api = api.createDecorator();
const Arg = arg.createDecorator();

class MyApi {

    @Api()
    doStuff(
        @Arg()
        a1: string,
    ) {

    }
}

console.log(api.findOptions(MyApi, 'doStuff'));
console.log(arg.findOptions(MyApi, 'doStuff', 0));
