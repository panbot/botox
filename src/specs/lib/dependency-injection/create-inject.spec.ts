import di from 'lib/dependency-injection';

const Container = di();

type AppParameters = {
    env: string,
}
let token = Container.token<AppParameters>('app parameters');
Container.set(
    token,
    {
        env: 'dev',
    }
)

const InjectParam = (
    retrieve: (p: AppParameters) => any,
) => Container.createInject(
    get => retrieve(get(token))
);

class Service {

    @InjectParam(p => p.env)
    env!: string;

    doSth(t: string) {
        console.log(this.env, 'service doing something', t);
    }
}

Container.instantiate(Service).doSth('hello world');

