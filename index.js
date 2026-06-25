const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
const favRecipeCollection = db.collection("favorites-recipe");
const recipeReportsCollection = db.collection("recipe-reports");
const addFeaturedRecipeCollection = db.collection("feature-added-recipes");

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

    // Fav Recipe post API
    app.post("/favorite-recipes", async (req, res) => {
      const favRecipe = req.body;
      const { recipeId } = favRecipe;

      const existingFav = await favRecipeCollection.findOne({ recipeId });

      if (existingFav) {
        return res.status(409).send({
          message: "Already Added",
        });
      }

      const result = await favRecipeCollection.insertOne(favRecipe);
      res.send({ message: "Added Successfully", result });
    });

    app.get("/favorite-recipes", async (req, res) => {
      try {
        const userEmail = req.query.email;

        if (!userEmail) {
          return res.status(400).send({ message: "Email Not Found" });
        }

        const query = { favEmail: userEmail };
        const result = await favRecipeCollection
          .find(query)
          .sort({
            savedAt: -1,
          })
          .limit(9)
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error });
      }
    });

    // Report Recipe
    // Report Recipe

    // Add Recipe Post API
    app.post("/report-recipe", async (req, res) => {
      const reportRecipe = req.body;
      const result = await recipeReportsCollection.insertOne(reportRecipe);
      // console.log(result);
      res.send(result);
    });

    app.get("/add-featured-recipes", async (req, res) => {
      const cursor = addFeaturedRecipeCollection.find().sort({ updatedAt: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.delete("/delete-user/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };

        const result = await userCollection.deleteOne(query);

        res.send(result);
      } catch (error) {
        res
          .status(500)
          .send({ success: false, message: "Internal Server Error", error });
      }
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

    app.get("/recipe-reports", async (req, res) => {
      const cursor = recipeReportsCollection.find().sort({ reportedAt: 1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.delete("/all-recipes/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };

        const result = await recipesCollection.deleteOne(query);

        res.send(result);
      } catch (error) {
        res
          .status(500)
          .send({ success: false, message: "Internal Server Error", error });
      }
    });

    // Delete Admin Reports
    // Delete Admin Reports

    app.post("/add-featured-recipes", async (req, res) => {
      try {
        const featuredRecipe = req.body;

        const originalRecipeId = featuredRecipe.originalId;

        const existingFeatured = await addFeaturedRecipeCollection.findOne({
          originalId: originalRecipeId,
        });

        if (existingFeatured) {
          return res.status(200).send({
            success: false,
            isDuplicate: true,
            message: "This recipe is already added to the featured list!",
          });
        }

        delete featuredRecipe._id;

        const result =
          await addFeaturedRecipeCollection.insertOne(featuredRecipe);
        res.send({ success: true, insertedId: result.insertedId });
      } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: "Server Error" });
      }
    });

    app.delete("/report-delete-from-admin/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };

        const result = await recipeReportsCollection.deleteOne(query);

        if (result.deletedCount === 1) {
          res.send({
            success: true,
            message: "Report has been deleted successfully.",
          });
        } else {
          res.status(44).send({ success: false, message: "Report not found." });
        }
      } catch (error) {
        res
          .status(500)
          .send({ success: false, message: "Internal Server Error", error });
      }
    });

    app.delete("/recipe-delete-from-own-email/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };

        const result = await recipesCollection.deleteOne(query);

        res.send(result);
      } catch (error) {
        res
          .status(500)
          .send({ success: false, message: "Internal Server Error", error });
      }
    });

    app.delete("/remove-to-fav/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };

        const result = await favRecipeCollection.deleteOne(query);

        res.send(result);
      } catch (error) {
        res
          .status(500)
          .send({ success: false, message: "Internal Server Error", error });
      }
    });

    app.patch("/user/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const { status } = req.body;

        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            status: status,
          },
        };

        const result = await userCollection.updateOne(filter, updatedDoc);

        if (result.modifiedCount > 0 || result.matchedCount > 0) {
          res.send({
            success: true,
            message: `User status updated to ${status}`,
          });
        } else {
          res.status(404).send({ success: false, message: "User not found" });
        }
      } catch (error) {
        console.error("Status update error:", error);
        res
          .status(500)
          .send({ success: false, message: "Internal Server Error" });
      }
    });

    app.patch("/recipe-reports-update/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;

        const filter = { _id: new ObjectId(id) };

        const updateDoc = {
          $set: {
            status: updatedData.status,
          },
        };

        const result = await reportsCollection.updateOne(filter, updateDoc);

        if (result.modifiedCount > 0) {
          res.send({ success: true, message: "Status updated successfully!" });
        } else {
          res.send({ success: false, message: "No changes were made." });
        }
      } catch (error) {
        res
          .status(500)
          .send({ success: false, message: "Internal Server Error" });
      }
    });

    app.get("/featured-recipes", async (req, res) => {
      try {
        const query = { isFeatured: true };

        const result = await recipeCollection.find(query).toArray();

        res.send(result);
      } catch (error) {
        console.error("Error fetching featured recipes:", error);
        res
          .status(500)
          .send({ success: false, message: "Internal Server Error" });
      }
    });
    app.patch("/all-recipes/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const { isFeatured } = req.body;

        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            isFeatured: isFeatured,
          },
        };

        const result = await recipeCollection.updateOne(filter, updatedDoc);

        if (result.modifiedCount > 0 || result.matchedCount > 0) {
          res.send({
            success: true,
            message: "Recipe status updated successfully",
          });
        } else {
          res.status(404).send({ success: false, message: "Recipe not found" });
        }
      } catch (error) {
        console.error("Feature update error:", error);
        res
          .status(500)
          .send({ success: false, message: "Internal Server Error" });
      }
    });

    // ১. রেসিপির isFeatured টগল করার রাউট (PATCH)
    app.patch("/all-recipes/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const { isFeatured } = req.body; // ফ্রন্টঅ্যান্ড থেকে true অথবা false আসবে

        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            isFeatured: isFeatured, // মঙ্গোডিতে 'isFeatured' ফিল্ড আপডেট হবে
          },
        };

        // ✅ ফিক্সড: কালেকশনের নাম recipesCollection করা হয়েছে
        const result = await recipesCollection.updateOne(filter, updatedDoc);

        if (result.modifiedCount > 0 || result.matchedCount > 0) {
          res.send({
            success: true,
            message: "Recipe status updated successfully",
          });
        } else {
          res.status(404).send({ success: false, message: "Recipe not found" });
        }
      } catch (error) {
        console.error("Feature update error:", error);
        res
          .status(500)
          .send({ success: false, message: "Internal Server Error" });
      }
    });
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
