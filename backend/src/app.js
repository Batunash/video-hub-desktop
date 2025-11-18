const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mediaRoutes = require('./routes/mediaRoutes');
const watchRoutes = require('./routes/watchRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', mediaRoutes);
app.use('/api',watchRoutes)
module.exports = app;
