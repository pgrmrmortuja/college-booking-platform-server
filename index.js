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



    //College related api----------------------

    app.get('/colleges', async (req, res) => {
      const result = await collegeCollection.find().toArray();
      res.send(result);
    });

    app.get('/agent-property/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { agent_email: email };
      const result = await propertyCollection.find(filter).toArray();
      res.send(result);
    })

    app.get('/college/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await collegeCollection.findOne(query);
      res.send(result);
    })


    app.get('/status/:verification_status', async (req, res) => {
      const verification_status = req.params.verification_status;
      const query = { verification_status: verification_status };
      const result = await propertyCollection.find(query).toArray();
      res.send(result);
    })


    app.post('/properties', async (req, res) => {
      const property = req.body;
      const result = await propertyCollection.insertOne(property);
      res.send(result);
    });


    app.put('/property-id/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const update = req.body;
      const property = {
        $set: {
          property_title: update.property_title,
          property_location: update.property_location,
          property_details: update.property_details,
          price_range: {
            minimum_price: parseFloat(update.price_range?.minimum_price),
            maximum_price: parseFloat(update.price_range?.maximum_price),
          },
          property_image: update.property_image,

        }

      }

      const result = await propertyCollection.updateOne(filter, property, options);
      res.send(result);
    })

    app.patch('/property-id/:id', async (req, res) => {
      const id = req.params.id;
      const { verification_status } = req.body; // Verified or Rejected
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          verification_status: verification_status
        }
      }

      const result = await propertyCollection.updateOne(filter, updatedDoc);
      res.send(result);

    });

    app.delete('/properties/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await propertyCollection.deleteOne(query);
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
      const result = await admissionCollection.insertOne(admission);
      res.send(result);
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




    //wishlist related api-----------------------

    app.get('/wishlists/check/:id', async (req, res) => {
      const { id } = req.params;
      const { userEmail } = req.query;

      const exists = await wishlistCollection.findOne({
        myPropertyId: id,
        userEmail: userEmail
      });

      if (exists) {
        res.send({ exists: true });
      } else {
        res.send({ exists: false });
      }
    });

    app.get('/wishlist-id/:id', async (req, res) => {
      const id = req.params.id;
      const query = { myPropertyId: id };
      const result = await wishlistCollection.findOne(query);
      res.send(result);
    })

    app.get('/my-wishlist/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { userEmail: email };
      const result = await wishlistCollection.find(filter).toArray();
      res.send(result);
    })

    app.post('/wishlists', async (req, res) => {
      const myProperty = req.body;
      const result = await wishlistCollection.insertOne(myProperty);
      res.send(result);
    });

    app.delete('/remove-wishlist/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await wishlistCollection.deleteOne(query);
      res.send(result);
    })


    //offer related api--------------------------------

    app.get('/user-offers-id/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await offerCollection.findOne(query);
      res.send(result);
    })

    app.get('/user-offers/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { buyer_email: email };
      const result = await offerCollection.find(filter).toArray();
      res.send(result);
    })

    app.get('/agent-offers/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { agent_email: email };
      const result = await offerCollection.find(filter).toArray();
      res.send(result);
    })

    app.post('/offers', async (req, res) => {
      const offerData = req.body;
      const result = await offerCollection.insertOne(offerData);
      res.send(result);
    });

    app.patch('/offer-status/:id', async (req, res) => {
      const id = req.params.id;
      const { status, myPropertyId } = req.body;
      // Verified or Rejected
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: status
        }
      }

      const result = await offerCollection.updateOne(filter, updatedDoc);

      if (status === "accepted") {
        const rejectFilter = {
          myPropertyId: myPropertyId,
          _id: { $ne: new ObjectId(id) }
        };
        const rejectUpdate = { $set: { status: "rejected" } };
        await offerCollection.updateMany(rejectFilter, rejectUpdate);
      }


      res.send(result);

    });




    //reviews related api--------------------------------

    app.get('/reviews', async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    });

    app.get('/review-id/:myPropertyId', async (req, res) => {
      const myPropertyId = req.params.myPropertyId;
      const query = { myPropertyId: myPropertyId };
      const result = await reviewCollection.find(query).toArray();
      res.send(result);
    })

    app.get('/my-review/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { reviewer_email: email };
      const result = await reviewCollection.find(filter).toArray();
      res.send(result);
    })


    app.post('/reviews', async (req, res) => {
      const property = req.body;
      const result = await reviewCollection.insertOne(property);
      res.send(result);
    });

    app.delete('/remove-review/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    })



    //advertise related api-----------------

    app.get('/is-advertised/:id', async (req, res) => {
      const propertyId = req.params.id;
      const exists = await advertiseCollection.findOne({ _id: propertyId });

      if (exists) {
        res.send({ advertised: true });
      } else {
        res.send({ advertised: false });
      }
    });

    app.get('/advertised-properties', async (req, res) => {
      const advertisedProperties = await advertiseCollection.find({}, { _id: 1 }).toArray();
      const advertisedIds = advertisedProperties.map(p => p._id);
      res.send(advertisedIds);
    });

    app.get('/ad-details/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await advertiseCollection.findOne(query);
      res.send(result);
    })

    app.get('/advertise-limited', async (req, res) => {
      const limit = parseInt(req.query.limit) || 4;
      const cursor = advertiseCollection.find()
        .sort({ createdAt: -1 })
        .limit(limit);

      const result = await cursor.toArray();
      res.send(result);
    });


    app.post('/advertise', async (req, res) => {
      const property = req.body;
      property.createdAt = new Date();

      const result = await advertiseCollection.insertOne(property);
      res.send(result);
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

