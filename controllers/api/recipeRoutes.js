const router = require('express').Router();
const { Recipe, User, Favorite } = require('../../models');
const withAuth = require('../../utils/auth');

// create recipe
router.post('/', withAuth, async (req, res) => {
  try {
    const newRecipe = await Recipe.create({
      ...req.body,
      user_id: req.session.user_id,
    });

    res.status(200).json(newRecipe);
  } catch (err) {
    res.status(400).json(err);
  }
});


// display recipe
router.get('/:id', async (req, res) => {
  try {
    const recipeData = await Recipe.findByPk(req.params.id, {
      include: [User, Favorite]
    });

    const recipe = recipeData.get({ plain: true });
    
    let favorited;
    let isAuthor;

    // display favoroting if logged in
    if(req.session.logged_in){
      const favsData = await Favorite.findAll({ 
        where: { 
          user_id: req.session.user_id,
          recipe_id: recipe.id,
        },
      });

      const favs = favsData.map((fav) => fav.get({ plain: true }));
      
      favorited = favs.length > 0 ? true : false

      // allow editing if author
      isAuthor = (recipe.user.id == req.session.user_id)
    }

    res.render('recipe', {
      ...recipe,
      favorited,
      isAuthor,
      logged_in: req.session.logged_in
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

// display update form
router.get('/modify/:id', withAuth, async (req, res) => {
  try {
    const recipeData = await Recipe.findByPk(req.params.id, {
      include: [User, Favorite]
    });

    const recipe = recipeData.get({ plain: true });

    if(recipe.user.id == req.session.user_id){

      res.render('modify', {
        ...recipe,
        logged_in: req.session.logged_in
      });
    } else {
      res.render('recipe', {
        ...recipe,
        logged_in: req.session.logged_in
      });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// update recipe
router.put('/:id', withAuth, async (req, res) => {
  try {
    const recipe = await Recipe.update(
      {
        recipe_name: req.body.recipe_name,
        recipe_image: req.body.recipe_image,
        ingredients: req.body.ingredients,
        instructions: req.body.instructions,
      },
      {
        where: {
          id: req.params.id,
          user_id: req.session.user_id,
        },
      }
    );

    res.status(200).json(recipe);
  } catch (err) {
    res.status(400).json(err);
  }
});

// search function
router.post('/search', async (req, res) => {
  try {
    const recipeData = await Recipe.findAll({
      // where: { 
      //   recipe_name: {
      //     [Op.like]: '%Beef%'
      //   }
      // },
      include: [User, Favorite]
    });

    // Serialize data so the template can read it
    const allRecipes = recipeData.map((recipe) => recipe.get({ plain: true }));
    const recipes = allRecipes.reduce(function(filtered, recipe) {
      if (recipe.recipe_name.toLowerCase().indexOf(req.body.searchInput.toLowerCase()) >= 0) {
         filtered.push(recipe);
      }
      return filtered;
    }, []);

    const recipeIds = [];
    for (let i = 0; i < recipes.length; i++) {
      recipeIds.push(recipes[i].id);
    }

    res.send({ 
      recipeIds, 
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

// delete item
router.delete('/:id', withAuth, async (req, res) => {
  try {
    const recipeData = await Recipe.destroy({
      where: {
        id: req.params.id,
        user_id: req.session.user_id,
      },
    });

    if (!recipeData) {
      res.status(404).json({ message: 'No post found with this id!' });
      return;
    }

    res.status(200).json(recipeData);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
