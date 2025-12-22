import { useEffect, useState, useCallback } from 'react';
import { getActiveCallForConversation } from '../api';
import { getSocket } from '../socket';
export function useActiveCall(conversationId) {
    const [activeCall, setActiveCall] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fetchActiveCall = useCallback(async () => {
        if (!conversationId) {
            setActiveCall(null);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const response = await getActiveCallForConversation(conversationId);
            setActiveCall(response.activeCall);
        }
        catch (err) {
            console.error('[useActiveCall] Error fetching active call:', err);
            setError('Failed to fetch active call');
            setActiveCall(null);
        }
        finally {
            setLoading(false);
        }
    }, [conversationId]);
    // Initial fetch
    useEffect(() => {
        fetchActiveCall();
    }, [fetchActiveCall]);
    // Listen for socket events to update active call status
    useEffect(() => {
        if (!conversationId)
            return;
        const socket = getSocket();
        if (!socket)
            return;
        const handleCallAccepted = (data) => {
            if (data.conversationId === conversationId) {
                console.log('[useActiveCall] Call accepted, refetching...');
                fetchActiveCall();
            }
        };
        const handleCallEnded = (data) => {
            if (activeCall && data.callId === activeCall.id) {
                console.log('[useActiveCall] Call ended, clearing...');
                setActiveCall(null);
            }
        };
        const handleCallIncoming = (data) => {
            if (data.conversationId === conversationId) {
                console.log('[useActiveCall] New incoming call, refetching...');
                fetchActiveCall();
            }
        };
        socket.on('call:accepted', handleCallAccepted);
        socket.on('call:ended', handleCallEnded);
        socket.on('call:incoming', handleCallIncoming);
        return () => {
            socket.off('call:accepted', handleCallAccepted);
            socket.off('call:ended', handleCallEnded);
            socket.off('call:incoming', handleCallIncoming);
        };
    }, [conversationId, activeCall, fetchActiveCall]);
    return {
        activeCall,
        loading,
        error,
        refetch: fetchActiveCall,
    };
}
