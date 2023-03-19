import mr from './metadata-registry';

type Pointcut = { target: any, method: PropertyKey, args: any[] }

type BeforePointcut = Pointcut
type AfterPointcut  = Pointcut & { result: any }
type AroundPointcut = Pointcut & { invoke: () => any }

type Before = ( before: (pointcut: BeforePointcut) => any ) => MethodDecorator
type  After = (  after: (pointcut:  AfterPointcut) => any ) => MethodDecorator
type Around = ( around: (pointcut: AroundPointcut) => any ) => MethodDecorator

type Advised = <T>(invoke: (p: Pointcut) => T, target: any, args: any[]) => T
const apply = (
    advised: Advised,
    to: Function
) => function (this: any, ...args: any[]) {
    return advised(p => to.apply(this, p.args), this, args);
}

export function AopFactory(
    implement: (blueprint: {
        origin     : Function,
        advised    : Advised,
        prototype  : Object,
        method     : PropertyKey,
        descriptor : PropertyDescriptor,
    }) => any,
) {
    const create: (
        shape: (p: Pointcut, invoke: (p: Pointcut) => any) => any
    ) => MethodDecorator = (
        pattern,
    ) => (
        prototype, method, descriptor
    ) => void implement({
        origin: assertIsFunction(prototype, method),
        advised: (invoke, target, args) => pattern({ target, method, args }, invoke),
        prototype, method, descriptor,
    });

    const Before : Before = before => create((p, invoke) =>       (  before(p),               invoke(p)  ));
    const  After :  After =  after => create((p, invoke) =>  after({     ...p,        result: invoke(p) }));
    const Around : Around = around => create((p, invoke) => around({     ...p,  invoke: () => invoke(p) }));

    return { Before, After, Around }
}

export const DestructiveAop = () => AopFactory(bp => bp.descriptor.value = apply(bp.advised, bp.origin));

export const InjectiveAopFactory = (
    inject: (prototype: Object, property: PropertyKey, factory: () => any) => Function,
) => AopFactory(({
    origin, advised, prototype, method,
}) => {
    let registry = mr<Advised[]>(InjectiveAopFactory).on('property')(prototype, method);
    registry.getOrSet([]).push(advised);

    inject(
        prototype,
        method,
        () => registry.getOwn().reduce((pv, cv) => apply(cv, pv), origin),
    );
});

export const ProxitiveAop = (
    use: (proxifier: (object: any) => any) => any,
) => {
    let p = mr<PropertyKey[]>().on('class'   );
    let a = mr<    Advised[]>().on('property');

    use((target: any) => {
        let properties = p(target).trace().flat();
        if (!properties.length) return target;

        let proxy = Object.create(target);
        let pointcuts = new Map<PropertyKey, Advised[]>();
        for (let property of new Set(properties)) {
            pointcuts.set(property, a(target, property).getOwn());
        }

        for (let [ k, v ] of pointcuts.entries()) {
            Object.defineProperty(proxy, k, {
                value: v.reduce((pv, cv) => apply(cv, pv), target[k] as Function)
            })
        }

        return proxy;
    });

    return AopFactory(({
        advised, prototype, method,
    }) => {
        a(prototype, method).getOrSet([]).push(advised);
        p(prototype        ).getOrSet([]).push(method );
    })
}

function assertIsFunction(o: any, k: PropertyKey) {
    let v: unknown = o[k];
    if ('function' != typeof v) {
        throw new Error(`${o.constructor.name}.${k.toString()} is not a function`)
    }
    return v;
}
