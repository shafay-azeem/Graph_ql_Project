const path = require('path')
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
const multer = require('multer')
const { uuid } = require('uuidv4');
const cors = require('cors');
const graphqlHTTP = require('express-graphql').graphqlHTTP;
const graphqlSchema = require('./graphql/schema')
const graphqlResolvers = require('./graphql/resolvers')
const auth = require('./middleware/auth')

const app = express();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images');
  },
  filename: function (req, file, cb) {
    cb(null, uuid() + file.originalname)
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};



// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>




app.use(bodyParser.json()); // application/json
app.use(multer({ storage: storage, fileFilter: fileFilter }).single('image'))
app.use('/images', express.static(path.join(__dirname, 'images')))


app.use(cors());

// Handle preflight requests for all routes
app.options('*', cors());


app.use(auth)

app.put('/post-image', (req, res, next) => {
  if (!req.isAuth) {
    const error = new Error('Not Authenthicated')
    error.code = 401
    throw error
  }
  if (!req.file) {
    return res.status(200).json({ message: "No file provided" })
  }

  return res.status(201).json({ message: "file Stored", filePath: req.file.path })

})


app.use('/graphql', graphqlHTTP({
  schema: graphqlSchema,
  rootValue: graphqlResolvers,
  graphiql: true,
  formatError(err) {
    if (!err.originalError) {
      return err
    }

    const data = err.originalError.data
    const message = err.message || 'An err occured'
    const status = err.originalError.code || 500
    return { message: message, status: status, data: data }
  }


}))

app.use((error, req, res, next) => {
  console.log(error)
  const status = error.statusCode || 500
  const message = error.message
  const data = error.data
  return res.status(status).json({ message: message, data: data })
});

mongoose.connect('mongodb+srv://Shafay:shafay123@cluster0.o8604c8.mongodb.net/graphqlmessages').then(result => {
  app.listen(8080);


}).catch(err => {
  console.log(err)
})


