import { Constructor, Instantiator, RequiredKey } from "./types";
import mr from './metadata-registry';

export interface Runnable<T = unknown> {
    run(...args: any[]): Promise<T>;
}

export interface RunArgFactory<RunArg = unknown> {
    produceRunArgFor(r: Runnable, ...args: any): Promise<RunArg>;
    releaseRunArgFor?(r: Runnable): Promise<void>;
    aroundRun?<T>(run: () => Promise<T>, r: Runnable<T>): Promise<T>;
}

type RemoveFirst<T> = T extends [ any, ...infer U ] ? U : never;
type RunArgProducerArgs<T extends RunArgFactory> =
    RemoveFirst<Parameters<T['produceRunArgFor']>>;

type RunArgMetadata<T extends RunArgFactory = RunArgFactory> = {
    index: number,
    Factory: Constructor<T>,
    args: RunArgProducerArgs<T>,
};

const reg = mr<RunArgMetadata[]>().on('property');

export const RunArg = <T extends RunArgFactory>(
    Factory: Constructor<T>,
    ...args: RunArgProducerArgs<T>
) => <U>(
    proto: Runnable<U>,
    method: string,
    index: number,
) => {  reg(proto, method)
            .getOrSet([])
            .push({ index, Factory, args }) }

type Arounder = RequiredKey<RunArgFactory, "aroundRun">;
function factoryIsArounder(factory: RunArgFactory): factory is Arounder {
    return factory.aroundRun != null;
}

export default (
    instantiate: Instantiator,
) => async <T>(
    runnable: Runnable<T>,
) => {
    let producers = reg(runnable, 'run').get();
    if (!producers?.length) return await runnable.run();

    let args: any[] = [];
    let produce = async <U, T extends RunArgFactory<U>>(
        producer: RunArgMetadata<T>,
        factory: T
    ) => args[producer.index] = await factory.produceRunArgFor(
        runnable,
        ...producer.args
    );

    let producing: Promise<any>[] = [];
    let releasing: (() => Promise<void> | void)[] = [];

    let arounders: Arounder[] = [];
    let around = (f: () => Promise<T>) => arounders.reduce(
        (pv, cv) => () => cv.aroundRun(pv, runnable),
        f,
    )

    for (let producer of producers) {
        let factory = instantiate(producer.Factory);
        producing.push(produce(producer, factory));

        releasing.push(() => factory.releaseRunArgFor?.(runnable));

        if (factoryIsArounder(factory)) arounders.push(factory);
    }

    try {
        await Promise.all(producing);
        let execute = () => runnable.run(...args);

        if (!arounders.length) return await execute();

        return await around(execute)();
    } catch (e) {
        throw e;
    } finally {
        await Promise.all(releasing.map(r => r()));
    }
}