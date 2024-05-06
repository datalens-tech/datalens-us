import {AuthPolicy} from '@gravity-ui/expresskit';
import {AppConfig} from '@gravity-ui/nodekit';

export default {
    appAuthPolicy: AuthPolicy.disabled,
} as Partial<AppConfig>;
