import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X } from 'lucide-react';
import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { cn } from "@/lib/utils";

const API_URL = import.meta.env.VITE_API_URL || '';

const ChatWidget = () => {
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [roomId, setRoomId] = useState('');
    const [isRegistered, setIsRegistered] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    useEffect(() => {
        const storedRoomId = localStorage.getItem('chatRoomId');
        const storedUserInfo = JSON.parse(localStorage.getItem('chatUserInfo'));
        if (storedRoomId) setRoomId(storedRoomId);
        if (storedUserInfo) setIsRegistered(true);

        socketRef.current = io(API_URL, { withCredentials: true, autoConnect: false });
        socketRef.current.connect();

        socketRef.current.on('chat_history', history => setMessages(history || []));
        socketRef.current.on('receive_message', newMessage => {

            setMessages(prev => [...prev, newMessage]);
            if (newMessage.sender === 'admin' && !isOpen) setUnreadCount(prev => prev + 1);
            if (isOpen) setUnreadCount(0);
        });

        return () => socketRef.current.disconnect();
    }, []);

    useEffect(() => {
        if (!isRegistered || !socketRef.current) return;

        let storedRoomId = localStorage.getItem('chatRoomId');
        const storedUserInfo = JSON.parse(localStorage.getItem('chatUserInfo'));

        if (storedRoomId && storedUserInfo) {
            socketRef.current.emit('user_join', {
                roomId: storedRoomId,
                userInfo: storedUserInfo
            });
            socketRef.current.on('chat_roomId', roomId => {
                setRoomId(roomId); localStorage.setItem('chatRoomId', roomId);
                console.log(storedRoomId, " - ", localStorage.getItem('chatRoomId'))
                if (storedRoomId !== localStorage.getItem('chatRoomId')) {
                    storedRoomId = localStorage.getItem('chatRoomId');
                    handleOpenChat();
                }
            });
        }
    }, [isRegistered, isOpen]);

    useEffect(scrollToBottom, [messages]);

    const handleRegister = e => {
        e.preventDefault();
        const name = e.target.name.value.trim();
        const className = e.target.className.value.trim();
        if (!name || !className) return;

        const info = { name, class: className };
        let id = localStorage.getItem('chatRoomId');
        if (!id) {
            id = `user_${uuidv4().substring(0, 8)}`;
            localStorage.setItem('chatRoomId', id);
        }
        setRoomId(id);
        localStorage.setItem('chatUserInfo', JSON.stringify(info));
        setIsRegistered(true);
    };

    const handleSendMessage = e => {
        e.preventDefault();
        if (!message.trim() || !roomId) return;
        const newMessage = { roomId, message, sender: 'user', timestamp: new Date() };
        // setMessages(prev => [...prev, newMessage]);
        socketRef.current.emit('send_message', newMessage);
        setMessage('');
    };

    const handleOpenChat = () => {
        setIsOpen(prev => !prev);
        setUnreadCount(0);
    };

    const formatTime = ts => ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed bottom-24 right-5 w-80 h-[28rem] bg-white rounded-lg shadow-2xl flex flex-col z-50 border">
                        <header className="bg-primary text-primary-foreground p-4 rounded-t-lg flex justify-between items-center flex-shrink-0">
                            <h3 className="font-bold">Hỗ trợ trực tuyến</h3>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/80" onClick={() => setIsOpen(false)}><X size={20} /></Button>
                        </header>

                        {!isRegistered ? (
                            <div className="p-4 flex-1 flex flex-col">
                                <p className="text-sm text-center mb-4 text-black">Vui lòng nhập thông tin để bắt đầu chat.</p>
                                <form onSubmit={handleRegister} className="space-y-4">
                                    <div><Label htmlFor="name" className="text-black">Họ và Tên</Label><Input className="text-black bg-white my-1" id="name" name="name" required /></div>
                                    <div><Label htmlFor="className" className="text-black">Lớp</Label><Input className="text-black bg-white my-1" id="className" name="className" required /></div>
                                    <Button type="submit" className="w-full">Bắt đầu Chat</Button>
                                </form>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 p-4 overflow-y-auto bg-slate-50">
                                    {messages.map((msg, i) => (
                                        <div key={i} className={cn("flex flex-col mb-3 w-full", msg.sender === 'admin' ? 'items-start' : 'items-end')}>
                                            <div className={cn("py-2 px-4 rounded-2xl max-w-[85%]", msg.sender === 'admin' ? 'bg-gray-200 text-gray-800 rounded-bl-none' : 'bg-blue-600 text-white rounded-br-none')}>
                                                <p className="text-sm break-words">{msg.message}</p>
                                            </div>
                                            <span className="text-xs text-gray-400 mt-1 px-2">{formatTime(msg.timestamp)}</span>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                                <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2 bg-white rounded-b-lg">
                                    <Input value={message} onChange={e => setMessage(e.target.value)} placeholder="Nhập tin nhắn..." autoComplete="off" />
                                    <Button type="submit"><Send size={18} /></Button>
                                </form>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                className="fixed bottom-5 right-5 bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center shadow-lg z-50"
                onClick={handleOpenChat}>
                {isOpen ? <X /> : <MessageSquare />}
                {unreadCount > 0 && !isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </motion.button>
        </>
    );
};

export default ChatWidget;