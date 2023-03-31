import di from '@/lib/dependency-injection';

const container = di();

class FailedInjection {

    constructor(
        @container.inject()
        public str: Function,
    ) { }
}

container.instantiate(FailedInjection);
