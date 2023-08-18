const express = require('express')
const app = express()
const mongoose = require('mongoose');
const _ = require('lodash');    // Lodash convention the name is "_"

app.use(express.urlencoded({ extended :false}))
app.use(express.static('public'))

app.set('view engine', 'ejs')

// mongoose
main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb+srv://musa:5EX1IEKkwojM7RAO@cluster0.h07q12i.mongodb.net/todolistDB');
  

  // Create a schema
  const itemsSchema = new mongoose.Schema({
    name: String
  });

  // Create a Model
  const Item = mongoose.model('item', itemsSchema);

  // Create a Document of data
  const item1 = new Item({ name: "Welcome to Musa's TodoList." });
  const item2 = new Item({ name: 'Hit the + button to add items.' });
  const item3 = new Item({ name: '<= Hit this to delete an item.' });

  const defaultItems = [item1,item2,item3];

  const listSchema = {
    name: String,
    items: [itemsSchema]   //Relation / or Embetting a list of itemsSchema
  }

  const List = mongoose.model("List", listSchema);


  // Home route
  app.get('/', async function (req, res) {

    const allItems = await Item.find({});
    if(allItems.length === 0){      //If our allItem list is empty then add the intial 3 items.
  
      // !insert to mongodb

      Item.insertMany(defaultItems)
      .then(() => {
        console.log("Succesfully inserted.");
      })
      .catch((error) => {
        console.error('Error inserting documents:', error);
      });
      res.redirect('/');
    }else{
      res.render("list", {listTitle: "Today",listItems: allItems})
    }

  })

  // New todolist route with parametes
  app.get("/:newList", async function(req, res){
    const newListName = _.capitalize(req.params.newList)

    List.findOne({name: newListName})
      .then(async foundList =>{
        if(!foundList){
          // create new list collection data
          const list = new List({
            name: newListName,
            items: defaultItems
          })
          await list.save()
          res.redirect("/"+newListName)
        }else{
          res.render("list",{listTitle:foundList.name, listItems:foundList.items});
        }
      })
      .catch(err =>{
        console.log("Eroor While fetching data "+ err);
      })

    


  })
    

  // When we press submit it will got to home route because we put it like that in  form action
  // Home route for post
  app.post('/', async function (req, res) {   //The reason we use async function, inside function we use await
    const itemName = req.body.newItem
    const listName = req.body.list
    
    const customListName = new Item({ name: itemName });

    if (listName === "Today"){
      await customListName.save()
      res.redirect('/')
    }else{
      List.findOne({name: listName})
      .then(async foundList =>{
        foundList.items.push(customListName)
        foundList.save()
        res.redirect("/"+ listName)  //This will take us to the New todolist route with parametes
      })
    }
    
    
  })


  


  //Delete Route
  app.post("/delete", async function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today"){

      if(checkedItemId != undefined){
        await Item.findByIdAndRemove(checkedItemId)
        res.redirect('/')
      }
    }else{ 
      await List.findOneAndUpdate( { name: listName },   // WE use mongogse method called pulle here but we can use for each and check remore 
        { $pull: { items: { _id: checkedItemId } } } );   // and there are  many ways to do this
      res.redirect("/" + listName);
    }
    // Search this and go to stack overflow easy to understand => "MongoDB, remove object from array"

    
  })





}




app.listen(3000, function(){
    console.log("Server has started.");
})

