import { CONSTRUCTOR, INSTANTIATOR, REMOVE_HEAD, REQUIRED_KEY } from "./types";
import mr from './metadata-registry';

export interface Runnable<T = unknown> {
    run(...args: any[]): Promise<T>;
}

export interface RunArgFactory<RunArg = unknown> {
    produceRunArgFor(r: Runnable, ...args: any): Promise<RunArg>;
    releaseRunArgFor?(r: Runnable): Promise<void>;
    aroundRun?<T>(run: () => Promise<T>, r: Runnable<T>): Promise<T>;
}

type RunArgProducerArgs<T extends RunArgFactory> = REMOVE_HEAD<Parameters<T['produceRunArgFor']>>;

type RunArgMetadata<T extends RunArgFactory = RunArgFactory> = {
    index: number,
    Factory: CONSTRUCTOR<T>,
    args: RunArgProducerArgs<T>,
};

type Arounder = REQUIRED_KEY<RunArgFactory, "aroundRun">;
function factoryIsArounder(factory: RunArgFactory): factory is Arounder {
    return factory.aroundRun != null;
}

export default function (
    instantiate: INSTANTIATOR,
) {
    const reg = mr<RunArgMetadata[]>()('property');

    const RunArg = <T extends RunArgFactory>(
        Factory: CONSTRUCTOR<T>,
        ...args: RunArgProducerArgs<T>
    ) => <U>(
        proto: Runnable<U>,
        method: string,
        index: number,
    ) => {  reg(proto, method)
                .getOrSet([])
                .push({ index, Factory, args }) }

    async function run<T>(
        runnable: Runnable<T>,
    ) {
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

    return {
        run,
        RunArg,
    }
}
