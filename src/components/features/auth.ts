const http = require('http');
const https = require('https');

export const isAuthFeature = (
    req: any,
    res: any,
    callback: (status: number, responseData: any) => void,
) => {
    function getRpcAuthorization(req: any) {
        const authorization = req.headers['x-rpc-authorization'];
        if (authorization) {
            return authorization;
        } else {
            const xDlContext = req.headers['x-dl-context'];

            if (xDlContext) {
                try {
                    const data = JSON.parse(xDlContext);
                    return data['rpcAuthorization'];
                } catch (e) {}
            }

            return null;
        }
    }

    function responseCode(token: string) {
        const url = require('url');

        const data = JSON.stringify({
            action: 'shell',
            method: 'datalens',
            data: [{url: req.url}],
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
                'rpc-authorization': token,
            },
        };

        const postRequest = (urlRpc.protocol == 'http:' ? http : https)
            .request(options, (response: any) => {
                let body = '';

                response.on('data', (chunk: any) => {
                    body += chunk;
                });

                response.on('end', () => {
                    try {
                        const json = JSON.parse(body);
                        callback(response.statusCode, json[0].result.records);
                    } catch (error: any) {
                        req.ctx.logError(`RESPONSE ERR ${process.env.NODE_RPC_URL}: ` + error.stack);
                        callback(response.statusCode, {msg: error.message});
                    }
                });
            })
            .on('error', (error: any) => {
                req.ctx.logError(`REQUEST ERR ${process.env.NODE_RPC_URL}: ` + error.stack);
                callback(401, null);
            });

        postRequest.write(data);
        postRequest.end();
    }

    if (process.env.NODE_RPC_URL) {
        const token = getRpcAuthorization(req);
        if (token) {
            responseCode(token);
        } else {
            req.ctx.log(`Token empty NODE_RPC_URL: ${process.env.NODE_RPC_URL}`);
            callback(401, null);
        }
    } else {
        callback(200, null);
    }
};
