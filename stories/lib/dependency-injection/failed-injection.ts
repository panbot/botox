import di from '@/lib/dependency-injection';

const Container = di();

class FailedInjection {

    constructor(
        @Container.Inject()
        public str: Function,
    ) { }
}

Container.instantiate(FailedInjection);
