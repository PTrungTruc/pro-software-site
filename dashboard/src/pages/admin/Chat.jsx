import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { Send, UserCircle, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const API_URL = import.meta.env.VITE_API_URL || ''

const ChatAdminPage = () => {
    const socketRef = useRef(null)
    const messagesEndRef = useRef(null)
    const userListRef = useRef([])
    const selectedRoomRef = useRef(null)
    const isFetchingHistoryRef = useRef(false)

    const [users, setUsers] = useState([])
    const [selectedRoomId, setSelectedRoomId] = useState(null)
    const [messages, setMessages] = useState([])
    const [message, setMessage] = useState('')
    const [unreadChats, setUnreadChats] = useState(new Set())

    useEffect(() => { userListRef.current = users }, [users])
    useEffect(() => { selectedRoomRef.current = selectedRoomId }, [selectedRoomId])

    useEffect(() => {
        socketRef.current = io(API_URL, { withCredentials: true })
        socketRef.current.on('connect', () => {
            socketRef.current.emit('admin_join')
        })

        socketRef.current.on('user_list', list => {
            setUsers((list || []).sort(
                (a, b) => new Date(b.lastMessage?.timestamp) - new Date(a.lastMessage?.timestamp)
            ))
        })

        socketRef.current.on('new_user_online', user => {
            setUsers(prev => [user, ...prev].sort(
                (a, b) => new Date(b.lastMessage?.timestamp) - new Date(a.lastMessage?.timestamp)
            ))
        })

        socketRef.current.on('chat_history', history => {
            if (!isFetchingHistoryRef.current) return
            setMessages(history || [])
            isFetchingHistoryRef.current = false
        })

        socketRef.current.on('receive_message', newMessage => {
            setUsers(prev => {
                const exists = prev.some(u => u.id === newMessage.roomId)
                const updated = exists
                    ? prev.map(u => u.id === newMessage.roomId ? { ...u, lastMessage: newMessage } : u)
                    : [{ id: newMessage.roomId, info: newMessage.info || {}, lastMessage: newMessage }, ...prev]
                return updated.sort(
                    (a, b) => new Date(b.lastMessage?.timestamp) - new Date(a.lastMessage?.timestamp)
                )
            })
            console.log(newMessage.roomId === selectedRoomRef.current)
            console.log(newMessage.sender === 'user')


            if (newMessage.roomId === selectedRoomRef.current && newMessage.sender === 'user') {
                setMessages(prev => [...prev, newMessage]);
            }
            else if (newMessage.roomId !== selectedRoomRef.current && newMessage.sender === 'user') {
                setUnreadChats(prev => new Set(prev).add(newMessage.roomId))
            }
        })

        return () => socketRef.current.disconnect()
    }, [])

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

    const handleSelectRoom = room => {
        if (room.id === selectedRoomRef.current) return
        setSelectedRoomId(room.id)
        setMessages([])
        isFetchingHistoryRef.current = true
        socketRef.current.emit('admin_fetch_history', room.id)
        setUnreadChats(prev => {
            const s = new Set(prev)
            s.delete(room.id)
            return s
        })
    }

    const handleSendMessage = e => {
        e.preventDefault()
        if (!message.trim() || !selectedRoomRef.current) return
        const newMessage = { roomId: selectedRoomRef.current, message, sender: 'admin', timestamp: new Date() }
        setMessages(prev => [...prev, newMessage])
        socketRef.current.emit('send_message', newMessage)
        setMessage('')
    }

    const selectedUserInfo = users.find(u => u.id === selectedRoomId)?.info
    const formatTime = ts => ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-white rounded-lg shadow-2xl border overflow-auto scrollbar-hidden">
            <div className="w-1/3 border-r flex flex-col">
                <header className="p-4 border-b font-bold text-lg">Danh sách hội thoại</header>
                <div className="flex-1 overflow-y-auto">
                    {users.map(user => (
                        <div key={user.id} onClick={() => handleSelectRoom(user)} className={cn(
                            'p-4 border-b cursor-pointer hover:bg-slate-100 flex justify-between items-center',
                            selectedRoomId === user.id && 'bg-blue-100'
                        )}>
                            <div className="flex items-center gap-3 overflow-hidden">
                                <UserCircle className="h-8 w-8 text-gray-400 flex-shrink-0" />
                                <div className="flex-1 overflow-hidden">
                                    <p className="font-semibold text-sm truncate">{user.info?.name || user.id}</p>
                                    <p className="text-xs text-gray-500 truncate">{user.info?.class}</p>
                                    <p className="text-xs text-gray-500 truncate mt-1">
                                        {user.lastMessage?.sender === 'admin' ? 'Bạn: ' : ''}
                                        {user.lastMessage?.message || '...'}
                                    </p>
                                </div>
                            </div>
                            {unreadChats.has(user.id) && <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />}
                        </div>
                    ))}
                </div>
            </div>

            <div className="w-2/3 flex flex-col">
                {selectedRoomId ? (
                    <>
                        <header className="p-4 border-b font-bold flex flex-col">
                            <span>{selectedUserInfo?.name || selectedRoomId}</span>
                            <span className="text-sm font-normal text-muted-foreground">{selectedUserInfo?.class}</span>
                        </header>

                        <div className="flex-1 p-4 overflow-y-auto bg-slate-50">
                            {messages.map((msg, i) => (
                                <div key={i} className={cn(
                                    'flex flex-col mb-3 w-full',
                                    msg.sender === 'user' ? 'items-start' : 'items-end'
                                )}>
                                    <div className={cn(
                                        'py-2 px-4 rounded-2xl max-w-[85%]',
                                        msg.sender === 'user'
                                            ? 'bg-gray-200 text-gray-800 rounded-bl-none'
                                            : 'bg-blue-600 text-white rounded-br-none'
                                    )}>
                                        <p className="text-sm break-words">{msg.message}</p>
                                    </div>
                                    <span className="text-xs text-gray-400 mt-1 px-2">{formatTime(msg.timestamp)}</span>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2 bg-white">
                            <Input value={message} onChange={e => setMessage(e.target.value)} placeholder="Nhập tin nhắn trả lời..." autoComplete="off" />
                            <Button type="submit"><Send size={18} /></Button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <MessageSquare size={48} />
                        <p className="mt-4">Chọn một hội thoại để bắt đầu</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ChatAdminPage