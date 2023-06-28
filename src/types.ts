export type CONSTRUCTOR<T = any> = new (...args: any[]) => T

export type INSTANTIATOR = <T>(
    type: CONSTRUCTOR<T>,
    args?: ConstructorParameters<CONSTRUCTOR<T>>,
) => T

export type MAYBE<T> = T | undefined | null;

export type REQUIRED_KEY<T, K extends keyof T> = {
    [P in K]-?: T[P];
} & Omit<T, K>;

export type IS<X, Y> = (
    <T>() => T extends X ? true : false
) extends (
    <T>() => T extends Y ? true : false
) ? true : false;

export function typram<T>() { return new typram.Typram<T>() }
export namespace typram {

    export function factory<CONSTRAINT = any>() {
        return <T extends CONSTRAINT>() => new Typram<T>
    }

    export class Typram<T> {
        // an impossible signature to match to avoid mistakes like:
        // let t: typram.Param<any> = typram<T>
        #t!: T
    }
}

export type FALSY
    = false
    | 0
    | 0n
    | null
    | undefined
    | void
;

export type P_OF_T<P, T, ELSE = never> = P extends keyof T ? T[P] : ELSE;

export type METHODS<T> = keyof {
    [ P in keyof T as T[P] extends (...args: any) => any ? P : never ]: any
}

export type METHOD_INVOKER = <
    T,
    K extends METHODS<T>,
    ARGS extends T[K] extends (...args: infer U) => any ? U : never
>(
    target: T,
    method: K,
    args: ARGS
) => T[K] extends (...args: any) => infer U ? U : never
