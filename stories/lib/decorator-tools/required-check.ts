export default null;

type OPTIONS = {
    http_method: string
    path: string
    content_type: string,
}

type MISSING_KEYS<KEYS> = Exclude<keyof OPTIONS, KEYS>

{
    type t1 = MISSING_KEYS<never>
    type t2 = MISSING_KEYS<'http_method'>
    type t3 = MISSING_KEYS<'http_method' | 'path'>
    type t4 = MISSING_KEYS<'http_method' | 'path' | 'content_type'>
}

type CLASS_DECORATOR<T> = (target: T) => void
type ERROR = (target: 'incomplete options') => void

type OPTION_SETTER<FIELDS, T>
    = MISSING_KEYS<FIELDS> extends never
    ? { [ K in keyof OPTIONS ]: (v: OPTIONS[K]) => OPTION_SETTER<FIELDS | K, T> } & CLASS_DECORATOR<T>
    : { [ K in keyof OPTIONS ]: (v: OPTIONS[K]) => OPTION_SETTER<FIELDS | K, T> } & ERROR

{
    type t1 = OPTION_SETTER<never, any>
    type t2 = OPTION_SETTER<keyof OPTIONS, any>
}

declare function route<T>(): OPTION_SETTER<never, T>;

{
    @route().http_method('GET').path('/').content_type('application/json')
    class A {

    }
}

{
    //@ts-expect-error
    @route().http_method('GET').path('/')
    class A {

    }
}
