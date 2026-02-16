import React, { useRef, useEffect, useState } from 'react'
import './chat.css'

function Chat({ isOpen, onClose }) {
    const chatContentRef = useRef(null)
    const [chatMessage, setChatMessage] = useState('')
    
    // Function to get avatar based on user
    const getUserAvatar = (username) => {
        const avatars = ['images/chatuser.png', 'images/chatuser2.png']
        // Use username hash to consistently assign avatar
        const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        return avatars[hash % avatars.length]
    }
    
    const [chatMessages, setChatMessages] = useState([
        { id: 1, user: '@bamidele', message: 'Hi Bro I just made a win', time: '11sec', isAdmin: false },
        { id: 2, user: '@Oremi', message: 'Hi Bro I just made a win', time: '11sec', isAdmin: false },
        { id: 3, user: '@Phero2565', message: 'Hi Bro I just made a win', time: '11sec', isAdmin: false },
        { id: 4, user: '@bamidele', message: 'You did really great honestly Must say you really deserved the win', time: '18sec', isAdmin: false },
        { id: 5, user: '@Phero2565', message: 'Hi Bro I just made a win', time: '20sec', isAdmin: false },
        { id: 6, user: '@Phero2565', message: 'Hi Bro I just made a win', time: '5sec', isAdmin: true },
        { id: 7, user: '@bamidele', message: 'You did really great honestly Must say you really deserved the win', time: '11sec', isAdmin: false },
    ].map(msg => ({
        ...msg,
        avatar: getUserAvatar(msg.user)
    })))
    
    const [selectedCountry, setSelectedCountry] = useState('ENG')

    const handleSendMessage = (e) => {
        e.preventDefault()
        if (chatMessage.trim()) {
            const newMessage = {
                id: chatMessages.length + 1,
                user: '@you',
                message: chatMessage,
                time: 'now',
                isAdmin: false,
                avatar: getUserAvatar('@you')
            }
            setChatMessages([...chatMessages, newMessage])
            setChatMessage('')
        }
    }

    // Auto-scroll chat to bottom when new messages are added
    useEffect(() => {
        if (chatContentRef.current && chatMessages.length > 0) {
            chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight
        }
    }, [chatMessages])

    if (!isOpen) return null

    return (
        <>
            <div className='chat_overlay' onClick={onClose}></div>
            <div className='chat_panel'>
                <div className='chat_header'>
                    <div className='chat_header_left'>
                        <span className='chat_tick'>TICK:0TCAY7S</span>
                        <button className='chat_refresh_btn'>
                            <i className="ri-refresh-line"></i>
                        </button>
                     
                    </div>
                    <button className='chat_close_btn' onClick={onClose}>
                        <i className="ri-close-line"></i>
                    </button>
                </div>

            <div className='d-flex align-items-center justify-content-between gap-3 select_country_header'>    
                <div className='chat_country_select_header'>
                            <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} className='chat_country_dropdown_header'>
                                <option value="ENG">ENG</option>
                                <option value="USA">USA</option>
                                <option value="IND">IND</option>
                                <option value="AUS">AUS</option>
                            </select>
                        </div>
                        <span className='chat_online_count'>12,000 Online</span>
            </div>

                <div className='chat_content' ref={chatContentRef}>
                    {chatMessages.map((msg) => (
                        <div key={msg.id} className='chat_message_item'>
                            <div className='chat_message_avatar'>
                                <img src={msg.avatar || 'images/user-avatar-default.png'} alt={msg.user} onError={(e) => { e.target.src = 'images/user-avatar-default.png' }} />
                            </div>
                            <div className='chat_message_content'>
                                <div className='chat_message_header'>
                                    <span className='chat_message_user'>{msg.user}</span>
                                    {msg.isAdmin && <span className='chat_message_admin'>ADMIN</span>}
                                    <span className='chat_message_time'>{msg.time}</span>
                                </div>
                                <div className='chat_message_text'>{msg.message}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <form className='chat_input_form' onSubmit={handleSendMessage}>
                    <input
                        type="text"
                        className='chat_input'
                        placeholder="Enter your text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                    />
                    <button type="submit" className='chat_send_btn'>
                        <i className="ri-send-plane-line"></i>
                    </button>
                </form>
            </div>
        </>
    )
}

export default Chat
