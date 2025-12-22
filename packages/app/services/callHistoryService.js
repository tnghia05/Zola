import AsyncStorage from '@react-native-async-storage/async-storage';
export class CallHistoryService {
    // Lưu cuộc gọi vào lịch sử
    static async saveCall(call) {
        try {
            const existingHistory = await this.getCallHistory();
            const newHistory = [call, ...existingHistory].slice(0, 100); // Giữ tối đa 100 cuộc gọi
            await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(newHistory));
            console.log('📞 [CALLHISTORY] Call saved to history:', call.callId);
        }
        catch (error) {
            console.error('❌ [CALLHISTORY] Error saving call:', error);
        }
    }
    // Lấy lịch sử cuộc gọi
    static async getCallHistory() {
        try {
            const historyJson = await AsyncStorage.getItem(this.STORAGE_KEY);
            if (historyJson) {
                const history = JSON.parse(historyJson);
                // Convert date strings back to Date objects
                return history.map((call) => ({
                    ...call,
                    startTime: new Date(call.startTime),
                    endTime: new Date(call.endTime)
                }));
            }
            return [];
        }
        catch (error) {
            console.error('❌ [CALLHISTORY] Error getting call history:', error);
            return [];
        }
    }
    // Lấy lịch sử cuộc gọi theo conversation
    static async getCallHistoryByConversation(conversationId) {
        try {
            const allHistory = await this.getCallHistory();
            return allHistory.filter(call => call.conversationId === conversationId);
        }
        catch (error) {
            console.error('❌ [CALLHISTORY] Error getting call history by conversation:', error);
            return [];
        }
    }
    // Xóa lịch sử cuộc gọi
    static async clearCallHistory() {
        try {
            await AsyncStorage.removeItem(this.STORAGE_KEY);
            console.log('📞 [CALLHISTORY] Call history cleared');
        }
        catch (error) {
            console.error('❌ [CALLHISTORY] Error clearing call history:', error);
        }
    }
    // Cập nhật trạng thái cuộc gọi
    static async updateCallStatus(callId, status, duration) {
        try {
            const history = await this.getCallHistory();
            const callIndex = history.findIndex(call => call.callId === callId);
            if (callIndex !== -1) {
                history[callIndex].status = status;
                if (duration !== undefined) {
                    history[callIndex].duration = duration;
                }
                history[callIndex].endTime = new Date();
                await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
                console.log('📞 [CALLHISTORY] Call status updated:', callId, status);
            }
        }
        catch (error) {
            console.error('❌ [CALLHISTORY] Error updating call status:', error);
        }
    }
}
CallHistoryService.STORAGE_KEY = 'call_history';
