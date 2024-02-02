const http = require('http');
const https = require('https');

export const isAuthFeature = (req: any, res: any, callback: (status: number) => void) => {
    function getReferer(req: any) {
        const referer = req.headers['referer'];
        if (referer) {
            return referer;
        } else {
            const xDlContext = req.headers['x-dl-context'];

            if (xDlContext) {
                try {
                    const data = JSON.parse(xDlContext);
                    return data['referer'];
                } catch (e) {}
            }

            return null;
        }
    }

    function responseCode(urlAddress: string) {
        const url = require('url');
        const queryData = url.parse(urlAddress, true).query;

        const data = JSON.stringify({
            action: 'shell',
            method: 'datalens',
            data: [{}],
            type: 'rpc',
            tid: 0,
        });

        const urlRpc = url.parse(process.env.NODE_RPC_URL, true);

        const options = {
            hostname: urlRpc.hostname,
            path: urlRpc.pathname,
            method: 'POST',
            port: urlRpc.port,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
                'rpc-authorization': queryData['RPC_AUTHORIZATION'],
            },
        };

        const postRequest = (urlRpc.protocol == 'http:' ? http : https)
            .request(options, (response: any) => {
                callback(response.statusCode);
            })
            .on('error', (error: any) => {
                req.ctx.logError(error.stack);
                callback(401);
            });

        postRequest.write(data);
        postRequest.end();
    }

    if (process.env.NODE_RPC_URL) {
        const referer = getReferer(req);
        if (referer) {
            responseCode(referer);
        } else {
            callback(401);
        }
    } else {
        callback(200);
    }
};
