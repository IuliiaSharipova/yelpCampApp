const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const Campground = require('../models/campground');

mongoose.connect('mongodb://localhost:27017/yelp-camp', {
	useNewUrlParser: true,
	// useCreateIndex: true,
	useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
	console.log('Database connected');
});

const sample = (array) => {
	return array[Math.floor(Math.random() * array.length)];
};
const seedDB = async () => {
	await Campground.deleteMany({});
	for (let i = 0; i < 200; i++) {
		const random1000 = Math.floor(Math.random() * 1000);
		const price = Math.floor(Math.random() * 20) + 10;
		const camp = new Campground({
			author: '626fe6b48b99adda4ea3c7c4',
			location: `${cities[random1000].city},${cities[random1000].state}`,
			title: `${sample(descriptors)} ${sample(places)}`,
			description:
				'Lorem ipsum dolor sit amet consectetur adipisicing elit. Alias, maxime. Fugiat praesentium unde iusto expedita vel voluptas culpa quia voluptate, omnis obcaecati quam beatae modi, nisi animi neque necessitatibus fuga?',
			price,
			geometry: {
				type: 'Point',
				coordinates: [ cities[random1000].longitude, cities[random1000].latitude ]
			},
			images: [
				{
					url:
						'https://res.cloudinary.com/dqr34jdyo/image/upload/v1652357929/YelpCamp/blobg1ilbdnrigfxxewq.jpg',
					filename: 'YelpCamp/blobg1ilbdnrigfxxewq'
				},
				{
					url:
						'https://res.cloudinary.com/dqr34jdyo/image/upload/v1652357933/YelpCamp/l1g3wsvwkmtmy39ervzs.jpg',
					filename: 'YelpCamp/l1g3wsvwkmtmy39ervzs'
				}
			]
		});
		await camp.save();
	}
};

seedDB().then(() => {
	mongoose.connection.close();
});
