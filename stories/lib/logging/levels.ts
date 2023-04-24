import di from '@/dependency-injection';
import proxitive_aop from '@/aop/proxitive';
import logging from '@/logging';
import { assert_true } from 'stories/asserts';
import { IS } from '@/types';

const levels = {
    debug : 0,
    info  : 1,
    warn  : 2,
    crit  : 3,
    log   : 4,
};

const base_loggers = {
    debug : (...args: any) => console.log  ('debug' , ...args),
    info  : (...args: any) => console.log  ('info'  , ...args),
    warn  : (...args: any) => console.error('warn'  , ...args),
    crit  : (...args: any) => console.error('crit'  , ...args),
    log   : (...args: any) => console.log  ('log'   , ...args),
};

{
    const loggers = logging.create_loggers(
        levels,
        base_loggers,
        2
    );
}

{
    const container = di();
    const aop = proxitive_aop(proxify => container.on('instantiated', proxify));

    const decorators = logging.create_decorators(
        aop.after,
        levels,
        base_loggers,
        0,
    );

    class MyService {

        @decorators.info(
            (log, result, p) => {
                assert_true<IS<typeof result, number>>();
                log(p.args, result);
            },
            (log, error, p) => {
                log(p.args, error);
            }
        )
        async someAsyncMethod(...args: number[]) {
            if (args.length > 3) throw new Error(`too many args`);
            return args.reduce((pv, cv) => pv + cv);
        }

        @decorators.debug(
            (log, result, p) => {
                assert_true<IS<typeof result, number>>();
                log(p.args, result);
            },
            (log, error, p) => {
                log(p.args, error);
            }
        )
        someMethod(...args: number[]) {
            if (args.length > 3) throw new Error(`too many args`);
            return args.reduce((pv, cv) => pv + cv);
        }
    }

    void async function () {
        let instance = container.instantiate(MyService);

        await try_call(() => instance.someAsyncMethod(1, 2, 3));
        await try_call(() => instance.someMethod(1, 2, 3));

        await try_call(() => instance.someAsyncMethod(4, 5, 6, 7));
        await try_call(() => instance.someMethod(4, 5, 6, 7));

        async function try_call(cb: () => any) {
            try {
                console.log(await cb())
            } catch (e) {
                console.error(e);
            }
        }
    }()

}
