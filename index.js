const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dk8ve.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri);

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const collegeCollection = client.db("collegeDB").collection("colleges");
    const admissionCollection = client.db("collegeDB").collection("admission");
    const reviewCollection = client.db("collegeDB").collection("reviews");
    const userCollection = client.db("collegeDB").collection("users");


    //User Related Api---------------------------
    // app.get('/users', async (req, res) => {
    //   const result = await userCollection.find().toArray();
    //   res.send(result);
    // });

    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email });
      res.send(user);
    });


    app.post('/users', async (req, res) => {
      const user = req.body;
      const existingUser = await userCollection.findOne({ email: user.email });

      if (existingUser) {
        return res.status(200).send({ message: 'User already exists' });
      }

      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.patch("/users/:id", async (req, res) => {
      const { id } = req.params;
      const updatedFields = req.body;

      const result = await userCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedFields }
      );

      res.send(result);
    });



    //College related api----------------------

    app.get('/colleges', async (req, res) => {
      const result = await collegeCollection.find().toArray();
      res.send(result);
    });

    app.get("/search-colleges", async (req, res) => {
      const search = req.query.search || "";
      let query = {};

      if (search) {
        query.name = { $regex: search, $options: "i" }; // case-insensitive search
      }

      const result = await collegeCollection.find(query).toArray();
      res.send(result);
    });


    app.get('/college/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await collegeCollection.findOne(query);
      res.send(result);
    })


    // Admission Related Api------------------------------

    app.get('/my-college/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const result = await admissionCollection.find(filter).toArray();
      res.send(result);
    })

    app.post('/admission', async (req, res) => {
      const admission = req.body;
      const { email, college_name, dob, address, phone } = admission;

      try {
        // 1️⃣ Save to admissionCollection
        const result = await admissionCollection.insertOne(admission);

        // 2️⃣ Update userCollection with extra fields (dob, address, phone)
        const filter = { email };
        const updateDoc = {
          $set: {
            college_name,
            dob,
            address,
            phone
          }
        };
        await userCollection.updateOne(filter, updateDoc);

        res.send(result);
      } catch (error) {
        console.error('Error saving admission or updating user:', error);
        res.status(500).send({ message: 'Something went wrong' });
      }
    });


    //Reviews Related Api------------------------------

    // app.post('/review', async (req, res) => {
    //   const review = req.body;

    //   // রিভিউ কালেকশনে নতুন রিভিউ সংরক্ষণ
    //   const insertResult = await reviewCollection.insertOne(review);

    //   // কলেজ আইডি দিয়ে কলেজ কালেকশন থেকে তথ্য নাও
    //   const collegeId = review.collegeId;
    //   const college = await collegeCollection.findOne({ _id: new ObjectId(collegeId) });

    //   // পুরনো রেটিং (string হলে number এ কনভার্ট করো)
    //   const oldRating = parseFloat(college.rating) || 0;
    //   const newRating = parseFloat(review.rating) || 0;

    //   // গড় রেটিং ক্যালকুলেট করো
    //   const updatedRating = ((oldRating + newRating) / 2).toFixed(1);

    //   // কলেজ কালেকশন আপডেট করো
    //   await collegeCollection.updateOne(
    //     { _id: new ObjectId(collegeId) },
    //     { $set: { rating: updatedRating } }
    //   );

    //   res.send(insertResult);
    // });

    app.post('/review', async (req, res) => {
      const review = req.body;

      // Step 1: Insert new review into reviewCollection
      const insertResult = await reviewCollection.insertOne(review);

      // Step 2: Get college info
      const collegeId = review.collegeId;
      const college = await collegeCollection.findOne({ _id: new ObjectId(collegeId) });

      const oldRating = parseFloat(college?.rating) || 0;
      const ratingCount = parseInt(college?.rating_count) || 0;
      const newRating = parseFloat(review.rating) || 0;

      // Step 3: Calculate updated average rating
      const updatedRating = ((oldRating * ratingCount + newRating) / (ratingCount + 1)).toFixed(1);

      // Step 4: Update collegeCollection with new average rating and increment rating_count
      const updateResult = await collegeCollection.updateOne(
        { _id: new ObjectId(collegeId) },
        {
          $set: { rating: updatedRating },
          $inc: { rating_count: 1 }
        }
      );

      // Step 5: Respond to client
      res.send({
        insertedId: insertResult.insertedId,
        updatedRating,
        updateResult
      });
    });



    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('College is here')
})

app.listen(port, () => {
  console.log(`College is looked for booking on port ${port}`);
})

