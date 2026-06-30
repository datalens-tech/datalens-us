import {AppError} from '@gravity-ui/nodekit';

export interface ErrorPresentation {
    code: number;
    response: {
        code?: string;
        message: string;
        details?: unknown;
        debug?: object;
    };
}

export interface PresentableErrorSpec {
    // US_ERRORS code reported in the response body and used by `error.code` comparisons
    code: string;
    // HTTP status code
    httpCode: number;
    // Canonical message; returned as-is unless a throw site overrides it
    message: string;
}

export interface PresentableErrorArgs<D = unknown> {
    message?: string;
    details?: D;
    debug?: object;
}

export abstract class PresentableError<D = unknown> extends AppError<D> {
    abstract getSpec(): PresentableErrorSpec;

    present(): ErrorPresentation {
        const spec = this.getSpec();
        const response: ErrorPresentation['response'] = {
            code: spec.code,
            message: this.message === spec.code ? spec.message : this.message,
        };
        if (this.details !== undefined) {
            response.details = this.details;
        }
        if (this.debug !== undefined) {
            response.debug = this.debug;
        }
        return {code: spec.httpCode, response};
    }
}

export function definePresentableError<D = unknown>(spec: PresentableErrorSpec) {
    return class extends PresentableError<D> {
        // The canonical error code, referenceable without an instance (e.g. in tests)
        static readonly code = spec.code;

        constructor(args: PresentableErrorArgs<D> = {}) {
            super(args.message ?? spec.message, {
                code: spec.code,
                details: args.details,
                debug: args.debug,
            });
            this.name = this.constructor.name;
        }

        getSpec(): PresentableErrorSpec {
            return spec;
        }
    };
}
