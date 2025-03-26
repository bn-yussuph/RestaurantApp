const express = require('express');
const app = express();

//Routes diffinitions
const usersRoute = require('./routes/api/v1/userRoutes');

app.use(express.json());
// Use routes
app.use('/users', usersRoute);

app.get('/', (req, res) => {
	res.send('<h1>Hello, Express.js server</h1>');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
})
