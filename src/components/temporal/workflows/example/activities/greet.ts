import type {ActivitiesDeps} from '../../../types';

export type GreetArgs = {
    name: string;
};

export async function greet(_deps: ActivitiesDeps, {name}: GreetArgs): Promise<string> {
    return `Hello, ${name}!`;
}
