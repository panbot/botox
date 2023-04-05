import api from '@/framework/api'
import apiarg from '@/framework/api-arg';
import validatable from '@/framework/validatable';
import runnable, { Runnable, RunArgFactory } from '@/lib/runnable';
import di from '@/lib/dependency-injection';

class ApiOptions {

    id?: Symbol;

    doc?: string;

    constructor(
        public name: string,
    ) { }
}

const Validatable = validatable();

Validatable({
    parser: String,
    inputype: 'text',
})(String);

const Api = api<{}>().classAsApi(ctor => new ApiOptions(ctor.name));
const Arg = apiarg<{}>().propertyAsArg(type => Validatable.get(type));

const Container = di();

const { run, RunArg } = runnable(Container.get);

class MyService {

    constructor(
        public username: string,
        public password: string,
    ) {
        console.log(`MyService instantiated with ${username}, ${password}`);
    }

    authenticate(username: string, password: string) {
        console.log(`authenticating ${username}, ${password}`);
        return username == this.username && password == this.password;
    }

    static Factory = class implements RunArgFactory {

        private runnables = new WeakMap<any, MyService>();

        async produceRunArgFor(r: Runnable, username: string, password: string) {
            let service = new MyService(username, password);
            this.runnables.set(r, service);
            console.log(`MyService produced for ${r.constructor.name}`)
            return service;
        }

        async releaseRunArgFor(r: Runnable) {
            this.runnables.delete(r);
            console.log(`MyService released for ${r.constructor.name}`)
        }
    }
}

@Api()
    .doc('login')
    .id(Symbol.for('login'))
class Login implements Runnable {

    @Arg()
    username!: string;

    @Arg()
    password!: string;

    async run(
        @RunArg(MyService.Factory, 'botao', '123456') service: MyService,
    ) {
        if (service.authenticate(this.username, this.password)) {
            return 'ok';
        } else {
            return 'invalid username / password';
        }
    }
}

void async function() {

    try {
        let params: any = {
            username: 'botao',
            password: '123456',
        };
        let instance = Container.instantiate(Login);

        let args = Arg.getArgs(instance);

        for (let [ property, arg ] of args) {
            let validatable = arg.validatable;
            if (!validatable) throw new Error(`not validatable`, { cause: { property, arg } });
            instance[property] = arg.validatable?.validate(params[property])
        }

        console.log(await run(instance));
    } catch (e) {
        console.error(e);
    }


}()
