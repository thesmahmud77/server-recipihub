const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const port = process.env.PORT || 8080;

// middleware
app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://recipihub:KbWxMfA3ePfkwKAL@cluster0.w4xj3al.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const db = client.db("RecipeHub");
const featuredCollection = db.collection("featured");
const recipesCollection = db.collection("recipes");
const userCollection = db.collection("user");

async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();

    app.get("/featured", async (req, res) => {
      const cursor = featuredCollection.find().sort({ updatedAt: -1 }).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/recipes-category", async (req, res) => {
      try {
        const recipeCategories = await recipesCollection.distinct("category");
        res.send(recipeCategories);
      } catch (error) {
        console.error("Failed to fetch recipe categories:", error);
        res.status(500).send({ error: "Failed to fetch recipe categories" });
      }
    });
    app.get("/recipes", async (req, res) => {
      const cursor = recipesCollection.find().sort({ createdAt: -1 }).limit(8);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/all-recipes", async (req, res) => {
      const cursor = recipesCollection.find().sort({ createdAt: 1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/recipes/:id", async (req, res) => {
      try {
        const { ObjectId } = require("mongodb");
        const recipe = await recipesCollection.findOne({
          _id: new ObjectId(req.params.id),
        });
        if (!recipe) return res.status(404).send({ error: "Recipe not found" });
        res.send(recipe);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch recipe" });
      }
    });

    // Related recipes by category
    app.get("/recipes-related/:category", async (req, res) => {
      try {
        const recipes = await recipesCollection
          .find({ category: req.params.category })
          .limit(4)
          .toArray();
        res.send(recipes);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch related recipes" });
      }
    });

    // My Recipe Data base on Login email
    app.get("/my-recipes", async (req, res) => {
      try {
        const userEmail = req.query.email;

        if (!userEmail) {
          return res.status(400).send({ message: "Email Not Found" });
        }

        const query = { authorEmail: userEmail };
        const result = await recipesCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error });
      }
    });

    // Add Recipe Post API
    app.post("/add-recipe", async (req, res) => {
      const newRecipe = req.body;
      const result = await recipesCollection.insertOne(newRecipe);
      // console.log(result);
      res.send(result);
    });

    // Admin API
    // Admin API
    // Admin API
    // Admin API

    app.get("/user", async (req, res) => {
      const cursor = userCollection.find().sort({ updatedAt: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Smart server running from listen port:${port}`);
});
