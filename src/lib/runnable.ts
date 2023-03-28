import { CONSTRUCTOR, INSTANTIATOR, REMOVE_HEAD, REQUIRED_KEY } from "./types";
import mrf from './metadata-registry-factory';

export interface Runnable<T = unknown> {
    run(...args: any[]): Promise<T>;
}

export interface RunArgFactory<RunArg = unknown> {

    produce_run_arg(for_runnable: Runnable, ...args: any): Promise<RunArg>;

    release_run_arg?(for_runnable: Runnable): Promise<void>;

    around_run?<T>(for_runnable: Runnable<T>, invoke: () => Promise<T>): Promise<T>;
}

type GET_PRODUCER_ARGS<T extends RunArgFactory> = REMOVE_HEAD<Parameters<T['produce_run_arg']>>;

type RUN_ARG<T extends RunArgFactory = RunArgFactory> = {
    index: number,
    Factory: CONSTRUCTOR<T>,
    args: GET_PRODUCER_ARGS<T>,
};

type Arounder = REQUIRED_KEY<RunArgFactory, "around_run">;
function is_arounder(factory: RunArgFactory): factory is Arounder {
    return factory.around_run != null;
}

export default function (
    instantiate: INSTANTIATOR,
) {
    const get_registry = mrf.property_factory(mrf.key<RUN_ARG[]>());

    const run_arg = <T extends RunArgFactory>(
        Factory: CONSTRUCTOR<T>,
        ...args: GET_PRODUCER_ARGS<T>
    ) => <U>(
        proto: Runnable<U>,
        method: string,
        index: number,
    ) => get_registry(proto, method).get_or_set([]).push({ index, Factory, args });

    async function run<T>(
        runnable: Runnable<T>,
    ) {
        let producers = get_registry(runnable, 'run').get();
        if (!producers?.length) return await runnable.run();

        let args: any[] = [];
        let produce = async <U, T extends RunArgFactory<U>>(
            producer: RUN_ARG<T>,
            factory: T
        ) => args[producer.index] = await factory.produce_run_arg(
            runnable,
            ...producer.args
        );

        let producing: Promise<any>[] = [];
        let releasing: (() => Promise<void> | void)[] = [];

        let arounders: Arounder[] = [];
        let around = (f: () => Promise<T>) => arounders.reduce(
            (pv, cv) => () => cv.around_run(runnable, pv),
            f,
        )

        for (let producer of producers) {
            let factory = instantiate(producer.Factory);
            producing.push(produce(producer, factory));

            releasing.push(() => factory.release_run_arg?.(runnable));

            if (is_arounder(factory)) arounders.push(factory);
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
        run_arg,
    }
}
