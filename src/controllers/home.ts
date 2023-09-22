import {Request, Response} from '@gravity-ui/expresskit';

export default async function homeController(_: Request, res: Response) {
    res.send('hey');
}
