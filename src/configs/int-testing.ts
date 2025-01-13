import {AuthPolicy} from '@gravity-ui/expresskit';
import {AppConfig} from '@gravity-ui/nodekit';

export default {
    zitadelEnabled: true,
    accessServiceEnabled: true,
    appAuthPolicy: AuthPolicy.required,
    swaggerEnabled: false,
} as Partial<AppConfig>;
