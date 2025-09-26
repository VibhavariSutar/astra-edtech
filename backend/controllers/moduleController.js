import Module from '../models/Module.js';

// @desc    Get all modules
// @route   GET /api/modules
export const getModules = async (req, res) => {
  try {
    const modules = await Module.find({ isPublished: true })
      .populate('teacher', 'name email')
      .sort({ order: 1, createdAt: -1 });
    
    res.json(modules);
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Create module
// @route   POST /api/modules
export const createModule = async (req, res) => {
  try {
    const { title, description, content } = req.body;

    const module = await Module.create({
      title,
      description,
      content,
      teacher: req.user._id
    });

    res.status(201).json(module);
  } catch (error) {
    res.status(400).json({ msg: 'Invalid module data' });
  }
};

// @desc    Get teacher's modules
// @route   GET /api/modules/teacher
export const getTeacherModules = async (req, res) => {
  try {
    const modules = await Module.find({ teacher: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json(modules);
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};