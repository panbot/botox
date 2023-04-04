import { isPromise } from 'node:util/types';
import aop from './aop'

const _create_loggers = <
    LOG extends (args: any) => void,
    LEVELS extends Record<PropertyKey, logging.LEVEL>,
>(
    logger: LOG,
    levels: LEVELS,
    level: logging.LEVEL,
) => record_map(
    levels,
    (_k, v) => v < level
        ? (() => {}) as unknown as LOG
        : logger
);

function _create_decorators<
    LEVELS extends Record<PropertyKey, logging.LEVEL>,
>(
    after: aop.AOP["after"],
    levels: LEVELS,
    level: logging.LEVEL,
) {
    const null_decorator = (
        callback: (error: any, result: any) => void,
    ) => after(p => {});

    return record_map(
        levels,
        (_k, v) => v < level
            ?   null_decorator
            :   (
                    callback: (error: any, result: any) => void,
                ) => after(p => {
                    if (isPromise(p.result)) {
                        p.result.then(r => callback(null, r)).catch(e => callback(e, null));
                        return p.result;
                    } else if (p.error) {
                        callback(p.result, null);
                        throw p.result;
                    } else {
                        callback(null, p.result);
                        return p.result;
                    }
                })
    )
}

namespace logging {
    export type LEVEL = number;

    export const create_loggers = _create_loggers;
    export const create_decorators = _create_decorators;
}

export default logging;

function record_map<const R extends Record<any, any>, T>(
    record: R,
    mapper: <K extends keyof R>(k: K, v: R[K]) => T,
) {
    return Object.fromEntries((
        Object.keys(record) satisfies (keyof R)[]
    ).map(
        k => [ k, mapper(k, record[k]) ]
    )) as { [ K in keyof R ] : T }
}
