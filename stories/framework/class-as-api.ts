import { ClassAsApiManager } from '@/framework/api/class-as-api';
import { Runnable } from '@/lib/runnable';

class ApiOptions {
    constructor(
        public name: string,
    ) { }
}

const manager = new ClassAsApiManager<Runnable, ApiOptions>(
    target => new ApiOptions(target.name),
);

const Api = manager.createDecorator();

@Api()
class MyApi implements Runnable{

    async run() {

    }
}

console.log(manager.getOptions(MyApi));
