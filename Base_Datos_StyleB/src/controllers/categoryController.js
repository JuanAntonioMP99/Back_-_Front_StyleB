import Category from "../models/Category.js";

const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().populate("parentCategory");
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id).populate("parentCategory");
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json(category);
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description, imageURL, parentCategory } = req.body;
    
    const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(409).json({ message: "Esta categoria ya existe" });
        }
    
    const newCategory = await Category.create({
      name,
      description,
      imageURL,
      parentCategory: parentCategory || null,
    });
    await newCategory.populate("parentCategory");
    res.status(201).json(newCategory);
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, imageURL, parentCategory } = req.body;
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { name, description, imageURL, parentCategory: parentCategory || null },
      { new: true }
    ).populate("parentCategory");
    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json(updatedCategory);
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
