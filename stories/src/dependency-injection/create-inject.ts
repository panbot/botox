import di from '@/dependency-injection';

const container = di();

type AppParameters = {
    env: string,
}
let token = container.create_token<AppParameters>('app parameters');
container.set(
    token,
    {
        env: 'dev',
    }
)

const inject_param = <T, P extends di.P_EXTENDS<T>, I extends di.I_EXTENDS<P>>(
    retrieve: (p: AppParameters) => di.TYPE<T, P, I>,
) => container.create_inject<T, P, I>(get => retrieve(get(token)))

class Service {

    @inject_param(p => p.env)
    env: string;

    //@ts-expect-error
    @inject_param(p => p.env)
    num: number;

    doSth(t: string) {
        console.log(this.env, 'service doing something', t);
    }
}

container.instantiate(Service).doSth('hello world');

