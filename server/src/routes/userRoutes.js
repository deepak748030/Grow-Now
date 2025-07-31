import express from "express";
import {
    createUser,
    getUser,
    updateUser,
    deleteUser,
    updateUserDetails,
    getAllUser,
    assignFranchiseToUser,
    toggleBlockUser,
    addBalanceToUser,
} from "../controllers/userController.js";

const router = express.Router();

router.post("/", createUser); // Create User
router.get("/:id", getUser); // Read User by ID
router.put("/:id", updateUser); // Update User
router.patch("/:id", updateUserDetails); // Update User Details
router.delete("/:id", deleteUser); // Delete User
router.get("/", getAllUser); // Get All Users
router.patch("/assign-franchise/:userId", assignFranchiseToUser);
router.patch("/toggle-block/:userId", toggleBlockUser);
router.post("/add-balance", addBalanceToUser);


export default router;
