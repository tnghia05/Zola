export declare const API_URL: string;
export declare const api: import("axios").AxiosInstance;
export declare const setAuthToken: (token?: string) => void;
export type LoginResponse = {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        name: string;
        email: string;
        username: string;
    };
};
export declare const login: (email: string, password: string) => Promise<LoginResponse>;
export type Conversation = {
    _id: string;
    title?: string;
    members: string[];
    isGroup: boolean;
    lastMessageAt?: string;
    createdAt: string;
    updatedAt: string;
    __v?: number;
    lastMessageSender?: {
        _id: string;
        name: string;
        avatar?: string;
    };
    unreadCount?: {
        [userId: string]: number;
    };
    typingUsers?: Array<{
        userId: string;
        startedAt: string;
    }>;
    admins?: string[];
    groupAvatar?: string;
    groupSettings?: {
        onlyAdminsCanPost?: boolean;
        allowMemberInvites?: boolean;
    };
    pinnedMessages?: string[];
    inviteCode?: string;
    inviteCodeCreatedAt?: string;
};
export type CallRecord = {
    _id: string;
    conversationId: string;
    initiatorId: string;
    participants: string[];
    type: 'audio' | 'video';
    callType: 'p2p' | 'sfu';
    status: string;
    metadata?: {
        roomId?: string;
        livekitRoomName?: string;
    };
    livekitRoomName?: string;
};
export declare const getConversations: () => Promise<Conversation[]>;
export type Reaction = {
    userId: string;
    emoji: string;
    createdAt: string;
};
export type ReadReceipt = {
    userId: string;
    readAt: string;
};
export type Message = {
    _id: string;
    text?: string;
    type?: 'text' | 'image' | 'file';
    imageUrl?: string;
    conversationId: string;
    senderId: string;
    createdAt: string;
    updatedAt: string;
    __v?: number;
    replyTo?: string | Message;
    reactions?: Reaction[];
    isPinned?: boolean;
    isStarred?: boolean;
    isEdited?: boolean;
    deletedAt?: string | null;
    isRevoked?: boolean;
    revokedAt?: string | null;
    revokedBy?: string | null;
    readBy?: ReadReceipt[];
};
export declare const getMessages: (conversationId: string) => Promise<Message[]>;
export declare const createMessage: (conversationId: string, text: string) => Promise<Message>;
export type CreateMessagePayload = {
    text?: string;
    type?: 'text' | 'image' | 'file';
    imageUrl?: string;
    file?: {
        url: string;
        name?: string;
        mime?: string;
        size?: number;
    };
    replyTo?: string;
};
export declare const createMessageWithPayload: (conversationId: string, payload: CreateMessagePayload) => Promise<Message>;
export declare const createConversation: (userId: string, title?: string) => Promise<Conversation>;
export declare const createGroupConversation: (memberIds: string[], title?: string) => Promise<Conversation>;
export type InitiateCallResponse = {
    success: boolean;
    call?: {
        id: string;
        roomId?: string;
        livekitRoomName?: string;
        callType?: 'p2p' | 'sfu';
        status: string;
    };
};
export declare const initiateCall: (conversationId: string, type: "audio" | "video", targetUserId?: string) => Promise<InitiateCallResponse>;
export declare const getCall: (callId: string) => Promise<CallRecord>;
export type ActiveCallResponse = {
    activeCall: {
        id: string;
        conversationId: string;
        initiatorId: string;
        participants: string[];
        type: 'video' | 'audio';
        callType: 'p2p' | 'sfu';
        status: string;
        startedAt: string;
        livekitRoomName?: string;
    } | null;
};
export declare const getActiveCallForConversation: (conversationId: string) => Promise<ActiveCallResponse>;
export declare const getLiveKitToken: (callId: string) => Promise<{
    success: boolean;
    token: string;
    roomName: string;
    url: string;
}>;
export declare const endCall: (callId: string) => Promise<{
    success: boolean;
    duration?: number;
}>;
export declare const uploadImageLocalOld: (file: {
    uri: string;
    name: string;
    type: string;
}) => Promise<{
    url: string;
    name?: string;
    size?: number;
    mime?: string;
}>;
export declare const uploadImageS3: (file: {
    uri: string;
    name: string;
    type: string;
}) => Promise<{
    key: string;
    presignedUrl: string;
    name?: string;
    size?: number;
    mime?: string;
}>;
export declare const uploadImageLocal: (file: {
    uri: string;
    name: string;
    type: string;
}) => Promise<{
    url: string;
    name?: string;
    size?: number;
    mime?: string;
}>;
export declare const logout: (token: string) => Promise<any>;
export type RegisterResponse = {
    user: {
        _id: string;
        name?: string;
        email: string;
        role?: string;
        username?: string;
        isEmailVerified: boolean;
        avatar?: string;
        createdAt?: string;
        updatedAt?: string;
    };
    accessToken: string;
    refreshToken: string;
    message?: string;
    otp?: SendOTPResponse;
};
export type SendOTPResponse = {
    message: string;
    email?: string;
    expiresAt?: string;
    emailSent?: boolean;
    otpCreated?: boolean;
    error?: string;
    errorCode?: string;
    warning?: boolean;
};
export type VerifyOTPResponse = {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        name: string;
        email: string;
        username: string;
    };
};
export declare const register: (email: string, password: string, name?: string) => Promise<RegisterResponse>;
export declare const sendOTP: (email: string) => Promise<SendOTPResponse>;
export declare const verifyOTP: (email: string, otp: string) => Promise<VerifyOTPResponse>;
export declare const resendOTP: (email: string) => Promise<SendOTPResponse>;
export declare const sendVerificationOTP: (email: string) => Promise<SendOTPResponse>;
export type UpdateUsernameResponse = {
    user: {
        id: string;
        name: string;
        email: string;
        username: string;
    };
    message: string;
};
export declare const updateUsername: (username: string) => Promise<UpdateUsernameResponse>;
export type UpdateAvatarResponse = {
    user: {
        id: string;
        name: string;
        email: string;
        username: string;
        avatar?: string;
    };
    message: string;
};
export declare const updateUserAvatar: (avatarUrl: string) => Promise<UpdateAvatarResponse>;
export declare const updateUserProfile: (data: {
    avatar?: string;
    name?: string;
    username?: string;
}) => Promise<UpdateAvatarResponse>;
export declare const updateUserInfo: (avatarUrl: string) => Promise<UpdateAvatarResponse>;
export declare const getCurrentUserId: () => Promise<string | null>;
export declare const updateUserAvatarWithId: (userId: string, avatarUrl: string) => Promise<UpdateAvatarResponse>;
export declare const updateUserProfileWithId: (userId: string, data: {
    avatar?: string;
    name?: string;
    username?: string;
}) => Promise<UpdateAvatarResponse>;
export declare const updateCurrentUserProfile: (data: {
    avatar?: string;
    name?: string;
    username?: string;
}) => Promise<UpdateAvatarResponse>;
export declare const getCurrentUserProfile: () => Promise<UpdateAvatarResponse>;
export declare const uploadAvatarDirect: (file: {
    uri: string;
    name: string;
    type: string;
}) => Promise<UpdateAvatarResponse>;
export type SearchUsersResponse = {
    users: Array<{
        _id: string;
        name: string;
        email: string;
        username?: string;
        avatar?: string;
    }>;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
};
export declare const searchUsers: (query: string, page?: number, limit?: number) => Promise<SearchUsersResponse>;
export declare const createConversationWithUser: (userId: string) => Promise<Conversation>;
export type OpponentInfoResponse = {
    user: {
        _id: string;
        name: string;
        email: string;
        username?: string;
        avatar?: string;
        createdAt: string;
    };
    status: {
        isOnline: boolean;
        lastActive: string;
        lastActiveText: string;
    };
    conversation: {
        _id: string;
        isGroup: boolean;
        title?: string;
        createdAt: string;
    };
    encryption: {
        isEndToEndEncrypted: boolean;
        encryptionStatus: string;
    };
};
export declare const getOpponentInfo: (conversationId: string) => Promise<OpponentInfoResponse>;
export declare const editMessage: (messageId: string, text: string) => Promise<Message>;
export declare const deleteMessage: (messageId: string) => Promise<{
    message: string;
}>;
export declare const addReaction: (messageId: string, emoji: string) => Promise<Message>;
export declare const removeReaction: (messageId: string, emoji: string) => Promise<Message>;
export declare const pinMessage: (messageId: string) => Promise<Message>;
export declare const unpinMessage: (messageId: string) => Promise<Message>;
export declare const starMessage: (messageId: string) => Promise<Message>;
export declare const revokeMessage: (messageId: string) => Promise<Message>;
export declare const searchMessages: (query: string, conversationId?: string) => Promise<Message[]>;
export declare const markAsRead: (conversationId: string, messageId?: string) => Promise<{
    success: boolean;
}>;
export declare const addMembers: (conversationId: string, userIds: string[]) => Promise<Conversation>;
export declare const removeMember: (conversationId: string, userId: string) => Promise<Conversation>;
export declare const updateGroupInfo: (conversationId: string, data: {
    title?: string;
    avatar?: string;
}) => Promise<Conversation>;
export type InviteLinkResponse = {
    inviteCode: string;
    shareUrl: string;
};
export declare const createInviteLink: (conversationId: string) => Promise<InviteLinkResponse>;
export declare const joinConversationByInvite: (inviteCode: string) => Promise<{
    conversation: Conversation;
}>;
export declare const makeAdmin: (conversationId: string, userId: string) => Promise<Conversation>;
export declare const removeAdmin: (conversationId: string, userId: string) => Promise<Conversation>;
export declare const leaveGroup: (conversationId: string) => Promise<{
    success: boolean;
    message: string;
}>;
export declare const getUnreadCount: (conversationId: string) => Promise<{
    unreadCount: number;
}>;
export declare const updateOnlineStatus: (status: "online" | "offline" | "away") => Promise<{
    user: any;
    status: string;
    lastSeen?: Date;
}>;
export declare const getOnlineUsers: (userIds: string[]) => Promise<{
    statusMap: {
        [userId: string]: {
            onlineStatus: string;
            lastSeen?: Date;
        };
    };
}>;
export declare const createMessageWithReply: (conversationId: string, text: string, replyTo?: string) => Promise<Message>;
