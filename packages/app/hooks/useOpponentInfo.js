import { useCallback, useEffect, useState } from 'react';
import { getOpponentInfo } from '../api';
export function useOpponentInfo(conversationId) {
    const [info, setInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const load = useCallback(async () => {
        if (!conversationId) {
            setInfo(null);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const response = await getOpponentInfo(conversationId);
            setInfo({
                conversationId,
                userId: response.user?._id,
                name: response.user?.name ?? 'Người dùng',
                avatar: response.user?.avatar ?? undefined,
                status: response.status?.isOnline ? 'online' : 'offline',
                lastSeen: response.status?.lastActive,
            });
        }
        catch (err) {
            console.error('❌ Failed to load opponent info:', err);
            setError(err instanceof Error ? err.message : 'Failed to load opponent info');
        }
        finally {
            setLoading(false);
        }
    }, [conversationId]);
    useEffect(() => {
        load();
    }, [load]);
    return { info, loading, error, reload: load };
}
