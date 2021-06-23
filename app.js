//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();


app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.set("view engine", "ejs");

//DB CONECTION
mongoose.connect("mongodb+srv://Admin-Gio:Mongodbadminillidan97.@cluster0.tx8fr.mongodb.net/toDoListDB",  { useNewUrlParser: true, useUnifiedTopology: true});

//SCHEMA AND ITEM CREATION
const itemSchema = new mongoose.Schema({
  name: String,
});

const Item = new mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to your To Do List!",
});

const item2 = new Item({
  name: "Click the + button to add a new item",
});

const item3 = new Item({
  name: "<--- Click here to delete an item",
});

const defaultItems = [item1, item2, item3];

//NEW LIST SCHEMA (FOR CUSTOM ROUTE)
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema],
});

const List = new mongoose.model("List", listSchema);

/* //GETTING ACTUAL DATE
let today = new Date();
  let options = {
    weekday: "long",
    day: "numeric",
    month: "long",
  };
  let day = today.toLocaleDateString("en-US", options); */

//HOME PAGE RENDER
app.get("/", (req, res)=>{

  Item.find((err, items)=>{
    if (items.length === 0) {
      Item.insertMany(defaultItems, (err)=>{
        if (err) {
          console.log(err)
        } else {
          console.log("Items succefully added");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: items});
  };
});
});

// CUSTOM ROUTE RENDER
app.get("/:customListRoute", (req, res)=>{
  const customListRoute = _.capitalize(req.params.customListRoute);
  
    //Searching for existing list with custom name (route)
  List.findOne({name:customListRoute}, (err, foundList)=>{
    if (!err) {
      if (!foundList) {
        //Create list
        const list = new List({
          name: customListRoute,
          items: defaultItems, 
        });
        list.save();
        res.redirect("/" + customListRoute);
      } else {
        //Show list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  })
  
});

//ADDING NEW ITEMS
app.post("/", (req, res)=>{

  const itemName = req.body.newItem; //register input value
  const listName = req.body.list; //register custom list name (button value)

  const newItem = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else{
    List.findOne({name: listName}, (err, foundList)=>{
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
  
  
})

//DELETING ITEMS
app.post("/delete", (req, res)=> {
  const checkedItemId = req.body.checkedItem;
  const currentList = req.body.listName;

  if (currentList === "Today") {
    Item.findByIdAndRemove(checkedItemId, (err)=>{
      console.log("Item deleted");
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      {name:currentList}, 
      {$pull: {items: {_id:checkedItemId}}},
      (err, foundList)=>{
        if (!err) {
          res.redirect("/" + currentList);
        }
    })
  }
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, ()=>{
  console.log("Server running on port 3000");
});
