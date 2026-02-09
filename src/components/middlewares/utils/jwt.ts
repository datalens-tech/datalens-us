import jwt from 'jsonwebtoken';

export interface DynamicMasterTokenPayload {
    serviceId: string;
}

export function decodeDynamicMasterToken(token: string): DynamicMasterTokenPayload | null {
    return jwt.decode(token) as DynamicMasterTokenPayload | null;
}

export const jwtVerify = (token: string, publicKey: string) => {
    return new Promise((resolve, reject) => {
        jwt.verify(
            token,
            publicKey,
            {
                algorithms: ['RS256'],
            },
            (err, decoded) => {
                if (err) {
                    reject(err);
                }

                resolve(decoded);
            },
        );
    });
};
