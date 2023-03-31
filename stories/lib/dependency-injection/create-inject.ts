import di from '@/lib/dependency-injection';

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

const InjectParam = (
    retrieve: (p: AppParameters) => any,
) => container.create_inject(
    get => retrieve(get(token))
);

const t = InjectParam(p => p.env);

class Service {

    @InjectParam(p => p.env)
    env!: string;

    doSth(t: string) {
        console.log(this.env, 'service doing something', t);
    }
}

container.instantiate(Service).doSth('hello world');

