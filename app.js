//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-bhagyashri:Bhagyashri003@cluster0.ommrmw6.mongodb.net/todolistDB", { useNewUrlParser: true});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist"
});

const item2 = new Item({
  name: "Hit the + button to add a new Item"
});

const item3 = new Item({
  name: "<-- hit this to delete an item.>"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

// async function insertlist() {
//   try{
//     await Item.insertMany(defaultItems);
//     console.log("Successfully inserted");
//   }
//   catch(err) {
//     console.log(err);
//   }
// }

// insertlist();

app.get("/", function(req, res) {

  async function findItems() {
    try {
        const foundItems = await Item.find();
        if(foundItems.length === 0) {
          async function insertlist() {
            try{
              await Item.insertMany(defaultItems);
              console.log("Successfully inserted");
            }
            catch(err) {
              console.log(err);
            }
          }

          insertlist();
          res.redirect("/");
        }
        else {
        res.render("list", {listTitle: "Today", newListItems: foundItems});
        }
    } catch (err) {
      console.log(err);
    }
  }

  findItems();


});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  async function findList() {
    try {
        const foundList = await List.findOne({ name: customListName });
        if (!foundList) {
            // create a new list
            const list = new List({
              name: customListName,
              items: defaultItems
            });

            list.save();
            res.redirect("/" + customListName);
        } else {
            res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
        }
    } catch (err) {
        console.error("Error:", err);
    }
  }

  findList();

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    async function findList() {
      try {
          const foundList = await List.findOne({ name: listName });
          
          foundList.items.push(item);
          foundList.save();
              res.redirect("/" + listName);
          } 
      catch (err) {
          console.error("Error:", err);
      }
    }
  
    findList();
  }


});



app.post('/delete', async (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

    // Validate listName and checkedItemId before proceeding
    if (listName == "Today") {
      async function removeItem() {
        try {
          await Item.findByIdAndRemove(checkedItemId);
          console.log("successfully removed");
          
        }
        catch(err) {
          console.log(err);
        }
      }
      removeItem();
      res.redirect("/");
    }
    else {
      try {
        const foundList = await List.findOneAndUpdate(
          { name: listName },
          { $pull: { items: { _id: checkedItemId } } }
        ).exec();

        if (!foundList) {
          return res.status(404).send("List not found");
        }

        res.redirect("/" + listName);
      } catch (err) {
        console.error("Error updating list:", err);
        res.status(500).send("Error updating list");
      }
    }
});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
