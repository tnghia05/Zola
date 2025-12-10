# WebRTC Compatibility Check

## ✅ Socket Event Names
Tất cả platforms đều sử dụng cùng event names:
- `webrtc:offer`
- `webrtc:answer`
- `webrtc:ice-candidate`

## 📤 Format Emit (Client → Backend)

### Desktop
```typescript
// Offer
socket.emit('webrtc:offer', {
  callId: string,
  offer: RTCSessionDescriptionInit,
  targetUserId: string
})

// Answer
socket.emit('webrtc:answer', {
  callId: string,
  answer: RTCSessionDescriptionInit,
  targetUserId: string
})

// ICE Candidate
socket.emit('webrtc:ice-candidate', {
  callId: string,
  candidate: RTCIceCandidateInit,
  targetUserId: string
})
```

### Mobile
```typescript
// Offer
socket.emit('webrtc:offer', {
  offer: RTCSessionDescriptionInit,
  callId: string,
  targetUserId?: string  // Optional
})

// Answer
socket.emit('webrtc:answer', {
  answer: RTCSessionDescriptionInit,
  callId: string,
  targetUserId?: string  // Optional
})

// ICE Candidate
socket.emit('webrtc:ice-candidate', {
  targetUserId: string,
  candidate: RTCIceCandidateInit,
  callId: string
})
```

## 📥 Format Receive (Backend → Client)

Backend forward với format:
```typescript
// Offer
io.to(`user:${targetUserId}`).emit('webrtc:offer', {
  callId: string,
  offer: RTCSessionDescriptionInit,
  fromUserId: string
})

// Answer
io.to(`user:${targetUserId}`).emit('webrtc:answer', {
  callId: string,
  answer: RTCSessionDescriptionInit,
  fromUserId: string
})

// ICE Candidate
io.to(`user:${targetUserId}`).emit('webrtc:ice-candidate', {
  callId: string,
  candidate: RTCIceCandidateInit,
  fromUserId: string
})
```

## ✅ Desktop Handlers (Updated)
```typescript
// Offer handler - expects: { callId, offer, fromUserId }
const handleOffer = async (data: { 
  callId: string; 
  offer: RTCSessionDescriptionInit; 
  fromUserId: string 
}) => { ... }

// Answer handler - expects: { callId, answer, fromUserId }
const handleAnswer = async (data: { 
  callId: string; 
  answer: RTCSessionDescriptionInit; 
  fromUserId?: string 
}) => { ... }

// ICE Candidate handler - expects: { callId, candidate, fromUserId }
const handleIceCandidate = async (data: { 
  callId: string; 
  candidate: RTCIceCandidateInit; 
  fromUserId?: string 
}) => { ... }
```

## ✅ Mobile Handlers
```typescript
// Offer handler - expects: { callId, offer }
socket.on('webrtc:offer', async (data) => {
  // Uses data.offer, data.callId
})

// Answer handler - expects: { callId, answer, targetUserId }
socket.on('webrtc:answer', async (data) => {
  // Uses data.answer, data.callId
})

// ICE Candidate handler - expects: { callId, candidate }
socket.on('webrtc:ice-candidate', async (data) => {
  // Uses data.candidate, data.callId
})
```

## 🔍 Compatibility Status

### ✅ Compatible
- Socket event names: ✅ Match
- Backend forwarding: ✅ Works
- Desktop emit format: ✅ Compatible
- Mobile emit format: ✅ Compatible (targetUserId optional)

### ⚠️ Potential Issues
1. **Mobile expects `targetUserId` in answer** but backend sends `fromUserId`
   - Mobile code should use `fromUserId` instead
   - Or ignore the field (not critical)

2. **Desktop handlers updated** to accept `fromUserId` (optional for answer/ice)

## 🧪 Testing Checklist
- [ ] Desktop → Desktop call
- [ ] Mobile → Mobile call
- [ ] Desktop → Mobile call
- [ ] Mobile → Desktop call
- [ ] Web → Desktop call (if web version exists)
- [ ] Web → Mobile call (if web version exists)

