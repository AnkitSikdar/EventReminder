
const express = require('express');
const app = express();
const connectDB = require('./App/config/db');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const cronJob = require('./App/utils/CronJob');

dotenv.config();
connectDB();


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride('_method'));
// app.use(express.static(path.join(__dirname, 'App', 'public')));
app.use(express.static(path.join(__dirname, 'public')));



app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecretflash',
  resave: false,
  saveUninitialized: true,
}));
app.use(flash());

app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.user = req.user || null;
  next();
});

app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'App', 'views'));
app.set('layout', 'layouts/main'); 

// Redirect root to events
app.get('/', (req, res) => {
  res.redirect('/events');
});

// Auth routes (DO NOT CHANGE)
app.use('/', require('./App/routes/authRoutes'));

// Feature routes
app.use('/events', require('./App/routes/eventRoutes'));
app.use('/dashboard', require('./App/routes/dashboardRoutes'));


cronJob.start();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
