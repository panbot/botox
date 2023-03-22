export type Constructor<T> = new (...args: any[]) => T

export type Instantiator = <T>(type: Constructor<T>) => T

export type RequiredKey<T, K extends keyof T> = {
    [P in K]-?: T[P];
} & Omit<T, K>

export type IsEqual<X, Y> = (
    <T>() => T extends X ? true : false
) extends (
    <T>() => T extends Y ? true : false
) ? true : false

export type IsReadonly<T, K extends keyof T> = IsEqual<
    {          [ P in K ]: T[K] },
    { readonly [ P in K ]: T[K] }
> extends true ? true : false
