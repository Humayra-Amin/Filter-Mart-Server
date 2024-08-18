const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5000", "https://filter-mart.web.app/"],
}));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9jkswbp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server
    // await client.connect();

    const productCollection = client.db('FilterMart').collection('products');

    app.get('/products', async (req, res) => {
      const result = await productCollection.find().toArray();
      res.send(result);
    });

    // Pagination
    app.get('/allProducts', async (req, res) => {
      const size = parseInt(req.query.size);
      const page = parseInt(req.query.page) - 1;
      const brand = req.query.brand;
      const category = req.query.category;
      const priceRange = req.query.priceRange;
      const search = req.query.search || '';
      const sort = req.query.sort || '';

      
      let filter = {};
      if (brand) {
        filter.brand = brand;
      }
      if (category) {
        filter.category = category;
      }
      if (priceRange) {
        const [minPrice, maxPrice] = priceRange.split('-').map(Number);
        filter.price = { $gte: minPrice, $lte: maxPrice };
      }
     
      if (search) {
        filter.name = { $regex: new RegExp(search, 'i') };
      }
      // Sorting
      let sortOptions = {};
      if (sort === 'price-asc') {
        sortOptions.price = 1;
      } else if (sort === 'price-desc') {
        sortOptions.price = -1;
      } else if (sort === 'date-desc') {
        sortOptions.dateAdded = -1;
      }

      const result = await productCollection.find(filter).sort(sortOptions).skip(page * size).limit(size).toArray();
      res.send(result);
    });

  
    app.get('/productsCount', async (req, res) => {
      const brand = req.query.brand;
      const category = req.query.category;
      const priceRange = req.query.priceRange;
      const search = req.query.search || '';

      // Filter
      let filter = {};
      if (brand) {
        filter.brand = brand;
      }
      if (category) {
        filter.category = category;
      }
      if (priceRange) {
        const [minPrice, maxPrice] = priceRange.split('-').map(Number);
        filter.price = { $gte: minPrice, $lte: maxPrice };
      }
      if (search) {
        filter.name = { $regex: new RegExp(search, 'i') };
      }
      const count = await productCollection.countDocuments(filter);
      res.send({ count });
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error(error);
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Mart Server Started');
});

app.listen(port, () => {
  console.log(`Mart started on http://localhost:${port}`);
});
