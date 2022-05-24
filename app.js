if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

console.log(process.env.SECRET);
console.log(process.env.API_KEY);

const express = require('express');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const { campgroundSchema, reviewSchema } = require('./schemas.js');
const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const Campground = require('./models/campground');
const Review = require('./models/review');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const userRoutes = require('./routes/users');
const mongoSanitize = require('express-mongo-sanitize');
const MongoStore = require('connect-mongo');
// const helmet = require('helmet');

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';

mongoose.connect(dbUrl, {
	useNewUrlParser: true,
	// useCreateIndex: true,
	useUnifiedTopology: true
	// useFindAndModify: false
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
	console.log('Database connected');
});

const app = express();
const path = require('path');

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//Tell express to parse the body:
app.use(express.urlencoded({ extended: true }));

//Tell express to use method-override:
app.use(methodOverride('_method'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(
	mongoSanitize({
		replaceWith: '_'
	})
);
// app.use(helmet());
// const scriptSrcUrls = [
// 	'https://stackpath.bootstrapcdn.com/',
// 	'https://api.tiles.mapbox.com/',
// 	'https://api.mapbox.com/',
// 	'https://kit.fontawesome.com/',
// 	'https://cdnjs.cloudflare.com/',
// 	'https://cdn.jsdelivr.net'
// ];
// const styleSrcUrls = [
// 	'https://kit-free.fontawesome.com/',
// 	'https://stackpath.bootstrapcdn.com/',
// 	'https://api.mapbox.com/',
// 	'https://api.tiles.mapbox.com/',
// 	'https://fonts.googleapis.com/',
// 	'https://use.fontawesome.com/',
// 	'https://cdn.jsdelivr.net'
// ];
// const connectSrcUrls = [
// 	'https://api.mapbox.com/',
// 	'https://a.tiles.mapbox.com/',
// 	'https://b.tiles.mapbox.com/',
// 	'https://events.mapbox.com/'
// ];
// const fontSrcUrls = [];
// app.use(
//     helmet.contentSecurityPolicy({
//         directives: {
//             defaultSrc: [],
//             connectSrc: ["'self'", ...connectSrcUrls],
//             scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
//             styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
//             workerSrc: ["'self'", "blob:"],
//             objectSrc: [],
//             imgSrc: [
//                 "'self'",
//                 "blob:",
//                 "data:",
//                 "https://res.cloudinary.com/dqr34jdyo/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT!
//                 "https://images.unsplash.com/",
//             ],
//             fontSrc: ["'self'", ...fontSrcUrls],
//         },
//     })
// );

//Tell express to use sessions and flash:
const secret = process.env.SECRET || 'thisshouldbeabettersecret';
const store = MongoStore.create({
	mongoUrl: dbUrl,
	secret,
	touchAfter: 24 * 3600
});

store.on('error', function(e) {
	console.log('session store error', e);
});

const sessionConfig = {
	store,
	dbName: 'session',
	secret,
	resave: false,
	saveUninitialized: true,
	cookie: {
		httpOnly: true,
		expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
		maxAge: 1000 * 60 * 60 * 24 * 7
	}
};

app.use(session(sessionConfig));
app.use(flash());

//Tell app to use passport:
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
// passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
	res.locals.currentUser = req.user;
	res.locals.success = req.flash('success');
	res.locals.error = req.flash('error');
	next();
});

//Tell express to use routes:
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);
app.use('/', userRoutes);

app.get('/', (req, res) => {
	res.render('home');
});

app.all('*', (req, res, next) => {
	next(new ExpressError('Page Not Found', 404));
});

app.use((err, req, res, next) => {
	const { statusCode = 500 } = err;
	if (!err.message) err.message = 'Something Went Wrong';
	res.status(statusCode).render('error', { err });
});

app.listen(3000, () => {
	console.log('Serving on port 3000');
});
