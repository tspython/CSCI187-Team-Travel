const express = require('express');
const passport = require('passport');
const passportOAuth2 = require('passport-oauth2');
const jwt = require('jsonwebtoken');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const bcrypt = require('bcryptjs');
const session = require('express-session');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');

//custom modules
//const uber = require('./uber');

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;
const SECRET = '2c06c934f5f3047e4366794f2b89cfe0f7b6a93d708f502d69a09fbfd3451f5eb392112bf2336376d6fc225e6880d73a95c3b0c2f8fe2af600a5a47657b4e2b1';

// Middleware to parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: SECRET
}, async (jwtPayload, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: jwtPayload.id } });
    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  } catch (err) {
    return done(err, false);
  }
}));

app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
        data: {
            email: email,
            password: hashedPassword,
        },
    });
    res.json({ message: 'Registration successful!' });
} catch (error) {
    if (error.code === 'P2002' && error.meta && error.meta.target.includes('email')) {
        res.status(400).json({ error: 'Email already in use.' });
    } else {
        res.status(500).json({ error: 'Internal server error.' });
    }
}

});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).send('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send('Invalid email or password');
    }

    // User is authenticated, let's generate a token for them
    const tokenPayload = { id: user.id, email: user.email };
    const token = jwt.sign(tokenPayload, SECRET, { expiresIn: '1h' });
    res.json({ token });
    
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

function ensureAuthenticated(req, res, next) {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).send('Not authenticated');
    req.user = user;
    next();
  })(req, res, next);
}
app.put('/user/preferences', ensureAuthenticated, async (req, res) => {
  const { userId } = req.user; // Assuming the user ID is stored in req.user
  const { budget, safetyPriority, speedPriority } = req.body;

  try {
    // Update the user's preferences in the database
    const updatedPreferences = await prisma.preferences.upsert({
      where: { userId: userId },
      update: {
        budget: budget,
        safetyPriority: safetyPriority,
        speedPriority: speedPriority
      },
      create: {
        userId: userId,
        budget: budget,
        safetyPriority: safetyPriority,
        speedPriority: speedPriority
      }
    });

    res.json({ message: 'Preferences updated successfully!', updatedPreferences });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});


app.get('/dashboard', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
   // const uberAccessToken = req.user.uberAccessToken; // Assuming you have stored the Uber access token during authentication
    //const rideInfo = await uber.getCurrentRide(uberAccessToken);
    //const estimatedTimeRemaining = rideInfo.eta; // Modify this based on the actual structure of the Uber API response
    res.json({ message: 'Welcome to your dashboard!', email: req.user.email,});
  }
  catch (error) {
    res.status(500).send('Error fetching ride information from Uber API');
  }
});

app.get('/dashboard', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
   // const uberAccessToken = req.user.uberAccessToken; // Assuming you have stored the Uber access token during authentication
    //const rideInfo = await uber.getCurrentRide(uberAccessToken);
    //const estimatedTimeRemaining = rideInfo.eta; // Modify this based on the actual structure of the Uber API response
    res.json({ message: 'Welcome to your dashboard!', email: req.user.email });
  }
  catch (error) {
    res.status(500).send('Error fetching ride information from Uber API');
  }
});


