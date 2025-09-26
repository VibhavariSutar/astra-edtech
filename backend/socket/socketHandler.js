let doubtCounts = new Map(); // room -> count

export const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join room
    socket.on('joinRoom', ({ room, user }) => {
      socket.join(room);
      console.log(`User ${user} joined room: ${room}`);
      
      // Initialize doubt count for room if not exists
      if (!doubtCounts.has(room)) {
        doubtCounts.set(room, 0);
      }
      
      // Send current doubt count to the user
      socket.emit('doubtCount', doubtCounts.get(room));
    });

    // Handle doubt increment
    socket.on('incrementDoubt', ({ room, raisedBy }) => {
      const currentCount = doubtCounts.get(room) || 0;
      doubtCounts.set(room, currentCount + 1);
      
      console.log(`Doubt raised in ${room} by ${raisedBy}. Total: ${currentCount + 1}`);
      
      // Broadcast to all in room
      io.to(room).emit('doubtIncrement', {
        count: currentCount + 1,
        raisedBy: raisedBy || 'Anonymous'
      });
    });

    // Handle quiz start
    socket.on('startQuiz', (quizData) => {
      const { room } = quizData;
      console.log(`Quiz started in room: ${room}`);
      
      io.to(room).emit('quizStarted', quizData);
    });

    // Reset doubts (teacher only)
    socket.on('resetDoubts', ({ room }) => {
      doubtCounts.set(room, 0);
      io.to(room).emit('doubtReset');
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};