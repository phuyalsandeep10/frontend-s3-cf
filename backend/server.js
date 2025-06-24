// Load environment variables ASAP, before any other imports that use env vars
require('dotenv').config({ path: '.variables.env' });

console.log('DEBUG MONGO_URI:', "mongodb://localhost:27017/mern-admin");

const mongoose = require('mongoose');
const glob = require('glob');
const path = require('path');

// Ensure Node.js version is 10.0 or higher
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 10 || (major === 10 && minor <= 0)) {
  console.log('Please upgrade to Node.js version 10 or higher from https://nodejs.org. 👌');
  process.exit();
}

// Connect to MongoDB using connection string from environment variables
mongoose.connect("mongodb://localhost:27017/mern-admin", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex:true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');

  // Use native ES6 Promises for Mongoose
  mongoose.Promise = global.Promise;

  // Load all Mongoose models from the models directory
  glob.sync('./models/*.js').forEach(file => {
    require(path.resolve(file));
  });

  // Import Express app AFTER DB connection is established (so env vars are loaded)
  const app = require('./app');

  const PORT = process.env.PORT || 8888;
  app.set('port', PORT);

  const server = app.listen(PORT, () => {
    console.log(`Express running → On PORT : ${server.address().port}`);
  });
})
.catch(err => {
  console.error(`🚫 MongoDB connection error: ${err.message}`);
  process.exit(1);
});
