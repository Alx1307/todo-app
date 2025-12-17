const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const todoRoutes = require('./routes/todos');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb-service:27017/todoapp';

app.use(cors());
app.use(express.json());

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.log('Retrying connection in 3 seconds...');
    setTimeout(connectDB, 3000);
  }
};

mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.log('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

connectDB();

app.use('/todos', todoRoutes);

app.get('/health', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const healthStatus = {
      status: dbState === 1 ? 'healthy' : 'unhealthy',
      database: dbState === 1 ? 'connected' : 'disconnected',
      mongodbState: dbState,
      timestamp: new Date().toISOString(),
    };
    res.status(dbState === 1 ? 200 : 503).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});

app.get('/', (req, res) => {
  res.json({
    message: 'Todo API is running',
    endpoints: {
      getTodos: 'GET /todos',
      createTodo: 'POST /todos',
      getTodo: 'GET /todos/:id',
      updateTodo: 'PUT /todos/:id',
      deleteTodo: 'DELETE /todos/:id',
      health: 'GET /health',
    },
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});