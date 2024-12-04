"use client"
import { Box, Button, Stack, TextField, AppBar, Toolbar, Typography } from '@mui/material';
import { useState, useRef, useEffect } from 'react';
import {franc} from 'franc';

export default function Home() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi, I am a mental health assistant. How can I be of service today?' },
  ]);
  const [message, setMessage] = useState('');
  const [language, setLanguage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

//detecting langauge from user input
const detectLanguage = (text) => {
  const langCode = franc(text);
  setLanguage(langCode);
};

useEffect(() => {
  if (messages.length > 0) {
    detectLanguage(messages.map(msg => msg.content).join(' '));
  }
}, [messages]);

const sendMessage = async () => {
  if (!message.trim() || isLoading) return;
  setIsLoading(true)  

  setMessage('')
  setMessages((messages) => [
    ...messages,
    { role: 'user', content: message },
    { role: 'assistant', content: '' },
  ])

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([...messages, { role: 'user', content: message }]),
    })

    if (!response.ok) {
      throw new Error('Network response was not ok')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const text = decoder.decode(value, { stream: true })
      setMessages((messages) => {
        let lastMessage = messages[messages.length - 1]
        let otherMessages = messages.slice(0, messages.length - 1)
        return [
          ...otherMessages,
          { ...lastMessage, content: lastMessage.content + text },
        ]
      })
    }
  } catch (error) {
    console.error('Error:', error)
    setMessages((messages) => [
      ...messages,
      { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later." },
    ])
  }
  setIsLoading(false)
}

const handleKeyPress = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      margin="0"
      padding="0"
      flexDirection="column"
      justifyContent="center"
      alignItems={'center'}
    >

<AppBar position="fixed" sx={{ backgroundColor: '#96d7c6' }} >
        <Toolbar style={{ justifyContent: 'center'}}>
          <Typography variant="h4" sx={{ color: '#6c8cbf', fontFamily: 'Lucida Console, monospace', fontWeight: 'bold'  }} padding={3}>
            Mental Health Assistant
          </Typography>
        </Toolbar>
      </AppBar>
      <Stack
        direction={'column'}
        width={'500px'}
        height={'700px'}
        border={"1px solid black"}
        p={2}
        spacing={3}
        mt={13}
      >
        <Stack
          direction={'column'}
          spacing={2}
          flexGrow={1}
          overflow={"auto"}
          maxHeight={"100%"}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display={'flex'}
              justifyContent={
                message.role === 'assistant'
                  ? 'flex-start'
                  : 'flex-end'
              }
            >
              <Box
                bgcolor={
                  message.role === 'assistant'
                    ? '#96d7c6'
                    : '#6c8cbf'
                }
                color='white'
                borderRadius={16}
                p={3}
                maxWidth={'80%'}
              >
                {message.content}
              </Box>
            </Box>
            
          ))}
          <div ref={messagesEndRef} />
        </Stack>
        <Stack direction={'row'} spacing={2}>
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            autoComplete='off'
          />
          <Button 
            variant='contained' 
            style={{ backgroundColor: '#96d7c6', color: 'white' }} 
            onClick={sendMessage}
            disabled={isLoading}
            >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </Stack>
        
      </Stack>
    </Box>
  );
}