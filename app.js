var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
let mongoose = require('mongoose');
require('dotenv').config();

var app = express();

// ======================
// View engine (optional)
// ======================
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// ======================
// Middleware
// ======================
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ======================
// MongoDB Connection
// ======================
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/NNPTUD-S2';

mongoose.connect(mongoUri);

mongoose.connection.on('connected', function () {
  console.log("✅ MongoDB connected!");
});

mongoose.connection.on('error', function (err) {
  console.error("❌ MongoDB error:", err);
});

// ======================
// Routes
// ======================

// Trang chủ
app.use('/', require('./routes/index'));

// IMPORT USER (CHUẨN REST)
app.use('/api/users', require('./routes/importUsers'));

// ======================
// Health check
// ======================
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running'
  });
});

// ======================
// 404 handler
// ======================
app.use(function (req, res, next) {
  next(createError(404));
});

// ======================
// Error handler
// ======================
app.use(function (err, req, res, next) {
  res.status(err.status || 500).json({
    success: false,
    message: err.message
  });
});

module.exports = app;
