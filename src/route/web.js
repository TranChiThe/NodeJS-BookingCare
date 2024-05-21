import express from "express"
import homeController from "../controllers/homeController";

let router = express.Router();

let initWebRouter = (app) => {
    router.get("/", homeController.getHomePage);
    router.get("/about", homeController.getAboutPage);
    // Route CRUD
    router.get("/crud", homeController.getCRUD);
    router.post("/post-crud", homeController.postCRUD);
    router.get("/get-crud", homeController.displayGetCRUD);


    return app.use('/', router);
}

module.exports = initWebRouter;