jest.mock('../../../components/middlewares/utils/jwt', () => {
    const originalModule = jest.requireActual('../../../components/middlewares/utils/jwt');

    interface DynamicMasterTokenPayload {
        serviceId: string;
    }

    function extractServiceIdFromToken(token: string): string | null {
        try {
            const parsed = JSON.parse(token);
            if (parsed && typeof parsed.serviceId === 'string') {
                return parsed.serviceId;
            }
        } catch {
            // Not JSON format, return null
        }
        return null;
    }

    return {
        ...originalModule,
        decodeDynamicMasterToken: jest.fn((token: string): DynamicMasterTokenPayload | null => {
            if (!token) {
                return null;
            }

            const serviceId = extractServiceIdFromToken(token);

            if (!serviceId) {
                return null;
            }

            return {
                serviceId,
            };
        }),
        jwtVerify: jest.fn(async (token: string, _publicKey: string): Promise<any> => {
            const serviceId = extractServiceIdFromToken(token);

            if (!serviceId) {
                throw new Error('Invalid token');
            }

            return {serviceId};
        }),
    };
});
