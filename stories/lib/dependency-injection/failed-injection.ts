import di from '@/lib/dependency-injection';
import { Stream } from 'node:stream';

const container = di();

class FailedInjection {

    constructor(
        @container.inject()
        public str: Stream,
    ) { }
}

container.instantiate(FailedInjection);
