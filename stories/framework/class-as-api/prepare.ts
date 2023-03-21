import factory from '@/framework/api'

export class ApiOptions {
    constructor(
        public name: string,
    ) { }
}

export const Api = factory<{}>().classAsApi(ctor => new ApiOptions(ctor.name));
